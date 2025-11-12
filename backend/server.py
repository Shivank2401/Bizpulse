from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv, find_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
from io import StringIO
from azure.storage.blob import BlobServiceClient
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
# from emergentintegrations.llm.chat import LlmChat, UserMessage  # Package not available
import openai
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
# Load nearest .env (backend/.env preferred). This works even if cwd differs.
_dotenv_path = find_dotenv(str(ROOT_DIR / '.env')) or find_dotenv()
if _dotenv_path:
    load_dotenv(_dotenv_path)
    logging.getLogger(__name__).info(f"Loaded environment from: {_dotenv_path}")
else:
    logging.getLogger(__name__).warning("No .env file found. Relying on process env vars.")

# MongoDB connection
mongo_url = os.getenv('MONGO_URL')
db_name = os.getenv('DB_NAME')
if not mongo_url or not db_name:
    raise RuntimeError(
        "Missing required environment variables. Make sure backend/.env exists and has MONGO_URL and DB_NAME."
    )
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Azure Blob Storage setup
AZURE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_CONTAINER_NAME = os.getenv('AZURE_CONTAINER_NAME')
AZURE_BLOB_PATH = os.getenv('AZURE_BLOB_PATH')

# JWT Secret
JWT_SECRET = os.getenv('JWT_SECRET', 'thrive-brands-biz-pulse-secret-2024')
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

# Scheduler for periodic sync
scheduler = BackgroundScheduler()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str

class BusinessDataRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    Year: int
    Month_Name: str
    Brand_Type_Name: Optional[str] = None
    PL_Brand: Optional[str] = None
    PL_Category: Optional[str] = None
    SubCat_Name: Optional[str] = None
    Attribute_Name: Optional[str] = None
    SKU_Channel_Name: Optional[str] = None
    PL_Cust_Grp: Optional[str] = None
    Units: Optional[float] = 0
    Revenue: Optional[float] = 0
    Price_Downs: Optional[float] = 0
    Perm_Disc: Optional[float] = 0
    Group_Cost: Optional[float] = 0
    LTA: Optional[float] = 0
    Gross_Profit: Optional[float] = 0
    Business: Optional[str] = None
    Channel: Optional[str] = None
    Customer: Optional[str] = None
    Brand: Optional[str] = None
    Category: Optional[str] = None
    Sub_Cat: Optional[str] = None
    Board_Category: Optional[str] = None

class AIConversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_message: str
    ai_response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default-session"

class AIChatResponse(BaseModel):
    response: str
    session_id: str

class SyncStatusResponse(BaseModel):
    status: str
    message: str
    records_count: int

