import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.getenv('DB_NAME', 'thrivebrands_bi')]

async def check_mongodb_data():
    # Check a few 2025 records to see what's actually stored
    print('=== 2025 RECORDS IN MONGODB ===')
    records_2025 = await db.business_data.find({'Year': 2025}).limit(5).to_list(5)
    for i, record in enumerate(records_2025):
        print(f'Record {i+1}:')
        print(f'  Revenue: {record.get("Revenue")} (type: {type(record.get("Revenue"))})')
        print(f'  Gross_Profit: {record.get("Gross_Profit")} (type: {type(record.get("Gross_Profit"))})')
        print(f'  Units: {record.get("Units")} (type: {type(record.get("Units"))})')
        print()
    
    # Check 2023 for comparison
    print('=== 2023 RECORDS IN MONGODB (for comparison) ===')
    records_2023 = await db.business_data.find({'Year': 2023}).limit(3).to_list(3)
    for i, record in enumerate(records_2023):
        print(f'Record {i+1}:')
        print(f'  Revenue: {record.get("Revenue")} (type: {type(record.get("Revenue"))})')
        print(f'  Gross_Profit: {record.get("Gross_Profit")} (type: {type(record.get("Gross_Profit"))})')
        print(f'  Units: {record.get("Units")} (type: {type(record.get("Units"))})')
        print()

asyncio.run(check_mongodb_data())
