import os
from dotenv import load_dotenv
import pandas as pd
from io import StringIO
from azure.storage.blob import BlobServiceClient

# Load environment variables
load_dotenv()

print("🔍 Verifying Azure Data...\n")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

# Load from Azure
conn_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
container_name = os.getenv('AZURE_CONTAINER_NAME')
blob_path = os.getenv('AZURE_BLOB_PATH')

print(f"📥 Downloading CSV from Azure...")
print(f"   Container: {container_name}")
print(f"   Blob Path: {blob_path}\n")

blob_service = BlobServiceClient.from_connection_string(conn_str)
container_client = blob_service.get_container_client(container_name)
blob_client = container_client.get_blob_client(blob_path)

stream = blob_client.download_blob()
csv_bytes = stream.readall()
csv_text = csv_bytes.decode('utf-8', errors='ignore')
df = pd.read_csv(StringIO(csv_text))

print(f"✅ Downloaded {len(df)} records from Azure\n")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

# Show columns
print("📊 COLUMNS IN CSV:")
for col in df.columns:
    print(f"  • {col}")
print()

# Show data types
print("📋 DATA TYPES:")
print(df.dtypes)
print()

# Show sample records
print("📄 SAMPLE RECORDS (first 3):")
print(df.head(3))
print()

# Show unique values for key columns
print("🔢 UNIQUE VALUES:")
if 'Year' in df.columns:
    print(f"  Years: {sorted(df['Year'].unique())}")
if 'Business' in df.columns:
    print(f"  Businesses: {df['Business'].unique().tolist()}")
if 'Brand' in df.columns:
    print(f"  Total Brands: {df['Brand'].nunique()}")
    print(f"  Sample Brands: {df['Brand'].unique()[:10].tolist()}")

# Show summary statistics
if 'gSales' in df.columns:
    gSales_num = pd.to_numeric(df['gSales'], errors='coerce')
    print(f"\n💰 gSales Summary:")
    print(f"  Total: €{gSales_num.sum():,.2f}")
    print(f"  Mean: €{gSales_num.mean():,.2f}")
    print(f"  Min: €{gSales_num.min():,.2f}")
    print(f"  Max: €{gSales_num.max():,.2f}")
elif 'Revenue' in df.columns:
    Revenue_num = pd.to_numeric(df['Revenue'], errors='coerce')
    print(f"\n💰 Revenue Summary:")
    print(f"  Total: €{Revenue_num.sum():,.2f}")
    print(f"  Mean: €{Revenue_num.mean():,.2f}")
    print(f"  Min: €{Revenue_num.min():,.2f}")
    print(f"  Max: €{Revenue_num.max():,.2f}")

print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