# Helper Functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def load_data_from_azure_blob() -> int:
    if not (AZURE_CONNECTION_STRING and AZURE_CONTAINER_NAME and AZURE_BLOB_PATH):
        logger.warning("Azure Blob config not set. Skipping Azure sync.")
        return 0
    try:
        logger.info(f"Downloading CSV from Azure: container={AZURE_CONTAINER_NAME}, path={AZURE_BLOB_PATH}")
        blob_service = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
        container_client = blob_service.get_container_client(AZURE_CONTAINER_NAME)
        blob_client = container_client.get_blob_client(AZURE_BLOB_PATH)
        stream = blob_client.download_blob()
        csv_bytes = stream.readall()
        csv_text = csv_bytes.decode('utf-8', errors='ignore')
        df = pd.read_csv(StringIO(csv_text))

        # Normalize column names to expected schema
        rename_map = {
            'Month': 'Month_Name',
            'MonthName': 'Month_Name',
            'month_name': 'Month_Name',
            'Sub_Category': 'Sub_Cat',
            'SubCat': 'Sub_Cat',
            'sub_cat': 'Sub_Cat',
            'Brand_Type': 'Brand_Type_Name',
            'PL Brand': 'PL_Brand',
            'PL Category': 'PL_Category',
            'SKU Channel Name': 'SKU_Channel_Name',
            'PL Cust Grp': 'PL_Cust_Grp',
            'gSales': 'Revenue',
            'fGP': 'Gross_Profit',  # Fixed: was 'GrossProfit'
            'Cases': 'Units',       # Fixed: added Cases -> Units mapping
        }
        df = df.rename(columns=rename_map)

        # Ensure required columns exist
        required = ['Year', 'Month_Name']
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Required column missing in CSV: {col}")

        # Coerce numeric columns used downstream
        for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # Convert to list of dicts and insert
        records = df.to_dict(orient='records')
        if not records:
            logger.warning("Azure CSV contained no records.")
            return 0

        # Clean collection then insert
        await db.business_data.delete_many({})
        # Insert in batches to avoid large payloads
        batch_size = 5000
        total = 0
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            await db.business_data.insert_many(batch)
            total += len(batch)

        logger.info(f"Loaded {total} records from Azure CSV into MongoDB")
        return total
    except Exception as e:
        logger.error(f"Azure sync failed: {e}")
        return 0

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize default user only
    logger.info("Application startup...")
    
    # Create default user if not exists
    existing_user = await db.users.find_one({"email": "data.admin@thrivebrands.ai"})
    if not existing_user:
        password_hash = bcrypt.hashpw("123456User".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(email="data.admin@thrivebrands.ai", password_hash=password_hash)
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        logger.info("Default user created")
    
    # Create admin user if not exists
    existing_admin = await db.users.find_one({"email": "admin@thrivebrands.ai"})
    if not existing_admin:
        password_hash = bcrypt.hashpw("Thrive@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(email="admin@thrivebrands.ai", password_hash=password_hash)
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        logger.info("Admin user created")
    
    # Verify data exists in MongoDB; if empty try Azure sync
    count = await db.business_data.count_documents({})
    if count == 0:
        logger.info("No data in MongoDB. Attempting Azure CSV load...")
        loaded = await load_data_from_azure_blob()
        count = await db.business_data.count_documents({})
        if loaded > 0:
            logger.info(f"Data loaded from Azure. Records now available: {count}")
        else:
            logger.warning("⚠️ Azure load skipped/failed. You can run /api/data/sync after fixing config or use generate_dummy_data.py")
    else:
        logger.info(f"MongoDB already has data: {count} records")
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    client.close()
    logger.info("Application shutdown")

# Create the main app
app = FastAPI(lifespan=lifespan)

# Add CORS middleware BEFORE router (so error responses have CORS headers)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(request.password.encode('utf-8'), user_doc['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = jwt.encode(
        {"email": request.email, "exp": datetime.now(timezone.utc).timestamp() + 86400},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return LoginResponse(token=token, email=request.email)

@api_router.get("/data/sync", response_model=SyncStatusResponse)
async def trigger_sync(email: str = Depends(get_current_user)):
    try:
        loaded = await load_data_from_azure_blob()
        count = await db.business_data.count_documents({})
        message = "Loaded from Azure" if loaded > 0 else "Azure load skipped/failed; collection unchanged"
        return SyncStatusResponse(status="success", message=message, records_count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/data/source")
async def get_data_source(email: str = Depends(get_current_user)):
    """Returns metadata about the current data source and sample records"""
    try:
        count = await db.business_data.count_documents({})
        if count == 0:
            return {
                "source": "none",
                "message": "No data in MongoDB",
                "records_count": 0,
                "sample_records": []
            }
        
        # Get a sample record to show data structure
        sample = await db.business_data.find_one({}, {"_id": 0})
        
        # Convert NaN/Inf values to None for JSON serialization
        if sample:
            import math
            sample = {k: (None if isinstance(v, float) and (math.isnan(v) or math.isinf(v)) else v) 
                     for k, v in sample.items()}
        
        # Check if this looks like dummy data or real data
        is_dummy = False
        if sample:
            # Check for dummy data indicators
            if 'dummy' in str(sample).lower() or 'test' in str(sample).lower():
                is_dummy = True
            # Check for realistic data patterns
            if 'Year' in sample and sample.get('Year', 0) > 2020:
                is_dummy = False
        
        return {
            "source": "dummy" if is_dummy else "azure",
            "message": "Using dummy data" if is_dummy else "Using Azure CSV data",
            "records_count": count,
            "sample_records": [sample] if sample else [],
            "columns": list(sample.keys()) if sample else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/executive-overview")
async def get_executive_overview(
    years: str = None,
    months: str = None,
    businesses: str = None,
    channels: str = None,
    email: str = Depends(get_current_user)
):
    """Executive Overview - YoY comparison, KPIs with multi-select filters"""
    logger.info("🔍 GET /api/analytics/executive-overview called")
    try:
        # Build query based on multi-select filters
        query = {}
        
        if years:
            year_list = [int(y.strip()) for y in years.split(',') if y.strip()]
            if year_list:
                query['Year'] = {'$in': year_list}
        
        if months:
            month_list = [m.strip() for m in months.split(',') if m.strip()]
            if month_list:
                query['Month_Name'] = {'$in': month_list}
        
        if businesses:
            business_list = [b.strip() for b in businesses.split(',') if b.strip()]
            if business_list:
                query['Business'] = {'$in': business_list}
        
        if channels:
            channel_list = [c.strip() for c in channels.split(',') if c.strip()]
            if channel_list:
                query['Channel'] = {'$in': channel_list}
            
        # Helper to handle NaN values in float conversions
        import math
        def safe_float(val):
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return 0.0
            return float(val)
        
        logger.info(f"Query being executed: {query}")
        logger.info(f"🚀 Using MongoDB aggregation pipeline for performance")
        
        # Yearly performance aggregation
        pipeline_yearly = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {
                "_id": "$Year",
                "Revenue": {"$sum": {"$toDouble": "$Revenue"}},
                "Gross_Profit": {"$sum": {"$toDouble": "$Gross_Profit"}},
                "Units": {"$sum": {"$toDouble": "$Units"}}
            }}
        ]
        yearly_results = await db.business_data.aggregate(pipeline_yearly).to_list(100)
        logger.info(f"✅ Yearly aggregation: {len(yearly_results)} records")
        
        yearly_list = []
        for item in yearly_results:
            yearly_list.append({
                "Year": int(item['_id']) if item['_id'] else 0,
                "Revenue": safe_float(item.get('Revenue', 0)),
                "Gross_Profit": safe_float(item.get('Gross_Profit', 0)),
                "Units": safe_float(item.get('Units', 0))
            })
        
        # Business performance aggregation
        pipeline_business = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {
                "_id": "$Business",
                "Revenue": {"$sum": {"$toDouble": "$Revenue"}},
                "Gross_Profit": {"$sum": {"$toDouble": "$Gross_Profit"}},
                "Units": {"$sum": {"$toDouble": "$Units"}}
            }}
        ]
        business_results = await db.business_data.aggregate(pipeline_business).to_list(100)
        logger.info(f"✅ Business aggregation: {len(business_results)} records")
        
        business_list = []
        for item in business_results:
            business_list.append({
                "Business": str(item['_id']) if item['_id'] else "Unknown",
                "Revenue": safe_float(item.get('Revenue', 0)),
                "Gross_Profit": safe_float(item.get('Gross_Profit', 0)),
                "Units": safe_float(item.get('Units', 0))
            })
        
        # Get current year for monthly trend
        pipeline_max_year = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {"_id": None, "maxYear": {"$max": {"$toDouble": "$Year"}}}}
        ]
        max_year_result = await db.business_data.aggregate(pipeline_max_year).to_list(1)
        current_year = int(max_year_result[0]['maxYear']) if max_year_result and max_year_result[0].get('maxYear') else 2024
        
        # Monthly trend for current year
        monthly_query = {**query, "Year": current_year}
        pipeline_monthly = [
            {"$match": monthly_query},
            {"$group": {
                "_id": "$Month_Name",
                "Revenue": {"$sum": {"$toDouble": "$Revenue"}},
                "Gross_Profit": {"$sum": {"$toDouble": "$Gross_Profit"}},
                "Units": {"$sum": {"$toDouble": "$Units"}}
            }}
        ]
        monthly_results = await db.business_data.aggregate(pipeline_monthly).to_list(50)
        logger.info(f"✅ Monthly aggregation: {len(monthly_results)} records")
        
        monthly_list = []
        for item in monthly_results:
            monthly_list.append({
                "Month_Name": str(item['_id']) if item['_id'] else "Unknown",
                "Revenue": safe_float(item.get('Revenue', 0)),
                "Gross_Profit": safe_float(item.get('Gross_Profit', 0)),
                "Units": safe_float(item.get('Units', 0))
            })
        
        # Channel performance aggregation
        pipeline_channel = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {
                "_id": "$Channel",
                "Revenue": {"$sum": {"$toDouble": "$Revenue"}},
                "Gross_Profit": {"$sum": {"$toDouble": "$Gross_Profit"}},
                "Units": {"$sum": {"$toDouble": "$Units"}}
            }}
        ]
        channel_results = await db.business_data.aggregate(pipeline_channel).to_list(100)
        logger.info(f"✅ Channel aggregation: {len(channel_results)} records")
        
        channel_list = []
        for item in channel_results:
            channel_list.append({
                "Channel": str(item['_id']) if item['_id'] else "Unknown",
                "Revenue": safe_float(item.get('Revenue', 0)),
                "Gross_Profit": safe_float(item.get('Gross_Profit', 0)),
                "Units": safe_float(item.get('Units', 0))
            })
        
        # Get totals
        pipeline_totals = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": {"$toDouble": "$Revenue"}},
                "total_profit": {"$sum": {"$toDouble": "$Gross_Profit"}},
                "total_units": {"$sum": {"$toDouble": "$Units"}}
            }}
        ]
        totals_result = await db.business_data.aggregate(pipeline_totals).to_list(1)
        totals = totals_result[0] if totals_result else {}
        
        logger.info(f"✅ Totals calculated: Revenue={totals.get('total_revenue', 0)}, Profit={totals.get('total_profit', 0)}")
        
        return {
            "yearly_performance": yearly_list,
            "business_performance": business_list,
            "monthly_trend": monthly_list,
            "channel_performance": channel_list,
            "total_profit": safe_float(totals.get('total_profit', 0)),
            "total_revenue": safe_float(totals.get('total_revenue', 0)),
            "total_units": safe_float(totals.get('total_units', 0))
        }
    except Exception as e:
        logger.error(f"Executive overview error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/customer-analysis")
