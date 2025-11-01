# 🔄 Load Real Data from Azure to MongoDB Atlas

## Quick Solution

### Step 1: Verify Azure Credentials in .env

Make sure your `backend/.env` has these variables:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=kineticadbms;AccountKey=JfMzO69p3Ip+Sz+YkXxp7sHxZw0O/JunSaS5qKnSSQnxk1lPhwiQwnGyyJif7sGB01l9amAdvU/t+ASthIK/ZQ==;EndpointSuffix=core.windows.net
AZURE_CONTAINER_NAME=thrive-worklytics
AZURE_BLOB_PATH=Biz-Pulse/yearly_data.csv
```

---

### Step 2: Trigger Azure Data Sync

**Option A: Via API Endpoint (After SSL is fixed)**

Once your SSL is working, you can trigger the sync via API:

```bash
curl -X GET https://beaconiqbackend.thrivebrands.ai/api/data/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option B: Via CloudPanel Terminal (Easier)**

SSH into your server:

```bash
cd /home/thrivebrands-beaconiqbackend/htdocs/beaconiqbackend.thrivebrands.ai/Bizpulse/backend
source venv/bin/activate
python3
```

Then in Python shell:
```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import pandas as pd
from io import StringIO
from azure.storage.blob import BlobServiceClient

load_dotenv()

async def sync_data():
    # MongoDB connection
    mongo_url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Load from Azure
    conn_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    container_name = os.getenv('AZURE_CONTAINER_NAME')
    blob_path = os.getenv('AZURE_BLOB_PATH')
    
    blob_service = BlobServiceClient.from_connection_string(conn_str)
    container_client = blob_service.get_container_client(container_name)
    blob_client = container_client.get_blob_client(blob_path)
    
    print("Downloading CSV from Azure...")
    stream = blob_client.download_blob()
    csv_bytes = stream.readall()
    csv_text = csv_bytes.decode('utf-8', errors='ignore')
    df = pd.read_csv(StringIO(csv_text))
    
    print(f"Downloaded {len(df)} records")
    
    # Normalize columns
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
    
    # Ensure numeric columns
    for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Convert to list of dicts
    records = df.to_dict(orient='records')
    
    # Clear collection and insert
    await db.business_data.delete_many({})
    batch_size = 5000
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        await db.business_data.insert_many(batch)
        total += len(batch)
        print(f"Inserted {total} records...")
    
    print(f"✅ Successfully loaded {total} records from Azure!")
    client.close()

# Run it
asyncio.run(sync_data())
```

**Option C: Create a Simple Python Script**

Create file `sync_azure_data.py` in backend folder:

```python
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
    
    # Ensure numeric columns
    for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
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
```

Then run:
```bash
cd /home/thrivebrands-beaconiqbackend/htdocs/beaconiqbackend.thrivebrands.ai/Bizpulse/backend
source venv/bin/activate
python3 sync_azure_data.py
```

---

### Step 3: Verify Data Loaded

Check in MongoDB Atlas:
1. Go to MongoDB Atlas dashboard
2. Browse Collections → `Bizpulse` database → `business_data` collection
3. Should see real data with proper Year, Business, Channel, etc.

Or via terminal:
```bash
python3
```

```python
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
db = client[os.getenv('DB_NAME')]
count = await db.business_data.count_documents({})
print(f"Total records: {count}")

# Check a sample
sample = await db.business_data.find_one({})
print(f"\nSample record keys: {list(sample.keys())}")
print(f"Year: {sample.get('Year')}")
print(f"Revenue: {sample.get('Revenue')}")
client.close()
```

---

## ⚠️ Important Notes

1. **Azure credentials must be correct** in `.env`
2. **MongoDB connection must work** (whitelist your IP in Atlas)
3. **The script deletes all old data** before inserting
4. **Run from your backend directory** where `.env` is located

---

## 🆘 Troubleshooting

### "Connection failed"
- Check Azure credentials are correct
- Verify blob path exists in container
- Check network connectivity

### "Invalid credentials"
- Verify MongoDB connection string
- Whitelist your server IP in Atlas
- Check username/password encoding

### "No module named 'motor'"
- Run: `pip install -r requirements.txt`

---

**Run Option C for the easiest method!**

