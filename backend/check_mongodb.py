import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_mongodb():
    MONGO_URL = os.getenv('MONGO_URL')
    DB_NAME = os.getenv('DB_NAME')
    
    print(f"📊 Connecting to MongoDB Atlas...")
    print(f"   Database: {DB_NAME}\n")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Count total records
    total_count = await db.business_data.count_documents({})
    print(f"✅ Total records in MongoDB: {total_count:,}\n")
    
    # Get a sample
    sample = await db.business_data.find_one({})
    if sample:
        print(f"📄 SAMPLE RECORD:")
        print(f"   Year: {sample.get('Year')}")
        print(f"   Business: {sample.get('Business')}")
        print(f"   Channel: {sample.get('Channel')}")
        print(f"   Brand: {sample.get('Brand')}")
        print(f"   Revenue: €{sample.get('Revenue', 0):,.2f}")
        print(f"   Gross_Profit: €{sample.get('Gross_Profit', 0):,.2f}")
        print(f"   Units: {sample.get('Units', 0):,}\n")
    
    # Get unique values
    years = await db.business_data.distinct('Year')
    businesses = await db.business_data.distinct('Business')
    brands = await db.business_data.distinct('Brand')
    
    print(f"🔢 UNIQUE VALUES:")
    print(f"   Years: {sorted(years)}")
    print(f"   Businesses: {len(businesses)} - {businesses[:5]}")
    print(f"   Total Brands: {len(brands)}\n")
    
    # Calculate totals
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
        print(f"💰 TOTALS:")
        print(f"   Total Revenue: €{result[0].get('total_revenue', 0):,.2f}")
        print(f"   Total Profit: €{result[0].get('total_profit', 0):,.2f}")
        print(f"   Total Units: {result[0].get('total_units', 0):,}\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_mongodb())