async def get_customer_analysis(email: str = Depends(get_current_user)):
    """Customer Analysis - Channel and customer drilldowns"""
    try:
        data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
        df = pd.DataFrame(data)
        
        if df.empty:
            return {"error": "No data available"}
        
        # Ensure numeric columns
        for col in ['Gross_Profit', 'Revenue', 'Units']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Channel-wise analysis
        channel_analysis = df.groupby('Channel').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        channel_analysis['Gross_Profit'] = channel_analysis['Gross_Profit'].astype(float).round(2)
        channel_analysis['Revenue'] = channel_analysis['Revenue'].astype(float).round(2)
        channel_analysis['Units'] = channel_analysis['Units'].astype(float).round(2)
        
        # Customer-wise analysis
        customer_analysis = df.groupby('Customer').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        customer_analysis['Gross_Profit'] = customer_analysis['Gross_Profit'].astype(float).round(2)
        customer_analysis['Revenue'] = customer_analysis['Revenue'].astype(float).round(2)
        customer_analysis['Units'] = customer_analysis['Units'].astype(float).round(2)
        
        # Top 10 customers
        top_customers = customer_analysis.nlargest(10, 'Revenue')
        
        return {
            "channel_performance": channel_analysis.to_dict('records'),
            "customer_performance": customer_analysis.to_dict('records'),
            "top_customers": top_customers.to_dict('records')
        }
    except Exception as e:
        logger.error(f"Customer analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/brand-analysis")
