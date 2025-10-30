import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).parent
_dotenv_path = find_dotenv(str(ROOT_DIR / '.env')) or find_dotenv()
if _dotenv_path:
    load_dotenv(_dotenv_path)

mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'bizpulse')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def test_data_processing():
    print("Testing data processing...")
    
    # Get all data
    data = await db.business_data.find({}, {"_id": 0}).to_list(100000)
    print(f"Retrieved {len(data)} records from MongoDB")
    
    if not data:
        print("No data found!")
        return
    
    # Create DataFrame
    df = pd.DataFrame(data)
    print(f"DataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Check for required columns
    required_cols = ['Revenue', 'Gross_Profit', 'Units', 'Year']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Missing columns: {missing_cols}")
        return
    
    # Check data types
    print(f"Data types:")
    for col in required_cols:
        print(f"  {col}: {df[col].dtype}")
    
    # Check for NaN values
    print(f"NaN values:")
    for col in required_cols:
        nan_count = df[col].isna().sum()
        print(f"  {col}: {nan_count} NaN values")
    
    # Convert to numeric
    for col in ['Revenue', 'Gross_Profit', 'Units']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Calculate totals
    total_revenue = df['Revenue'].sum()
    total_profit = df['Gross_Profit'].sum()
    total_units = df['Units'].sum()
    
    print(f"\nTotals:")
    print(f"Total Revenue: €{total_revenue:,.2f}")
    print(f"Total Profit: €{total_profit:,.2f}")
    print(f"Total Units: {total_units:,.0f}")
    
    # Yearly breakdown
    print(f"\nYearly breakdown:")
    yearly = df.groupby('Year').agg({
        'Revenue': 'sum',
        'Gross_Profit': 'sum',
        'Units': 'sum'
    }).round(2)
    print(yearly)
    
    # Test the exact logic from server.py
    print(f"\nTesting server logic...")
    try:
        # This is the exact logic from the server
        df['Revenue'] = pd.to_numeric(df['Revenue'], errors='coerce').fillna(0)
        df['Gross_Profit'] = pd.to_numeric(df['Gross_Profit'], errors='coerce').fillna(0)
        df['Units'] = pd.to_numeric(df['Units'], errors='coerce').fillna(0)
        
        total_revenue = df['Revenue'].sum()
        total_profit = df['Gross_Profit'].sum()
        total_units = df['Units'].sum()
        
        print(f"Server logic totals:")
        print(f"Total Revenue: €{total_revenue:,.2f}")
        print(f"Total Profit: €{total_profit:,.2f}")
        print(f"Total Units: {total_units:,.0f}")
        
        # Yearly performance
        yearly_performance = df.groupby('Year').agg({
            'Revenue': 'sum',
            'Gross_Profit': 'sum',
            'Units': 'sum'
        }).reset_index()
        
        print(f"Yearly performance:")
        for _, row in yearly_performance.iterrows():
            print(f"  {int(row['Year'])}: Revenue=€{row['Revenue']:,.0f}, Profit=€{row['Gross_Profit']:,.0f}, Units={row['Units']:,.0f}")
            
    except Exception as e:
        print(f"Error in server logic: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_data_processing())
