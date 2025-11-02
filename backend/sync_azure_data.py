import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import pandas as pd
from io import StringIO
from azure.storage.blob import BlobServiceClient

# Load environment variables
load_dotenv()

async def load_data():
    # MongoDB connection
    MONGO_URL = os.getenv('MONGO_URL')
    DB_NAME = os.getenv('DB_NAME')
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Load from Azure
    conn_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    container_name = os.getenv('AZURE_CONTAINER_NAME')
    blob_path = os.getenv('AZURE_BLOB_PATH')
    
    print("📥 Downloading CSV from Azure...")
    blob_service = BlobServiceClient.from_connection_string(conn_str)
    container_client = blob_service.get_container_client(container_name)
    blob_client = container_client.get_blob_client(blob_path)
    
    stream = blob_client.download_blob()
    csv_bytes = stream.readall()
    csv_text = csv_bytes.decode('utf-8', errors='ignore')
    df = pd.read_csv(StringIO(csv_text))
    
    print(f"✅ Downloaded {len(df)} records from Azure")
    
    # Normalize column names
    rename_map = {
        'Month': 'Month_Name',
        'Month Name': 'Month_Name',  # Add space version
        'MonthName': 'Month_Name',
        'month_name': 'Month_Name',
        'Sub-Cat': 'Sub_Cat',  # Add hyphen version
        'Sub_Category': 'Sub_Cat',
        'SubCat': 'Sub_Cat',
        'sub_cat': 'Sub_Cat',
        'Brand Type Name': 'Brand_Type_Name',  # Add space version
        'Brand_Type': 'Brand_Type_Name',
        'P+L Brand': 'PL_Brand',  # Add correct Azure column name
        'PL Brand': 'PL_Brand',
        'P+L Category': 'PL_Category',  # Add correct Azure column name
        'PL Category': 'PL_Category',
        'SubCat Name': 'SubCat_Name',  # Add space version
        'SKU Channel Name': 'SKU_Channel_Name',
        'P+L Cust. Grp': 'PL_Cust_Grp',  # Add correct Azure column name
        'PL Cust Grp': 'PL_Cust_Grp',
        'gSales': 'Revenue',
        'fGP': 'Gross_Profit',
        'Cases': 'Units',
    }
    df = df.rename(columns=rename_map)
    
    # Ensure numeric columns - handle comma separators
    def clean_numeric_column(series):
        """Remove commas and convert to numeric"""
        if series.dtype == 'object':
            # Remove commas and convert
            return pd.to_numeric(series.astype(str).str.replace(',', ''), errors='coerce').fillna(0)
        return pd.to_numeric(series, errors='coerce').fillna(0)
    
    for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
        if col in df.columns:
            df[col] = clean_numeric_column(df[col])
    
    # Convert to list of dicts
    records = df.to_dict(orient='records')
    
    # Clear old data and insert new
    print("🗑️  Clearing old dummy data...")
    await db.business_data.delete_many({})
    
    print("💾 Inserting real data...")
    batch_size = 5000
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        await db.business_data.insert_many(batch)
        total += len(batch)
        print(f"   Inserted {total}/{len(records)} records...")
    
    print(f"\n🎉 Successfully loaded {total} real records from Azure!")
    
    # Verify
    count = await db.business_data.count_documents({})
    print(f"✅ MongoDB now has {count} records")
    
    client.close()

if __name__ == "__main__":
    print("🚀 Starting Azure data sync...\n")
    asyncio.run(load_data())