async def get_brand_analysis(
    years: str = None,
    months: str = None,
    businesses: str = None,
    channels: str = None,
    categories: str = None,
    brands: str = None,
    email: str = Depends(get_current_user),
):
    """Brand Analysis - Brand performance by category and channel with optional filters"""
    try:
        def parse_list(value: Optional[str], cast=None):
            if not value:
                return []
            items = []
            for part in value.split(','):
                part = part.strip()
                if not part:
                    continue
                try:
                    items.append(cast(part) if cast else part)
                except Exception:
                    continue
            return items

        query: Dict[str, Any] = {}

        year_list = parse_list(years, int)
        if year_list:
            query['Year'] = {'$in': year_list}

        month_list = parse_list(months)
        if month_list:
            query['Month_Name'] = {'$in': month_list}

        business_list = parse_list(businesses)
        if business_list:
            query['Business'] = {'$in': business_list}

        channel_list = parse_list(channels)
        if channel_list:
            query['Channel'] = {'$in': channel_list}

        category_list = parse_list(categories)
        if category_list:
            query['Category'] = {'$in': category_list}

        brand_list = parse_list(brands)
        if brand_list:
            query['Brand'] = {'$in': brand_list}

        def match_stage():
            return {"$match": query} if query else {"$match": {}}

        def safe_float(value: Any) -> float:
            try:
                if value is None:
                    return 0.0
                if isinstance(value, (int, float)):
                    if pd.isna(value) or pd.isnull(value):
                        return 0.0
                    return float(value)
                return float(value)
            except Exception:
                return 0.0

        # Brand performance aggregation
        pipeline_brand = [
            match_stage(),
            {
                "$group": {
                    "_id": "$Brand",
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "Units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
            {"$sort": {"Revenue": -1}},
        ]
        brand_results = await db.business_data.aggregate(pipeline_brand).to_list(200)
        brand_performance = []
        for item in brand_results:
            brand_performance.append({
                "Brand": str(item.get("_id")) if item.get("_id") else "Unknown",
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
                "Units": safe_float(item.get("Units")),
            })

        # Brand by business aggregation
        pipeline_brand_business = [
            match_stage(),
            {
                "$group": {
                    "_id": {
                        "Brand": "$Brand",
                        "Business": "$Business",
                    },
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                }
            },
            {"$sort": {"Revenue": -1}},
        ]
        brand_business_results = await db.business_data.aggregate(pipeline_brand_business).to_list(500)
        brand_by_business = []
        for item in brand_business_results:
            key = item.get("_id", {})
            brand_by_business.append({
                "Brand": str(key.get("Brand")) if key.get("Brand") else "Unknown",
                "Business": str(key.get("Business")) if key.get("Business") else "Unknown",
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
            })

        # Brand Year-over-Year aggregation
        pipeline_brand_yoy = [
            match_stage(),
            {
                "$group": {
                    "_id": {
                        "Brand": "$Brand",
                        "Year": "$Year",
                    },
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                }
            },
            {"$sort": {"_id.Brand": 1, "_id.Year": 1}},
        ]
        brand_yoy_results = await db.business_data.aggregate(pipeline_brand_yoy).to_list(1000)
        brand_yoy_growth = []
        for item in brand_yoy_results:
            key = item.get("_id", {})
            brand_yoy_growth.append({
                "Brand": str(key.get("Brand")) if key.get("Brand") else "Unknown",
                "Year": int(key.get("Year")) if key.get("Year") else 0,
                "Revenue": safe_float(item.get("Revenue")),
            })

        # Totals and active brands
        pipeline_totals = [
            match_stage(),
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "total_profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "total_units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
        ]
        totals_result = await db.business_data.aggregate(pipeline_totals).to_list(1)
        totals = totals_result[0] if totals_result else {}

        active_brands = sum(
            1 for item in brand_performance
            if item["Brand"] != "Unknown" and item["Revenue"] > 0
        )

        return {
            "brand_performance": brand_performance,
            "brand_by_business": brand_by_business,
            "brand_yoy_growth": brand_yoy_growth,
            "total_revenue": safe_float(totals.get("total_revenue", 0)),
            "total_profit": safe_float(totals.get("total_profit", 0)),
            "total_units": safe_float(totals.get("total_units", 0)),
            "active_brands": active_brands,
        }
    except Exception as e:
        logger.error(f"Brand analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/category-analysis")
async def get_category_analysis(
    years: str = None,
    months: str = None,
    businesses: str = None,
    channels: str = None,
    categories: str = None,
    sub_categories: str = None,
    email: str = Depends(get_current_user),
):
    """Category Analysis - Category and sub-category deep dives with optional filters"""
    try:
        def parse_list(value: Optional[str], cast=None):
            if not value:
                return []
            items = []
            for part in value.split(','):
                part = part.strip()
                if not part:
                    continue
                try:
                    items.append(cast(part) if cast else part)
                except Exception:
                    continue
            return items

        query: Dict[str, Any] = {}

        year_list = parse_list(years, int)
        if year_list:
            query['Year'] = {'$in': year_list}

        month_list = parse_list(months)
        if month_list:
            query['Month_Name'] = {'$in': month_list}

        business_list = parse_list(businesses)
        if business_list:
            query['Business'] = {'$in': business_list}

        channel_list = parse_list(channels)
        if channel_list:
            query['Channel'] = {'$in': channel_list}

        category_list = parse_list(categories)
        if category_list:
            query['Category'] = {'$in': category_list}

        subcategory_list = parse_list(sub_categories)
        if subcategory_list:
            # Handle both Sub_Cat (normalized) and Sub_Category (legacy)
            query['$or'] = [
                {'Sub_Cat': {'$in': subcategory_list}},
                {'Sub_Category': {'$in': subcategory_list}},
            ]

        def match_stage():
            return {"$match": query} if query else {"$match": {}}

        def safe_float(value: Any) -> float:
            try:
                if value is None:
                    return 0.0
                if isinstance(value, (int, float)):
                    if pd.isna(value) or pd.isnull(value):
                        return 0.0
                    return float(value)
                return float(value)
            except Exception:
                return 0.0

        # Category performance aggregation
        pipeline_category = [
            match_stage(),
            {
                "$group": {
                    "_id": "$Category",
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "Units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
            {"$sort": {"Revenue": -1}},
        ]
        category_results = await db.business_data.aggregate(pipeline_category).to_list(200)
        category_performance = []
        for item in category_results:
            category_performance.append({
                "Category": str(item.get("_id")) if item.get("_id") else "Unknown",
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
                "Units": safe_float(item.get("Units")),
            })

        # Sub-category performance aggregation (use Sub_Cat when available)
        pipeline_subcategory = [
            match_stage(),
            {
                "$group": {
                    "_id": {
                        "Sub_Cat": {"$ifNull": ["$Sub_Cat", "$Sub_Category"]},
                        "Category": "$Category",
                    },
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "Units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
            {"$sort": {"Revenue": -1}},
        ]
        subcategory_results = await db.business_data.aggregate(pipeline_subcategory).to_list(500)
        subcategory_performance = []
        for item in subcategory_results:
            key = item.get("_id", {})
            subcategory_performance.append({
                "Sub_Category": str(key.get("Sub_Cat")) if key.get("Sub_Cat") else "Unknown",
                "Category": str(key.get("Category")) if key.get("Category") else "Unknown",
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
                "Units": safe_float(item.get("Units")),
            })

        # Board category performance when available
        pipeline_board = [
            match_stage(),
            {
                "$group": {
                    "_id": "$Board_Category",
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                }
            },
            {"$match": {"_id": {"$ne": None}}},
            {"$sort": {"Revenue": -1}},
        ]
        board_results = await db.business_data.aggregate(pipeline_board).to_list(200)
        board_category_performance = []
        for item in board_results:
            board_category_performance.append({
                "Board_Category": str(item.get("_id")),
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
            })

        # Totals
        pipeline_totals = [
            match_stage(),
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "total_profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "total_units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
        ]
        totals_result = await db.business_data.aggregate(pipeline_totals).to_list(1)
        totals = totals_result[0] if totals_result else {}

        active_categories = sum(
            1 for item in category_performance
            if item["Category"] != "Unknown" and item["Revenue"] > 0
        )

        return {
            "category_performance": category_performance,
            "subcategory_performance": subcategory_performance,
            "board_category_performance": board_category_performance,
            "total_revenue": safe_float(totals.get("total_revenue", 0)),
            "total_profit": safe_float(totals.get("total_profit", 0)),
            "total_units": safe_float(totals.get("total_units", 0)),
            "active_categories": active_categories,
        }
    except Exception as e:
        logger.error(f"Category analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/filters/options")
async def get_filter_options(email: str = Depends(get_current_user)):
    """Get all unique filter options"""
    logger.info("🔍 GET /api/filters/options called")
    try:
        logger.info("📊 Fetching unique values from MongoDB...")
        
        # Use distinct to get unique values - MUCH FASTER than loading all records
        years = await db.business_data.distinct('Year')
        months = await db.business_data.distinct('Month_Name')
        businesses = await db.business_data.distinct('Business')
        channels = await db.business_data.distinct('Channel')
        customers = await db.business_data.distinct('Customer')
        brands = await db.business_data.distinct('Brand')
        categories = await db.business_data.distinct('Category')
        sub_categories = await db.business_data.distinct('Sub_Cat')
        
        logger.info(f"✅ Fetched unique values")
        
        # Filter out None values and convert years to int
        years = sorted([int(y) for y in years if y is not None])
        months = [m for m in months if m is not None]
        businesses = [b for b in businesses if b is not None]
        channels = [c for c in channels if c is not None]
        customers = [c for c in customers if c is not None]
        brands = [b for b in brands if b is not None]
        categories = [c for c in categories if c is not None]
        sub_categories = [s for s in sub_categories if s is not None]
        
        # Sort months chronologically (handle both full names and abbreviations)
        month_order_full = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        month_order_abbr = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        
        def get_month_index(month):
            """Get month index for sorting"""
            if month in month_order_full:
                return month_order_full.index(month)
            elif month in month_order_abbr:
                return month_order_abbr.index(month)
            else:
                return 999
        
        months = sorted(months, key=get_month_index)
        
        result = {
            "years": years,
            "months": months,
            "businesses": businesses,
            "channels": channels,
            "customers": customers,
            "brands": brands,
            "categories": categories,
            "sub_categories": sub_categories
        }
        
        logger.info(f"Filter options generated: {[(k, len(v)) for k, v in result.items()]}")
        return result
    except Exception as e:
        logger.error(f"Error generating filter options: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/filters/options-test")
async def get_filter_options_test():
    """Get all unique filter options - TEST ENDPOINT WITHOUT AUTH"""
    try:
        data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
        logger.info(f"TEST: Retrieved {len(data)} records for filter options")
        
        if not data:
            logger.warning("TEST: No data found for filter options")
            return {}
        
        df = pd.DataFrame(data)
        logger.info(f"TEST: DataFrame shape: {df.shape}")
        logger.info(f"TEST: DataFrame columns: {list(df.columns)}")
        
        if df.empty:
            logger.warning("TEST: DataFrame is empty")
            return {}
        
        result = {
            "years": sorted(df['Year'].dropna().unique().tolist()) if 'Year' in df.columns else [],
            "months": df['Month_Name'].dropna().unique().tolist() if 'Month_Name' in df.columns else [],
            "businesses": df['Business'].dropna().unique().tolist() if 'Business' in df.columns else [],
            "channels": df['Channel'].dropna().unique().tolist() if 'Channel' in df.columns else [],
            "customers": df['Customer'].dropna().unique().tolist() if 'Customer' in df.columns else [],
            "brands": df['Brand'].dropna().unique().tolist() if 'Brand' in df.columns else [],
            "categories": df['Category'].dropna().unique().tolist() if 'Category' in df.columns else [],
            "sub_categories": df['Sub_Cat'].dropna().unique().tolist() if 'Sub_Cat' in df.columns else []
        }
        
        logger.info(f"TEST: Filter options generated: {[(k, len(v)) for k, v in result.items()]}")
        return result
    except Exception as e:
        logger.error(f"TEST: Error generating filter options: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest, email: str = Depends(get_current_user)):
    """AI Chat Assistant for business insights"""
    try:
        # Get business data context
        data = await db.business_data.find({}, {"_id": 0}).to_list(1000)
        df = pd.DataFrame(data)
        
        # Create data summary for AI context
        context = f"""
You are VectorDeep AI, a business intelligence assistant for ThriveBrands. You have access to business data with the following structure:

Data Overview:
- Total Records: {len(df)}
- Years: {df['Year'].unique().tolist() if not df.empty else []}
- Businesses: {df['Business'].unique().tolist() if not df.empty else []}
- Brands: {df['Brand'].unique().tolist()[:10] if not df.empty else []} (showing first 10)
- Total Revenue: ${df['Revenue'].sum():,.2f} if not df.empty else 0
- Total Gross Profit: ${df['Gross_Profit'].sum():,.2f} if not df.empty else 0

You can answer questions about:
- Sales performance and trends
- Brand analysis
- Customer and channel performance
- Category insights
- Year-over-year comparisons

Provide insights with specific numbers when possible. Highlight good performance in your response and provide actionable recommendations.
"""
        
        # Initialize OpenAI client
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        # Send message to OpenAI
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": request.message}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            response_text = response.choices[0].message.content
        except Exception as e:
            response_text = f"Sorry, I'm having trouble connecting to the AI service. Error: {str(e)}"
        
        # Save conversation
        conversation = AIConversation(
            session_id=request.session_id,
            user_message=request.message,
            ai_response=response_text
        )
        conv_dict = conversation.model_dump()
        conv_dict['timestamp'] = conv_dict['timestamp'].isoformat()
        await db.ai_conversations.insert_one(conv_dict)
        
        return AIChatResponse(response=response_text, session_id=request.session_id)
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Run locally with: python server.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )