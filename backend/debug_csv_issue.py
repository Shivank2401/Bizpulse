import os
from dotenv import load_dotenv
import pandas as pd
from io import StringIO
from azure.storage.blob import BlobServiceClient

load_dotenv()

print("🔍 Debugging CSV Data Issues...\n")

# Load from Azure
conn_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
container_name = os.getenv('AZURE_CONTAINER_NAME')
blob_path = os.getenv('AZURE_BLOB_PATH')

blob_service = BlobServiceClient.from_connection_string(conn_str)
container_client = blob_service.get_container_client(container_name)
blob_client = container_client.get_blob_client(blob_path)

stream = blob_client.download_blob()
csv_bytes = stream.readall()
csv_text = csv_bytes.decode('utf-8', errors='ignore')
df = pd.read_csv(StringIO(csv_text))

print(f"✅ Downloaded {len(df)} records\n")

# Check for NULL Month Name
null_month = df[df['Month Name'].isna()]
print(f"⚠️  Records with NULL 'Month Name': {len(null_month)}")
if len(null_month) > 0:
    print(f"\nSample NULL Month Name records:")
    print(null_month.head(3))
    print()

# Check what columns these records have
if len(null_month) > 0:
    print("Columns with data in NULL month records:")
    for col in null_month.columns:
        non_null_count = null_month[col].notna().sum()
        if non_null_count > 0:
            print(f"  {col}: {non_null_count} non-null values")

# Check actual column name
print(f"\nActual column name in CSV: 'Month Name'")
print(f"Columns containing 'Month': {[col for col in df.columns if 'Month' in col]}")

# Show gSales value for NULL month records
if len(null_month) > 0 and 'gSales' in null_month.columns:
    print(f"\n💰 gSales values in NULL month records:")
    print(null_month['gSales'].head(10))

