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
JWT_SECRET = "thrive-brands-biz-pulse-secret-2024"
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
            
        # Get filtered data
        logger.info(f"Query being executed: {query}")
        data = await db.business_data.find(query, {"_id": 0}).to_list(100000)
        logger.info(f"Retrieved {len(data)} records from MongoDB")
        
        # Data is now properly cleaned and formatted
        logger.info(f"Using all {len(data)} records including cleaned 2025 data")
        
        if data:
            logger.info(f"First record keys: {list(data[0].keys())}")
            logger.info(f"Sample values - Year: {data[0].get('Year')}, Revenue: {data[0].get('Revenue')}, gSales: {data[0].get('gSales')}")
        
        df = pd.DataFrame(data)
        
        # Debug logging
        logger.info(f"DataFrame columns: {list(df.columns) if not df.empty else 'Empty DataFrame'}")
        
        if df.empty:
            return {"error": "No data available"}
        
        # Ensure numeric columns
        for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Yearly performance
        yearly_performance = df.groupby('Year').agg({
            'Revenue': 'sum',
            'Gross_Profit': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        yearly_list = []
        for _, row in yearly_performance.iterrows():
            yearly_list.append({
                "Year": int(row['Year']),
                "Revenue": float(row['Revenue']),
                "Gross_Profit": float(row['Gross_Profit']),
                "Units": float(row['Units'])
            })
        
        # Business-wise performance
        business_perf = df.groupby('Business').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        business_list = []
        for _, row in business_perf.iterrows():
            business_list.append({
                "Business": str(row['Business']),
                "Revenue": float(row['Revenue']),
                "Gross_Profit": float(row['Gross_Profit']),
                "Units": float(row['Units'])
            })
        
        # Month-wise trend for current year
        current_year = int(df['Year'].max())
        monthly_trend = df[df['Year'] == current_year].groupby('Month Name').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        monthly_list = []
        for _, row in monthly_trend.iterrows():
            monthly_list.append({
                "Month_Name": str(row['Month Name']),
                "Revenue": float(row['Revenue']),
                "Gross_Profit": float(row['Gross_Profit']),
                "Units": float(row['Units'])
            })
        
        return {
            "yearly_performance": yearly_list,
            "business_performance": business_list,
            "monthly_trend": monthly_list,
            "total_profit": float(df['Gross_Profit'].sum()),
            "total_revenue": float(df['Revenue'].sum()),
            "total_units": float(df['Units'].sum())
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
async def get_brand_analysis(email: str = Depends(get_current_user)):
    """Brand Analysis - Brand performance by category and channel"""
    try:
        data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
        df = pd.DataFrame(data)
        
        if df.empty:
            return {"error": "No data available"}
        
        # Brand performance
        brand_perf = df.groupby('Brand').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        # Brand by Business
        brand_by_business = df.groupby(['Brand', 'Business']).agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum'
        }).reset_index()
        
        # YoY Brand Growth
        brand_yoy = df.groupby(['Brand', 'Year']).agg({
            'Revenue': 'sum'
        }).reset_index()
        
        return {
            "brand_performance": brand_perf.to_dict('records'),
            "brand_by_business": brand_by_business.to_dict('records'),
            "brand_yoy_growth": brand_yoy.to_dict('records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/category-analysis")
async def get_category_analysis(email: str = Depends(get_current_user)):
    """Category Analysis - Category and sub-category deep dives"""
    try:
        data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
        df = pd.DataFrame(data)
        
        if df.empty:
            return {"error": "No data available"}
        
        # Category performance
        category_perf = df.groupby('Category').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        # Sub-category performance
        subcategory_perf = df.groupby('Sub_Category').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        # Board Category (check if column exists)
        board_category_perf = []
        if 'Board_Category' in df.columns:
            board_category_perf = df.groupby('Board_Category').agg({
                'Gross_Profit': 'sum',
                'Revenue': 'sum'
            }).reset_index().to_dict('records')
        
        return {
            "category_performance": category_perf.to_dict('records'),
            "subcategory_performance": subcategory_perf.to_dict('records'),
            "board_category_performance": board_category_perf
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/filters/options")
async def get_filter_options(email: str = Depends(get_current_user)):
    """Get all unique filter options"""
    try:
        data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
        logger.info(f"Retrieved {len(data)} records for filter options")
        
        if not data:
            logger.warning("No data found for filter options")
            return {}
        
        df = pd.DataFrame(data)
        logger.info(f"DataFrame shape: {df.shape}")
        logger.info(f"DataFrame columns: {list(df.columns)}")
        
        if df.empty:
            logger.warning("DataFrame is empty")
            return {}
        
        # Check for required columns
        required_cols = ['Year', 'Month_Name', 'Business', 'Channel', 'Brand', 'Category', 'Sub_Cat']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns: {missing_cols}")
        
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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