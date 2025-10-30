import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.getenv('DB_NAME', 'thrivebrands_bi')]

async def reload_data():
    print('Clearing MongoDB...')
    await db.business_data.delete_many({})
    
    print('Loading CSV with correct column mapping...')
    df = pd.read_csv('yearly_data.csv')
    
    # Apply the correct column mapping
    rename_map = {
        'Month Name': 'Month_Name',
        'Sub-Cat': 'Sub_Cat',
        'gSales': 'Revenue',
        'fGP': 'Gross_Profit',
        'Cases': 'Units'
    }
    df = df.rename(columns=rename_map)
    
    # Convert numeric columns
    for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Convert to records and insert
    records = df.to_dict(orient='records')
    await db.business_data.insert_many(records)
    
    print(f'Loaded {len(records)} records with correct column mapping')
    
    # Verify the data
    sample = await db.business_data.find_one({}, {'_id': 0})
    print('Sample record after reload:')
    for key, value in sample.items():
        if key in ['Revenue', 'Gross_Profit', 'Units']:
            print(f'  {key}: {value} (type: {type(value).__name__})')
    
    # Check totals
    pipeline = [
        {
            '$group': {
                '_id': None,
                'total_revenue': {'$sum': '$Revenue'},
                'total_profit': {'$sum': '$Gross_Profit'},
                'total_units': {'$sum': '$Units'}
            }
        }
    ]
    
    result = await db.business_data.aggregate(pipeline).to_list(1)
    if result:
        print(f'Total Revenue: €{result[0]["total_revenue"]:,.0f}')
        print(f'Total Profit: €{result[0]["total_profit"]:,.0f}')
        print(f'Total Units: {result[0]["total_units"]:,.0f}')

asyncio.run(reload_data())
