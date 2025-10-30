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

async def load_cleaned_data():
    print("Loading cleaned CSV data...")
    
    # Load the cleaned CSV
    df = pd.read_csv('yearly_data_cleaned.csv')
    print(f"Loaded {len(df)} records from cleaned CSV")
    
    # Apply the same column mapping as in server.py
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
        'fGP': 'Gross_Profit',
        'Cases': 'Units',
    }
    
    df = df.rename(columns=rename_map)
    
    # Ensure numeric columns are properly converted
    for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    print("Clearing existing data...")
    await db.business_data.delete_many({})
    
    print("Inserting cleaned data...")
    records = df.to_dict(orient='records')
    await db.business_data.insert_many(records)
    print(f"Inserted {len(records)} cleaned records")
    
    # Verify the data
    print("\n=== VERIFICATION ===")
    pipeline = [
        {
            '$group': {
                '_id': '$Year',
                'total_revenue': {'$sum': '$Revenue'},
                'total_profit': {'$sum': '$Gross_Profit'},
                'total_units': {'$sum': '$Units'},
                'record_count': {'$sum': 1}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    async for doc in db.business_data.aggregate(pipeline):
        year = doc['_id']
        revenue = doc['total_revenue']
        profit = doc['total_profit']
        units = doc['total_units']
        count = doc['record_count']
        print(f'{year}: Revenue=€{revenue:,.0f}, Profit=€{profit:,.0f}, Units={units:,.0f}, Records={count}')
    
    # Calculate overall totals
    total_pipeline = [
        {'$group': {'_id': None, 'total_revenue': {'$sum': '$Revenue'}, 'total_profit': {'$sum': '$Gross_Profit'}, 'total_units': {'$sum': '$Units'}}}
    ]
    result = await db.business_data.aggregate(total_pipeline).to_list(1)
    if result:
        print(f'\nOverall Totals:')
        print(f'Total Revenue: €{result[0]["total_revenue"]:,.0f}')
        print(f'Total Profit: €{result[0]["total_profit"]:,.0f}')
        print(f'Total Units: {result[0]["total_units"]:,.0f}')

if __name__ == "__main__":
    asyncio.run(load_cleaned_data())
