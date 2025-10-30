import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client[os.getenv('DB_NAME', 'thrivebrands_bi')]

async def check_yearly_data():
    # Check actual data by year
    for year in [2023, 2024, 2025]:
        pipeline = [
            {'$match': {'Year': year}},
            {
                '$group': {
                    '_id': '$Year',
                    'total_revenue': {'$sum': '$Revenue'},
                    'total_profit': {'$sum': '$Gross_Profit'},
                    'total_units': {'$sum': '$Units'},
                    'record_count': {'$sum': 1}
                }
            }
        ]
        
        result = await db.business_data.aggregate(pipeline).to_list(1)
        if result:
            data = result[0]
            print(f'{year}: Revenue=€{data["total_revenue"]:,.0f}, Profit=€{data["total_profit"]:,.0f}, Units={data["total_units"]:,.0f}, Records={data["record_count"]:,}')
        
        # Check sample records for this year
        sample = await db.business_data.find_one({'Year': year}, {'_id': 0, 'Year': 1, 'Revenue': 1, 'Gross_Profit': 1, 'Units': 1})
        if sample:
            print(f'  Sample {year}: Revenue={sample["Revenue"]}, Profit={sample["Gross_Profit"]}, Units={sample["Units"]}')

asyncio.run(check_yearly_data())
