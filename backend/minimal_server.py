from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
import pandas as pd
import uvicorn

# Load environment variables
ROOT_DIR = Path(__file__).parent
_dotenv_path = find_dotenv(str(ROOT_DIR / '.env')) or find_dotenv()
if _dotenv_path:
    load_dotenv(_dotenv_path)

# MongoDB connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'bizpulse')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Minimal server is running"}

@app.get("/api/analytics/executive-overview")
async def executive_overview():
    try:
        print("Starting executive overview...")
        
        # Get all data
        data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
        print(f"Retrieved {len(data)} records from MongoDB")
        
        if not data:
            return {"error": "No data found"}
        
        # Create DataFrame
        df = pd.DataFrame(data)
        print(f"DataFrame shape: {df.shape}")
        
        # Check required columns
        required_cols = ['Revenue', 'Gross_Profit', 'Units', 'Year']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return {"error": f"Missing columns: {missing_cols}"}
        
        # Convert to numeric
        for col in ['Revenue', 'Gross_Profit', 'Units']:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Calculate totals
        total_revenue = df['Revenue'].sum()
        total_profit = df['Gross_Profit'].sum()
        total_units = df['Units'].sum()
        
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
        
        return {
            "total_revenue": float(total_revenue),
            "total_profit": float(total_profit),
            "total_units": float(total_units),
            "yearly_performance": yearly_list
        }
        
    except Exception as e:
        print(f"Error in executive overview: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
