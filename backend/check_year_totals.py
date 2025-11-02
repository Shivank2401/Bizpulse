import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_year_totals():
    MONGO_URL = os.getenv('MONGO_URL')
    DB_NAME = os.getenv('DB_NAME')
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"📊 Checking data in database: {DB_NAME}\n")
    
    # Count records by year
    for year in [2023, 2024, 2025]:
        count = await db.business_data.count_documents({'Year': year})
        print(f"Year {year}: {count:,} records")
    
    # Get totals by year from database
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
    
    results = await db.business_data.aggregate(pipeline).to_list(10)
    
    print(f"\n💰 TOTALS BY YEAR:")
    print(f"{'Year':<8} {'Records':<10} {'Revenue':<20} {'Profit':<20}")
    print("-" * 65)
    
    for result in results:
        year = result['_id']
        revenue = result['total_revenue']
        profit = result['total_profit']
        count = result['record_count']
        print(f"{year:<8} {count:<10,} €{revenue:<19,.2f} €{profit:<19,.2f}")
    
    # Check for null/missing Revenue values
    null_revenue_count = await db.business_data.count_documents({'Revenue': None})
    zero_revenue_count = await db.business_data.count_documents({'Revenue': 0})
    
    print(f"\n⚠️  DATA ISSUES:")
    print(f"   Records with NULL revenue: {null_revenue_count:,}")
    print(f"   Records with ZERO revenue: {zero_revenue_count:,}")
    
    # Get sample records with revenue issues
    if null_revenue_count > 0 or zero_revenue_count > 0:
        print(f"\n📋 Sample records with revenue issues:")
        sample = await db.business_data.find_one({'$or': [{'Revenue': None}, {'Revenue': 0}]})
        if sample:
            print(f"   Year: {sample.get('Year')}")
            print(f"   Month_Name: {sample.get('Month_Name')}")
            print(f"   Business: {sample.get('Business')}")
            print(f"   Revenue field: {sample.get('Revenue')}")
            print(f"   Has gSales field: {'gSales' in sample}")
            if 'gSales' in sample:
                print(f"   gSales value: {sample.get('gSales')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_year_totals())

