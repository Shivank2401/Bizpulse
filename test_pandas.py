import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')

async def test_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['thrivebrands_bi']
    
    # Get some data
    data = await db.business_data.find({}, {"_id": 0}).limit(100).to_list(100)
    print(f"Retrieved {len(data)} records")
    
    if data:
        df = pd.DataFrame(data)
        print(f"\nDataFrame columns: {list(df.columns)}")
        print(f"\nDataFrame shape: {df.shape}")
        
        # Check if columns exist
        print(f"\n'Revenue' in columns: {'Revenue' in df.columns}")
        print(f"'Gross_Profit' in columns: {'Gross_Profit' in df.columns}")
        print(f"'Units' in columns: {'Units' in df.columns}")
        
        # Try aggregation
        try:
            yearly = df.groupby('Year').agg({
                'Gross_Profit': 'sum',
                'Revenue': 'sum',
                'Units': 'sum'
            }).reset_index()
            print(f"\n✅ Aggregation successful!")
            print(yearly)
        except Exception as e:
            print(f"\n❌ Aggregation failed: {str(e)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_data())
