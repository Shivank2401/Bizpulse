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
import requests
import json
import asyncio

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
    name: Optional[str] = None
    department: Optional[str] = None  # sales, operations, finance, hr, marketing, technology
    role: Optional[str] = None  # VP, Director, Manager, Team Member
    status: str = "active"  # active, inactive
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
    # Make email matching case-insensitive
    email_lower = request.email.lower().strip()
    user_doc = await db.users.find_one({"email": {"$regex": f"^{email_lower}$", "$options": "i"}}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Use the actual email from database for consistency
    actual_email = user_doc.get('email', request.email)
    
    if not bcrypt.checkpw(request.password.encode('utf-8'), user_doc['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = jwt.encode(
        {"email": actual_email, "exp": datetime.now(timezone.utc).timestamp() + 86400},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return LoginResponse(token=token, email=actual_email)

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    department: str  # sales, operations, finance, hr, marketing, technology
    role: str  # VP, Director, Manager, Team Member

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    status: str

@api_router.post("/auth/signup", response_model=UserResponse)
async def signup(request: SignupRequest, email: str = Depends(get_current_user)):
    """Development-only signup endpoint - requires authentication"""
    # Check if in development mode
    is_dev = os.getenv('ENVIRONMENT', 'development').lower() == 'development'
    if not is_dev:
        raise HTTPException(status_code=403, detail="Signup is only available in development mode")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Validate department
    valid_departments = ['sales', 'operations', 'finance', 'hr', 'marketing', 'technology']
    if request.department.lower() not in valid_departments:
        raise HTTPException(status_code=400, detail=f"Invalid department. Must be one of: {', '.join(valid_departments)}")
    
    # Hash password
    password_hash = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    user = User(
        email=request.email,
        password_hash=password_hash,
        name=request.name,
        department=request.department.lower(),
        role=request.role,
        status="active"
    )
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        department=user.department,
        role=user.role,
        status=user.status
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(email: str = Depends(get_current_user)):
    """Get all users/team members"""
    users = await db.users.find({"status": "active"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**user) for user in users]

@api_router.get("/users/by-department/{department}", response_model=List[UserResponse])
async def get_users_by_department(department: str, email: str = Depends(get_current_user)):
    """Get users by department"""
    users = await db.users.find(
        {"department": department.lower(), "status": "active"},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    return [UserResponse(**user) for user in users]

@api_router.get("/users/me", response_model=UserResponse)
async def get_current_user_info(email: str = Depends(get_current_user)):
    """Get current logged-in user information"""
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

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
async def get_customer_analysis(
    years: str = None,
    months: str = None,
    businesses: str = None,
    channels: str = None,
    customers: str = None,
    brands: str = None,
    email: str = Depends(get_current_user),
):
    """Customer Analysis - Channel and customer drilldowns with optional filters"""
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

        customer_list = parse_list(customers)
        if customer_list:
            query['Customer'] = {'$in': customer_list}

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

        # Channel performance aggregation
        pipeline_channel = [
            match_stage(),
            {
                "$group": {
                    "_id": "$Channel",
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "Units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
            {"$sort": {"Revenue": -1}},
        ]
        channel_results = await db.business_data.aggregate(pipeline_channel).to_list(200)
        channel_performance = []
        for item in channel_results:
            channel_performance.append({
                "Channel": str(item.get("_id")) if item.get("_id") else "Unknown",
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
                "Units": safe_float(item.get("Units")),
            })

        # Customer performance aggregation
        pipeline_customer = [
            match_stage(),
            {
                "$group": {
                    "_id": "$Customer",
                    "Revenue": {"$sum": {"$toDouble": {"$ifNull": ["$Revenue", 0]}}},
                    "Gross_Profit": {"$sum": {"$toDouble": {"$ifNull": ["$Gross_Profit", 0]}}},
                    "Units": {"$sum": {"$toDouble": {"$ifNull": ["$Units", 0]}}},
                }
            },
            {"$sort": {"Revenue": -1}},
        ]
        customer_results = await db.business_data.aggregate(pipeline_customer).to_list(1000)
        customer_performance = []
        for item in customer_results:
            customer_performance.append({
                "Customer": str(item.get("_id")) if item.get("_id") else "Unknown",
                "Revenue": safe_float(item.get("Revenue")),
                "Gross_Profit": safe_float(item.get("Gross_Profit")),
                "Units": safe_float(item.get("Units")),
            })

        top_customers = customer_performance[:50]

        # Channel profit margin
        for item in channel_performance:
            revenue = item.get("Revenue", 0)
            profit = item.get("Gross_Profit", 0)
            margin = (profit / revenue) * 100 if revenue else 0
            item["Profit_Margin"] = margin

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

        active_channels = sum(
            1 for item in channel_performance
            if item["Channel"] != "Unknown" and item["Revenue"] > 0
        )

        return {
            "channel_performance": channel_performance,
            "customer_performance": customer_performance,
            "top_customers": top_customers,
            "total_revenue": safe_float(totals.get("total_revenue", 0)),
            "total_profit": safe_float(totals.get("total_profit", 0)),
            "total_units": safe_float(totals.get("total_units", 0)),
            "active_channels": active_channels,
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

# Perplexity API helper function
async def query_perplexity(prompt: str, conversation_history: Optional[List[Dict]] = None) -> str:
    """Query Perplexity API for AI responses"""
    
    PPLX_API_KEY = os.getenv("PPLX_API_KEY1")
    if not PPLX_API_KEY:
        logger.error("PPLX_API_KEY1 environment variable is not set")
        raise ValueError("PPLX_API_KEY1 environment variable is required")
    
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json"
    }
    
    messages = [{
        "role": "system",
        "content": (
            "You are Vector AI, a strategic business intelligence analyst for ThriveBrands. "
            "Analyze the provided business data and generate strategic marketing and business recommendations. "
            "All monetary values are in Euros (€). Be specific, data-driven, and actionable. "
            "Focus on growth opportunities, customer acquisition, retention strategies, and revenue optimization. "
            "Provide recommendations with clear reasoning, expected impact, and implementation channels."
        )
    }]
    
    if conversation_history:
        messages.extend(conversation_history)
    
    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": "sonar-pro",
        "messages": messages,
        "max_tokens": 2000
    }
    
    # Retry logic with exponential backoff
    max_retries = 3
    retry_delay = 1  # Start with 1 second
    
    for attempt in range(max_retries):
        try:
            # Use asyncio.to_thread to run synchronous requests in a thread pool
            def make_request():
                response = requests.post(url, headers=headers, json=payload, timeout=60)  # Increased timeout to 60s
                response.raise_for_status()
                result = response.json()
                if 'choices' not in result or len(result['choices']) == 0:
                    raise ValueError("Invalid response format from Perplexity API")
                return result['choices'][0]['message']['content']
            
            # Run the synchronous request in a thread pool
            result = await asyncio.to_thread(make_request)
            logger.info(f"Perplexity API call successful on attempt {attempt + 1}")
            return result
            
        except requests.exceptions.Timeout as e:
            logger.warning(f"Perplexity API timeout on attempt {attempt + 1}/{max_retries}: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
                continue
            else:
                logger.error(f"Perplexity API timeout after {max_retries} attempts")
                raise HTTPException(status_code=500, detail="AI service timeout. Please try again.")
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Perplexity API request error on attempt {attempt + 1}/{max_retries}: {str(e)}")
            if attempt < max_retries - 1:
                # Check if it's a rate limit or server error (5xx) - retry these
                if hasattr(e, 'response') and e.response is not None:
                    status_code = e.response.status_code
                    if status_code >= 500 or status_code == 429:  # Server error or rate limit
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                # For other errors, don't retry
                logger.error(f"Perplexity API non-retryable error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
            else:
                logger.error(f"Perplexity API request failed after {max_retries} attempts: {str(e)}")
                raise HTTPException(status_code=500, detail=f"AI service error after retries: {str(e)}")
                
        except (KeyError, ValueError) as e:
            logger.error(f"Perplexity API response parsing error: {str(e)}")
            # Don't retry parsing errors
            raise HTTPException(status_code=500, detail=f"AI service response format error: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected Perplexity API error on attempt {attempt + 1}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2
                continue
            else:
                raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    
    # Should never reach here, but just in case
    raise HTTPException(status_code=500, detail="AI service error: Max retries exceeded")

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

# Strategic Recommendations Model
class StrategicRecommendation(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    type: str = "system"
    category: str
    startDate: str
    endDate: Optional[str] = None
    budget: float
    impact: Dict[str, Any]
    reasoning: str
    channels: List[str]
    aiScore: int
    acceptedAt: Optional[str] = None  # When it was accepted to live
    status: Optional[str] = "recommended"  # recommended, live, past

class StrategicRecommendationsResponse(BaseModel):
    recommended: List[StrategicRecommendation]
    live: List[StrategicRecommendation]
    past: List[StrategicRecommendation] = []

class AcceptCampaignRequest(BaseModel):
    campaignId: int
    fromCollection: str  # "recommended"

# Helper function to move expired campaigns from live to past
async def move_expired_campaigns():
    """Move campaigns from live to past if their endDate has passed"""
    try:
        kanban_doc = await db.kanban.find_one({})
        if not kanban_doc:
            return
        
        live_campaigns = kanban_doc.get('live', [])
        past_campaigns = kanban_doc.get('past', [])
        
        current_date = datetime.now(timezone.utc).date()
        expired_campaigns = []
        remaining_live = []
        
        for campaign in live_campaigns:
            if campaign.get('endDate'):
                try:
                    end_date = datetime.fromisoformat(campaign['endDate'].replace('Z', '+00:00')).date()
                    if end_date < current_date:
                        # Campaign has expired, move to past
                        campaign['status'] = 'past'
                        campaign['expiredAt'] = datetime.now(timezone.utc).isoformat()
                        expired_campaigns.append(campaign)
                    else:
                        remaining_live.append(campaign)
                except Exception as e:
                    logger.warning(f"Error parsing endDate for campaign {campaign.get('title')}: {e}")
                    remaining_live.append(campaign)
            else:
                # No end date, keep in live
                remaining_live.append(campaign)
        
        if expired_campaigns:
            # Update MongoDB
            past_campaigns.extend(expired_campaigns)
            await db.kanban.update_one(
                {},
                {"$set": {
                    "live": remaining_live,
                    "past": past_campaigns,
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }}
            )
            logger.info(f"Moved {len(expired_campaigns)} expired campaigns to past")
    except Exception as e:
        logger.error(f"Error moving expired campaigns: {str(e)}")

@api_router.get("/kanban/annual-goal")
async def get_annual_goal(email: str = Depends(get_current_user)):
    """Get real annual goal metrics based on customer activation data"""
    try:
        # Get all business data
        data = await db.business_data.find({}, {"_id": 0}).to_list(10000)
        if not data:
            return {
                "current": 0,
                "target": 100,
                "metric": "% Activated Customers",
                "progress": 0
            }
        
        df = pd.DataFrame(data)
        
        if df.empty:
            return {
                "current": 0,
                "target": 100,
                "metric": "% Activated Customers",
                "progress": 0
            }
        
        # Calculate unique customers
        unique_customers = df['Customer'].nunique() if 'Customer' in df.columns else 0
        
        # Calculate active customers (customers with transactions in current year)
        current_year = datetime.now(timezone.utc).year
        current_year_data = df[df['Year'] == current_year] if 'Year' in df.columns else df
        active_customers = current_year_data['Customer'].nunique() if not current_year_data.empty and 'Customer' in current_year_data.columns else 0
        
        # Calculate activation percentage
        # Activated customers = customers who made purchases in current year
        # Target could be based on historical data or a growth target
        if unique_customers > 0:
            activation_percentage = (active_customers / unique_customers) * 100
        else:
            activation_percentage = 0
        
        # Set target (could be based on historical average or growth target)
        # For now, use a reasonable target based on data
        historical_years = df['Year'].unique() if 'Year' in df.columns else []
        if len(historical_years) > 1:
            # Calculate average activation across years
            yearly_activation = []
            for year in historical_years:
                year_data = df[df['Year'] == year]
                year_customers = year_data['Customer'].nunique() if 'Customer' in year_data.columns else 0
                if unique_customers > 0:
                    yearly_activation.append((year_customers / unique_customers) * 100)
            
            if yearly_activation:
                avg_activation = sum(yearly_activation) / len(yearly_activation)
                target = min(100, max(activation_percentage + 5, avg_activation + 10))  # Target is 10% above average or current + 5%
            else:
                target = min(100, activation_percentage + 10)  # Default: 10% above current
        else:
            target = min(100, activation_percentage + 10)  # Default: 10% above current
        
        return {
            "current": round(activation_percentage, 1),
            "target": round(target, 1),
            "metric": "% Activated Customers",
            "progress": round((activation_percentage / target * 100) if target > 0 else 0, 1),
            "active_customers": active_customers,
            "total_customers": unique_customers
        }
    except Exception as e:
        logger.error(f"Error calculating annual goal: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Return default values on error
        return {
            "current": 0,
            "target": 100,
            "metric": "% Activated Customers",
            "progress": 0
        }

@api_router.get("/kanban/recommendations", response_model=StrategicRecommendationsResponse)
async def get_kanban_recommendations(email: str = Depends(get_current_user)):
    """Load kanban recommendations from MongoDB (does not generate new ones)"""
    try:
        # Move expired campaigns first
        await move_expired_campaigns()
        
        # Load from MongoDB
        kanban_doc = await db.kanban.find_one({})
        
        if not kanban_doc:
            # Initialize empty kanban document
            initial_doc = {
                "recommended": [],
                "live": [],
                "past": [],
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            await db.kanban.insert_one(initial_doc)
            return StrategicRecommendationsResponse(
                recommended=[],
                live=[],
                past=[]
            )
        
        # Convert to response model
        recommended = [StrategicRecommendation(**rec) for rec in kanban_doc.get('recommended', [])]
        live = [StrategicRecommendation(**camp) for camp in kanban_doc.get('live', [])]
        past = [StrategicRecommendation(**camp) for camp in kanban_doc.get('past', [])]
        
        return StrategicRecommendationsResponse(
            recommended=recommended,
            live=live,
            past=past
        )
    except Exception as e:
        logger.error(f"Error loading kanban recommendations: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error loading recommendations: {str(e)}")

class GoalRequest(BaseModel):
    campaignId: str
    title: str
    description: str
    department: str
    owners: List[str]  # List of user IDs
    teamMembers: Optional[List[str]] = []
    dependencies: Optional[List[str]] = []
    metrics: Optional[List[str]] = []
    keyResults: Optional[List[Dict]] = []
    status: str = "on-track"
    progress: int = 0

class GenerateGoalsRequest(BaseModel):
    campaignId: str
    autoAssign: bool = False  # If True, AI assigns departments and owners

class GoalResponse(BaseModel):
    id: str
    campaignId: str
    title: str
    description: str
    department: str
    owners: List[str]
    teamMembers: List[str]
    dependencies: List[str]
    metrics: List[str]
    keyResults: List[Dict]
    status: str
    progress: int
    createdAt: str
    tasks: Optional[List[Dict]] = []
    lastUpdated: Optional[str] = None
    lastUpdatedBy: Optional[str] = None

@api_router.post("/kanban/generate-goals", response_model=List[GoalResponse])
async def generate_goals_from_campaign(request: GenerateGoalsRequest, email: str = Depends(get_current_user)):
    """Generate AI-powered goals from a campaign"""
    try:
        logger.info(f"Generating goals for campaign ID: {request.campaignId}")
        
        # Get campaign from MongoDB
        kanban_doc = await db.kanban.find_one({})
        if not kanban_doc:
            logger.error("Kanban data not found in MongoDB")
            raise HTTPException(status_code=404, detail="Kanban data not found")
        
        # Find campaign in live or recommended
        campaign = None
        live_campaigns = kanban_doc.get('live', [])
        recommended_campaigns = kanban_doc.get('recommended', [])
        logger.info(f"Searching in {len(live_campaigns)} live and {len(recommended_campaigns)} recommended campaigns")
        
        for camp in live_campaigns + recommended_campaigns:
            camp_id = camp.get('id')
            if camp_id == request.campaignId or str(camp_id) == str(request.campaignId):
                campaign = camp
                logger.info(f"Found campaign: {campaign.get('title', 'Unknown')}")
                break
        
        if not campaign:
            logger.error(f"Campaign with ID {request.campaignId} not found")
            raise HTTPException(status_code=404, detail=f"Campaign not found: {request.campaignId}")
        
        # Get all team members for department assignment
        try:
            all_users = await db.users.find({"status": "active"}, {"_id": 0, "password_hash": 0}).to_list(1000)
            logger.info(f"Found {len(all_users)} active users")
        except Exception as user_error:
            logger.error(f"Error fetching users: {str(user_error)}")
            all_users = []
        
        users_by_dept = {}
        for user in all_users:
            dept = user.get('department')
            if dept:
                if dept not in users_by_dept:
                    users_by_dept[dept] = []
                users_by_dept[dept].append(user)
        
        logger.info(f"Users by department: {list(users_by_dept.keys())}")
        
        # Build AI prompt
        budget = campaign.get('budget', 0)
        if isinstance(budget, dict):
            budget = budget.get('value', 0) if isinstance(budget.get('value'), (int, float)) else 0
        elif not isinstance(budget, (int, float)):
            budget = 0
        
        impact_value = 0
        impact_percentage = 0
        impact = campaign.get('impact', {})
        if isinstance(impact, dict):
            impact_value = impact.get('value', 0) if isinstance(impact.get('value'), (int, float)) else 0
            impact_percentage = impact.get('percentage', 0) if isinstance(impact.get('percentage'), (int, float)) else 0
        
        channels = campaign.get('channels', [])
        if not isinstance(channels, list):
            channels = []
        
        campaign_context = f"""
Campaign Title: {campaign.get('title', 'Unknown')}
Campaign Description: {campaign.get('description', 'No description')}
Category: {campaign.get('category', 'N/A')}
Budget: €{budget:,.2f}
Expected Impact: €{impact_value:,.2f} ({impact_percentage}% uplift)
Channels: {', '.join(str(c) for c in channels)}
Start Date: {campaign.get('startDate', 'N/A')}
End Date: {campaign.get('endDate', 'N/A')}
"""
        
        ai_prompt = f"""
Based on the following campaign, generate 3-6 strategic goals that will help achieve this campaign's objectives.
Each goal should be:
1. Specific and actionable
2. Assigned to appropriate departments (sales, operations, finance, hr, marketing, technology)
3. Have clear owners (can be multiple)
4. Include dependencies
5. Have measurable metrics
6. Include 2-3 key results with current/target values

CAMPAIGN DETAILS:
{campaign_context}

AVAILABLE DEPARTMENTS AND TEAM MEMBERS:
{json.dumps({dept: [{'name': u.get('name'), 'email': u.get('email'), 'role': u.get('role')} for u in users] for dept, users in users_by_dept.items()}, indent=2)}

OUTPUT FORMAT (JSON array ONLY - no markdown, no code blocks, no explanations):
You MUST return ONLY a valid JSON array. Do not include any markdown code blocks, explanations, or text outside the JSON array.
The JSON must be valid with all property names in double quotes.

Example format:
[
  {{
    "title": "Goal title",
    "description": "Detailed goal description",
    "department": "sales",
    "owners": ["user@example.com"],
    "teamMembers": ["member@example.com"],
    "dependencies": ["Dependency 1", "Dependency 2"],
    "metrics": ["Metric 1", "Metric 2"],
    "keyResults": [
      {{"description": "KR 1", "current": 0, "target": 100}},
      {{"description": "KR 2", "current": 0, "target": 50}}
    ],
    "status": "on-track",
    "progress": 0
  }}
]

CRITICAL: Return ONLY the JSON array. No markdown, no code blocks, no explanations. All property names must be in double quotes.
Generate 3-6 goals that are realistic, measurable, and aligned with the campaign objectives.
"""
        
        # Call Perplexity AI
        logger.info("Calling Perplexity AI to generate goals...")
        try:
            ai_response = await query_perplexity(ai_prompt)
            if not ai_response or len(ai_response.strip()) == 0:
                logger.error("Perplexity API returned empty response")
                raise HTTPException(status_code=500, detail="AI service returned empty response. Please try again.")
            logger.info(f"AI response received, length: {len(ai_response)}")
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as ai_error:
            logger.error(f"Perplexity API error: {str(ai_error)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(ai_error)}. Please try again.")
        
        # Parse AI response (extract JSON)
        # Note: json is already imported at module level
        import re
        
        # Try to find JSON array in the response with multiple strategies
        json_str = None
        json_match = None
        
        # Strategy 1: Simple array pattern
        json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        
        # Strategy 2: More flexible pattern with capture group
        if not json_str:
            json_match = re.search(r'(\[[\s\S]*\])', ai_response)
            if json_match:
                json_str = json_match.group(1) if json_match.lastindex else json_match.group(0)
        
        # Strategy 3: Find array boundaries manually
        if not json_str:
            start_idx = ai_response.find('[')
            end_idx = ai_response.rfind(']')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx + 1]
        
        if not json_str:
            logger.error(f"AI response does not contain valid JSON array. Response length: {len(ai_response)}, First 1000 chars: {ai_response[:1000]}")
            raise HTTPException(
                status_code=500, 
                detail="AI response format invalid - no JSON array found. The AI service may have returned an unexpected format. Please try again."
            )
        
        # Try to clean up common JSON issues
        # Remove markdown code blocks if present
        json_str = re.sub(r'```json\s*', '', json_str)
        json_str = re.sub(r'```\s*', '', json_str)
        json_str = json_str.strip()
        
        # Try to fix common JSON issues
        # Replace single quotes with double quotes (but be careful with apostrophes)
        # This is a simple fix - might need more sophisticated parsing
        try:
            ai_goals = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"First JSON parse attempt failed: {str(e)}")
            logger.warning(f"JSON string (first 500 chars): {json_str[:500]}")
            
            # Try to fix common issues
            # Fix unquoted property names (but this is risky)
            # Instead, try to extract just the array content more carefully
            try:
                # Try to find the array boundaries more precisely
                start_idx = json_str.find('[')
                end_idx = json_str.rfind(']')
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    json_str = json_str[start_idx:end_idx + 1]
                    ai_goals = json.loads(json_str)
                else:
                    raise json.JSONDecodeError("Could not find array boundaries", json_str, 0)
            except json.JSONDecodeError as e2:
                logger.error(f"Second JSON parse attempt failed: {str(e2)}")
                logger.error(f"Full AI response: {ai_response}")
                logger.error(f"Extracted JSON string: {json_str}")
                # Try one more time with ast.literal_eval as fallback (but it's less safe)
                try:
                    import ast
                    # This won't work for JSON, but let's try a different approach
                    # Actually, let's try to manually fix common issues
                    # Replace single quotes around keys (but not in strings)
                    fixed_json = re.sub(r"'(\w+)':", r'"\1":', json_str)
                    fixed_json = re.sub(r":\s*'([^']*)'", r': "\1"', fixed_json)
                    ai_goals = json.loads(fixed_json)
                    logger.info("Successfully parsed JSON after fixing quotes")
                except Exception as e3:
                    logger.error(f"All JSON parsing attempts failed. Last error: {str(e3)}")
                    raise HTTPException(
                        status_code=500, 
                        detail=f"AI response JSON parsing failed. The AI may have returned malformed JSON. Please try again or check the AI response format."
                    )
        
        if not isinstance(ai_goals, list):
            logger.error(f"AI response is not a list. Type: {type(ai_goals)}")
            raise HTTPException(status_code=500, detail="AI response is not a list")
        
        if len(ai_goals) == 0:
            logger.warning("AI generated empty goals list")
            raise HTTPException(status_code=500, detail="AI generated no goals")
        
        # Convert to GoalResponse format
        generated_goals = []
        for idx, ai_goal in enumerate(ai_goals):
            try:
                # Map owner emails to user IDs
                owner_ids = []
                owners = ai_goal.get('owners', [])
                if not isinstance(owners, list):
                    owners = []
                for owner_email in owners:
                    if isinstance(owner_email, str):
                        user = next((u for u in all_users if u.get('email') == owner_email), None)
                        if user and user.get('id'):
                            owner_ids.append(user.get('id'))
                
                team_member_ids = []
                team_members = ai_goal.get('teamMembers', [])
                if not isinstance(team_members, list):
                    team_members = []
                for member_email in team_members:
                    if isinstance(member_email, str):
                        user = next((u for u in all_users if u.get('email') == member_email), None)
                        if user and user.get('id'):
                            team_member_ids.append(user.get('id'))
                
                # Validate department
                department = ai_goal.get('department', 'sales')
                valid_departments = ['sales', 'operations', 'finance', 'hr', 'marketing', 'technology']
                if department not in valid_departments:
                    department = 'sales'  # Default fallback
                
                # Validate status
                status = ai_goal.get('status', 'on-track')
                valid_statuses = ['on-track', 'at-risk', 'not-started']
                if status not in valid_statuses:
                    status = 'on-track'
                
                # Validate progress
                progress = ai_goal.get('progress', 0)
                if not isinstance(progress, (int, float)):
                    progress = 0
                progress = max(0, min(100, int(progress)))
                
                goal = {
                    "id": str(uuid.uuid4()),
                    "campaignId": str(request.campaignId),
                    "title": str(ai_goal.get('title', f'Untitled Goal {idx + 1}')),
                    "description": str(ai_goal.get('description', '')),
                    "department": department,
                    "owners": owner_ids if owner_ids else [],  # Ensure it's a list
                    "teamMembers": team_member_ids if team_member_ids else [],  # Ensure it's a list
                    "dependencies": ai_goal.get('dependencies', []) if isinstance(ai_goal.get('dependencies'), list) else [],
                    "metrics": ai_goal.get('metrics', []) if isinstance(ai_goal.get('metrics'), list) else [],
                    "keyResults": ai_goal.get('keyResults', []) if isinstance(ai_goal.get('keyResults'), list) else [],
                    "status": status,
                    "progress": progress,
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                generated_goals.append(goal)
            except Exception as goal_error:
                logger.error(f"Error processing goal {idx}: {str(goal_error)}")
                continue  # Skip invalid goals
        
        if len(generated_goals) == 0:
            raise HTTPException(status_code=500, detail="No valid goals could be generated from AI response")
        
        # Validate and convert to GoalResponse
        validated_goals = []
        for goal in generated_goals:
            try:
                validated_goal = GoalResponse(**goal)
                validated_goals.append(validated_goal)
            except Exception as validation_error:
                logger.error(f"Goal validation error: {str(validation_error)}")
                logger.error(f"Goal data: {goal}")
                continue
        
        if len(validated_goals) == 0:
            raise HTTPException(status_code=500, detail="No valid goals could be validated")
        
        logger.info(f"Successfully generated {len(validated_goals)} goals")
        return validated_goals
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error generating goals: {str(e)}")
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Error generating goals: {str(e)}")

@api_router.post("/kanban/goals", response_model=GoalResponse)
async def create_goal(request: GoalRequest, email: str = Depends(get_current_user)):
    """Create a new goal linked to a campaign"""
    try:
        goal = {
            "id": str(uuid.uuid4()),
            "campaignId": request.campaignId,
            "title": request.title,
            "description": request.description,
            "department": request.department,
            "owners": request.owners,
            "teamMembers": request.teamMembers or [],
            "dependencies": request.dependencies or [],
            "metrics": request.metrics or [],
            "keyResults": request.keyResults or [],
            "status": request.status,
            "progress": request.progress,
            "tasks": [],  # Initialize empty tasks array
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in goals collection
        await db.goals.insert_one(goal)
        
        # Update campaign to include goal ID
        kanban_doc = await db.kanban.find_one({})
        if kanban_doc:
            for camp in kanban_doc.get('live', []):
                if camp.get('id') == request.campaignId:
                    if 'goals' not in camp:
                        camp['goals'] = []
                    camp['goals'].append(goal['id'])
                    await db.kanban.update_one(
                        {"live.id": request.campaignId},
                        {"$set": {"live.$[elem].goals": camp['goals']}},
                        array_filters=[{"elem.id": request.campaignId}]
                    )
                    break
        
        return GoalResponse(**goal)
    except Exception as e:
        logger.error(f"Error creating goal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating goal: {str(e)}")

@api_router.get("/kanban/campaigns/{campaignId}/goals", response_model=List[GoalResponse])
async def get_campaign_goals(campaignId: str, email: str = Depends(get_current_user)):
    """Get all goals for a specific campaign"""
    try:
        goals = await db.goals.find({"campaignId": campaignId}, {"_id": 0}).to_list(1000)
        return [GoalResponse(**goal) for goal in goals]
    except Exception as e:
        logger.error(f"Error fetching campaign goals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching goals: {str(e)}")

@api_router.get("/goals/by-department/{department}", response_model=List[GoalResponse])
async def get_goals_by_department(department: str, email: str = Depends(get_current_user)):
    """Get all goals for a specific department"""
    try:
        goals = await db.goals.find({"department": department.lower()}, {"_id": 0}).to_list(1000)
        return [GoalResponse(**goal) for goal in goals]
    except Exception as e:
        logger.error(f"Error fetching department goals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching goals: {str(e)}")

class UpdateGoalRequest(BaseModel):
    progress: Optional[int] = None
    status: Optional[str] = None
    keyResults: Optional[List[Dict]] = None
    tasks: Optional[List[Dict]] = None  # New field for user tasks

@api_router.get("/goals/{goalId}", response_model=GoalResponse)
async def get_goal(goalId: str, email: str = Depends(get_current_user)):
    """Get a specific goal by ID"""
    try:
        goal = await db.goals.find_one({"id": goalId}, {"_id": 0})
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        return GoalResponse(**goal)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching goal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching goal: {str(e)}")

@api_router.put("/goals/{goalId}", response_model=GoalResponse)
async def update_goal(goalId: str, request: UpdateGoalRequest, email: str = Depends(get_current_user)):
    """Update a goal - owners, team members, and admins can update"""
    try:
        # Get the goal
        goal = await db.goals.find_one({"id": goalId}, {"_id": 0})
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Get current user info
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_doc.get('id')
        
        # Check if user is owner, team member, or admin
        owners = goal.get('owners', [])
        team_members = goal.get('teamMembers', [])
        user_role = user_doc.get('role', '').lower()
        user_department = user_doc.get('department', '').lower()
        is_admin = user_role == 'admin' or user_department == 'admin'
        
        if user_id not in owners and user_id not in team_members and not is_admin:
            raise HTTPException(status_code=403, detail="You don't have permission to update this goal")
        
        # Update only provided fields
        update_data = {}
        if request.progress is not None:
            update_data['progress'] = max(0, min(100, request.progress))
        if request.status is not None:
            valid_statuses = ['on-track', 'at-risk', 'not-started', 'completed']
            if request.status in valid_statuses:
                update_data['status'] = request.status
        if request.keyResults is not None:
            update_data['keyResults'] = request.keyResults
        if request.tasks is not None:
            update_data['tasks'] = request.tasks
            update_data['lastUpdated'] = datetime.now(timezone.utc).isoformat()
            update_data['lastUpdatedBy'] = user_id
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update the goal
        await db.goals.update_one(
            {"id": goalId},
            {"$set": update_data}
        )
        
        # Get updated goal
        updated_goal = await db.goals.find_one({"id": goalId}, {"_id": 0})
        return GoalResponse(**updated_goal)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating goal: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error updating goal: {str(e)}")

@api_router.post("/kanban/accept")
async def accept_campaign(request: AcceptCampaignRequest, email: str = Depends(get_current_user)):
    """Move a campaign from recommended to live"""
    try:
        kanban_doc = await db.kanban.find_one({})
        if not kanban_doc:
            raise HTTPException(status_code=404, detail="Kanban data not found")
        
        recommended = kanban_doc.get('recommended', [])
        live = kanban_doc.get('live', [])
        
        # Find the campaign in recommended
        campaign_to_move = None
        updated_recommended = []
        
        for campaign in recommended:
            if campaign.get('id') == request.campaignId:
                campaign_to_move = campaign
            else:
                updated_recommended.append(campaign)
        
        if not campaign_to_move:
            raise HTTPException(status_code=404, detail="Campaign not found in recommended")
        
        # Add to live with acceptance timestamp
        campaign_to_move['status'] = 'live'
        campaign_to_move['acceptedAt'] = datetime.now(timezone.utc).isoformat()
        live.append(campaign_to_move)
        
        # Update MongoDB
        await db.kanban.update_one(
            {},
            {"$set": {
                "recommended": updated_recommended,
                "live": live,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Campaign '{campaign_to_move.get('title')}' moved to live")
        
        return {"success": True, "message": "Campaign moved to live"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting campaign: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error accepting campaign: {str(e)}")

@api_router.get("/analytics/strategic-recommendations", response_model=StrategicRecommendationsResponse)
async def generate_strategic_recommendations(email: str = Depends(get_current_user)):
    """Generate NEW AI-powered strategic recommendations based on real Azure data and save to MongoDB"""
    try:
        logger.info("🔍 Generating NEW strategic recommendations from Azure data")
        
        # Get comprehensive business data
        data = await db.business_data.find({}, {"_id": 0}).to_list(10000)
        if not data:
            raise HTTPException(status_code=404, detail="No data available")
        
        df = pd.DataFrame(data)
        
        # Check if DataFrame is empty or missing required columns
        if df.empty:
            logger.warning("DataFrame is empty")
            raise HTTPException(status_code=404, detail="No data available in database")
        
        # Check for required columns
        required_columns = ['Revenue', 'Gross_Profit', 'Units', 'Year', 'Business', 'Channel', 'Customer', 'Brand']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            logger.error(f"Available columns: {df.columns.tolist()}")
            raise HTTPException(status_code=500, detail=f"Missing required columns: {missing_columns}")
        
        # Calculate key metrics for context
        total_revenue = float(df['Revenue'].sum()) if not df.empty else 0
        total_profit = float(df['Gross_Profit'].sum()) if not df.empty else 0
        total_units = float(df['Units'].sum()) if not df.empty else 0
        
        # Year-over-year analysis
        yearly_data = df.groupby('Year').agg({
            'Revenue': 'sum',
            'Gross_Profit': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        # Top performing businesses
        business_perf = df.groupby('Business').agg({
            'Revenue': 'sum',
            'Gross_Profit': 'sum'
        }).reset_index().sort_values('Revenue', ascending=False).head(5)
        
        # Top channels
        channel_perf = df.groupby('Channel').agg({
            'Revenue': 'sum',
            'Gross_Profit': 'sum'
        }).reset_index().sort_values('Revenue', ascending=False).head(5)
        
        # Top customers
        customer_perf = df.groupby('Customer').agg({
            'Revenue': 'sum',
            'Gross_Profit': 'sum'
        }).reset_index().sort_values('Revenue', ascending=False).head(5)
        
        # Get past campaigns for AI analysis
        kanban_doc = await db.kanban.find_one({})
        past_campaigns = kanban_doc.get('past', []) if kanban_doc else []
        
        # Build past campaigns context for AI
        past_context = ""
        if past_campaigns:
            past_context = "\n\nPAST CAMPAIGNS PERFORMANCE (for learning):\n"
            for idx, past_camp in enumerate(past_campaigns[:10], 1):  # Limit to 10 most recent
                past_context += f"{idx}. {past_camp.get('title', 'Unknown')}\n"
                past_context += f"   Category: {past_camp.get('category', 'N/A')}\n"
                past_context += f"   Budget: €{past_camp.get('budget', 0):,.2f}\n"
                past_context += f"   Expected Impact: €{past_camp.get('impact', {}).get('value', 0):,.2f} ({past_camp.get('impact', {}).get('percentage', 0)}% uplift)\n"
                past_context += f"   Period: {past_camp.get('startDate', 'N/A')} to {past_camp.get('endDate', 'N/A')}\n"
                past_context += f"   Channels: {', '.join(past_camp.get('channels', []))}\n\n"
        
        # Build data context for AI
        data_context = f"""
Business Performance Data Analysis:

OVERALL METRICS:
- Total Revenue: €{total_revenue:,.2f}
- Total Gross Profit: €{total_profit:,.2f}
- Total Units Sold: {total_units:,.0f}
- Profit Margin: {(total_profit/total_revenue*100) if total_revenue > 0 else 0:.2f}%

YEAR-OVER-YEAR PERFORMANCE:
{yearly_data.to_string(index=False) if not yearly_data.empty else 'No yearly data'}

TOP 5 BUSINESSES BY REVENUE:
{business_perf.to_string(index=False) if not business_perf.empty else 'No business data'}

TOP 5 CHANNELS BY REVENUE:
{channel_perf.to_string(index=False) if not channel_perf.empty else 'No channel data'}

TOP 5 CUSTOMERS BY REVENUE:
{customer_perf.to_string(index=False) if not customer_perf.empty else 'No customer data'}

AVAILABLE DATA PERIODS:
- Years: {sorted(df['Year'].unique().tolist()) if not df.empty else []}
- Total Records: {len(df)}
- Unique Businesses: {df['Business'].nunique() if not df.empty else 0}
- Unique Channels: {df['Channel'].nunique() if not df.empty else 0}
- Unique Brands: {df['Brand'].nunique() if not df.empty else 0}
- Unique Customers: {df['Customer'].nunique() if not df.empty else 0}
{past_context}
"""
        
        # Generate AI recommendations
        ai_prompt = f"""
Based on the following business data, generate 4-6 strategic marketing and business recommendations.

DATA CONTEXT:
{data_context}

REQUIREMENTS:
1. Each recommendation must be specific, actionable, and data-driven
2. Include realistic budget estimates (in Euros) based on the revenue scale
3. Calculate expected impact (revenue increase in Euros and percentage uplift)
4. Provide detailed reasoning based on the actual data patterns AND past campaign performance (if available)
5. Suggest appropriate marketing channels (e.g., Meta Ads, Google Ads, Email, Social Media, etc.)
6. Assign an AI confidence score (0-100) based on data strength
7. Categorize as 'acquisition', 'retention', or 'engagement'
8. Include realistic start and end dates (3-6 month campaigns)
9. If past campaigns are provided, learn from them - avoid repeating unsuccessful strategies and build on what worked

OUTPUT FORMAT (JSON array):
[
  {{
    "title": "Specific recommendation title",
    "description": "Detailed description of the recommendation",
    "category": "acquisition|retention|engagement",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "budget": 50000,
    "impact": {{"value": 250000, "percentage": 15.5}},
    "reasoning": "Detailed reasoning based on data patterns, specific numbers, and why this will work",
    "channels": ["Channel1", "Channel2"],
    "aiScore": 85
  }}
]

Return ONLY valid JSON array, no additional text.
"""
        
        try:
            ai_response = await query_perplexity(ai_prompt)
            
            # Parse JSON from AI response (might have markdown code blocks)
            ai_response_clean = ai_response.strip()
            if ai_response_clean.startswith('```json'):
                ai_response_clean = ai_response_clean[7:]
            if ai_response_clean.startswith('```'):
                ai_response_clean = ai_response_clean[3:]
            if ai_response_clean.endswith('```'):
                ai_response_clean = ai_response_clean[:-3]
            ai_response_clean = ai_response_clean.strip()
            
            recommendations_data = json.loads(ai_response_clean)
            
            # Format recommendations
            recommendations = []
            for idx, rec in enumerate(recommendations_data[:6], 1):  # Limit to 6
                recommendations.append(StrategicRecommendation(
                    id=idx,
                    title=rec.get('title', f'Recommendation {idx}'),
                    description=rec.get('description', ''),
                    type='system',
                    category=rec.get('category', 'acquisition'),
                    startDate=rec.get('startDate', '2025-01-20'),
                    endDate=rec.get('endDate'),
                    budget=float(rec.get('budget', 50000)),
                    impact=rec.get('impact', {'value': 100000, 'percentage': 10}),
                    reasoning=rec.get('reasoning', ''),
                    channels=rec.get('channels', ['Email']),
                    aiScore=int(rec.get('aiScore', 75)),
                    status='recommended'
                ))
            
            # Save to MongoDB (replace existing recommended, keep live and past)
            kanban_doc = await db.kanban.find_one({})
            if not kanban_doc:
                # Create new document
                kanban_doc = {
                    "recommended": [rec.model_dump() for rec in recommendations],
                    "live": [],
                    "past": [],
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
                await db.kanban.insert_one(kanban_doc)
            else:
                # Update only recommended field
                await db.kanban.update_one(
                    {},
                    {"$set": {
                        "recommended": [rec.model_dump() for rec in recommendations],
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }}
                )
            
            # Move expired campaigns before returning
            await move_expired_campaigns()
            
            # Load current state from MongoDB
            updated_doc = await db.kanban.find_one({})
            live_campaigns = [StrategicRecommendation(**camp) for camp in updated_doc.get('live', [])] if updated_doc else []
            past_campaigns = [StrategicRecommendation(**camp) for camp in updated_doc.get('past', [])] if updated_doc else []
            
            logger.info(f"Generated {len(recommendations)} new recommendations and saved to MongoDB")
            
            return StrategicRecommendationsResponse(
                recommended=recommendations,
                live=live_campaigns,
                past=past_campaigns
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"AI Response (first 500 chars): {ai_response[:500] if 'ai_response' in locals() else 'No response'}")
            # Fallback to default recommendations if AI fails
            return StrategicRecommendationsResponse(
                recommended=[],
                live=[]
            )
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Strategic recommendations error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Strategic recommendations error: {str(e)}")

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