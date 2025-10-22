from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
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
from emergentintegrations.llm.chat import LlmChat, UserMessage
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# Removed sync_azure_data function - using dummy data instead

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
    
    # Verify data exists in MongoDB
    count = await db.business_data.count_documents({})
    logger.info(f"Using dummy data from MongoDB - {count} records available")
    
    if count == 0:
        logger.warning("⚠️ No data in MongoDB! Run generate_dummy_data.py to populate data")
    
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
        count = await sync_azure_data()
        return SyncStatusResponse(
            status="success",
            message="Data synced successfully",
            records_count=count
        )
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
        data = await db.business_data.find(query, {"_id": 0}).to_list(100000)
        df = pd.DataFrame(data)
        
        if df.empty:
            return {"error": "No data available"}
        
        # Ensure numeric columns
        for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Group by Year and sort
        yearly = df.groupby('Year').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index().sort_values('Year')
        
        # Convert to regular Python types for JSON serialization
        yearly['Year'] = yearly['Year'].astype(int)
        yearly['Gross_Profit'] = yearly['Gross_Profit'].astype(float).round(2)
        yearly['Revenue'] = yearly['Revenue'].astype(float).round(2)
        yearly['Units'] = yearly['Units'].astype(float).round(2)
        
        # Business-wise performance
        business_perf = df.groupby('Business').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        business_perf['Gross_Profit'] = business_perf['Gross_Profit'].astype(float).round(2)
        business_perf['Revenue'] = business_perf['Revenue'].astype(float).round(2)
        business_perf['Units'] = business_perf['Units'].astype(float).round(2)
        
        # Month-wise trend for current year with proper month ordering
        current_year = int(df['Year'].max())
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        monthly_trend = df[df['Year'] == current_year].groupby('Month_Name').agg({
            'Gross_Profit': 'sum',
            'Revenue': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        # Sort by month order
        monthly_trend['month_sort'] = monthly_trend['Month_Name'].apply(
            lambda x: month_order.index(x) if x in month_order else 999
        )
        monthly_trend = monthly_trend.sort_values('month_sort').drop('month_sort', axis=1)
        
        monthly_trend['Gross_Profit'] = monthly_trend['Gross_Profit'].astype(float).round(2)
        monthly_trend['Revenue'] = monthly_trend['Revenue'].astype(float).round(2)
        monthly_trend['Units'] = monthly_trend['Units'].astype(float).round(2)
        
        return {
            "yearly_performance": yearly.to_dict('records'),
            "business_performance": business_perf.to_dict('records'),
            "monthly_trend": monthly_trend.to_dict('records'),
            "total_fgp": float(df['fGP'].sum()),
            "total_sales": float(df['gSales'].sum()),
            "total_cases": float(df['Cases'].sum())
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
        for col in ['fGP', 'gSales', 'Cases']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Channel-wise analysis
        channel_analysis = df.groupby('Channel').agg({
            'fGP': 'sum',
            'gSales': 'sum',
            'Cases': 'sum'
        }).reset_index()
        
        channel_analysis['fGP'] = channel_analysis['fGP'].astype(float).round(2)
        channel_analysis['gSales'] = channel_analysis['gSales'].astype(float).round(2)
        channel_analysis['Cases'] = channel_analysis['Cases'].astype(float).round(2)
        
        # Customer-wise analysis
        customer_analysis = df.groupby('Customer').agg({
            'fGP': 'sum',
            'gSales': 'sum',
            'Cases': 'sum'
        }).reset_index()
        
        customer_analysis['fGP'] = customer_analysis['fGP'].astype(float).round(2)
        customer_analysis['gSales'] = customer_analysis['gSales'].astype(float).round(2)
        customer_analysis['Cases'] = customer_analysis['Cases'].astype(float).round(2)
        
        # Top 10 customers
        top_customers = customer_analysis.nlargest(10, 'gSales')
        
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
            'fGP': 'sum',
            'gSales': 'sum',
            'Cases': 'sum'
        }).reset_index()
        
        # Brand by Business
        brand_by_business = df.groupby(['Brand', 'Business']).agg({
            'fGP': 'sum',
            'gSales': 'sum'
        }).reset_index()
        
        # YoY Brand Growth
        brand_yoy = df.groupby(['Brand', 'Year']).agg({
            'gSales': 'sum'
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
            'fGP': 'sum',
            'gSales': 'sum',
            'Cases': 'sum'
        }).reset_index()
        
        # Sub-category performance
        subcategory_perf = df.groupby('Sub_Cat').agg({
            'fGP': 'sum',
            'gSales': 'sum',
            'Cases': 'sum'
        }).reset_index()
        
        # Board Category (check if column exists)
        board_category_perf = []
        if 'Board_Category' in df.columns:
            board_category_perf = df.groupby('Board_Category').agg({
                'fGP': 'sum',
                'gSales': 'sum'
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
        df = pd.DataFrame(data)
        
        if df.empty:
            return {}
        
        return {
            "years": sorted(df['Year'].dropna().unique().tolist()),
            "months": df['Month_Name'].dropna().unique().tolist(),
            "businesses": df['Business'].dropna().unique().tolist(),
            "channels": df['Channel'].dropna().unique().tolist(),
            "customers": df['Customer'].dropna().unique().tolist(),
            "brands": df['Brand'].dropna().unique().tolist(),
            "categories": df['Category'].dropna().unique().tolist(),
            "sub_categories": df['Sub_Cat'].dropna().unique().tolist()
        }
    except Exception as e:
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
- Total Sales (gSales): ${df['gSales'].sum():,.2f} if not df.empty else 0
- Total fGP: ${df['fGP'].sum():,.2f} if not df.empty else 0

You can answer questions about:
- Sales performance and trends
- Brand analysis
- Customer and channel performance
- Category insights
- Year-over-year comparisons

Provide insights with specific numbers when possible. Highlight good performance in your response and provide actionable recommendations.
"""
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=os.getenv('EMERGENT_LLM_KEY'),
            session_id=request.session_id,
            system_message=context
        ).with_model("openai", "gpt-4o")
        
        # Send message
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save conversation
        conversation = AIConversation(
            session_id=request.session_id,
            user_message=request.message,
            ai_response=response
        )
        conv_dict = conversation.model_dump()
        conv_dict['timestamp'] = conv_dict['timestamp'].isoformat()
        await db.ai_conversations.insert_one(conv_dict)
        
        return AIChatResponse(response=response, session_id=request.session_id)
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