import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.getenv('DB_NAME', 'thrivebrands_bi')]

async def check_columns():
    sample = await db.business_data.find_one({}, {'_id': 0})
    print('Sample record columns:')
    for key, value in sample.items():
        print(f'  {key}: {value} (type: {type(value).__name__})')
    
    print()
    print('Column existence check:')
    print(f'  Revenue column exists: {"Revenue" in sample}')
    print(f'  gSales column exists: {"gSales" in sample}')
    print(f'  Gross_Profit column exists: {"Gross_Profit" in sample}')
    print(f'  fGP column exists: {"fGP" in sample}')
    print(f'  Units column exists: {"Units" in sample}')
    print(f'  Cases column exists: {"Cases" in sample}')

asyncio.run(check_columns())
