import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.getenv('DB_NAME', 'thrivebrands_bi')]

async def check_totals():
    # Get all data and check totals
    data = await db.business_data.find({}, {'_id': 0}).to_list(100000)
    df = pd.DataFrame(data)
    
    print('=== DATAFRAME INFO ===')
    print(f'Total records: {len(df)}')
    print(f'Data types:')
    print(f'  Revenue: {df["Revenue"].dtype}')
    print(f'  Gross_Profit: {df["Gross_Profit"].dtype}')
    print(f'  Units: {df["Units"].dtype}')
    
    print()
    print('=== TOTALS BY YEAR ===')
    yearly_totals = df.groupby('Year').agg({
        'Revenue': 'sum',
        'Gross_Profit': 'sum', 
        'Units': 'sum'
    }).round(2)
    
    for year, row in yearly_totals.iterrows():
        print(f'{year}: Revenue=€{row["Revenue"]:,.0f}, Profit=€{row["Gross_Profit"]:,.0f}, Units={row["Units"]:,.0f}')
    
    print()
    print('=== OVERALL TOTALS ===')
    print(f'Total Revenue: €{df["Revenue"].sum():,.0f}')
    print(f'Total Profit: €{df["Gross_Profit"].sum():,.0f}')
    print(f'Total Units: {df["Units"].sum():,.0f}')

asyncio.run(check_totals())
