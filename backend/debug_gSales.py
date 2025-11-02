import os
from dotenv import load_dotenv
import pandas as pd
from io import StringIO
from azure.storage.blob import BlobServiceClient

load_dotenv()

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

print(f"Total records: {len(df)}\n")

# Check gSales
print("🔍 Checking gSales column:")
print(f"   Data type: {df['gSales'].dtype}")
print(f"   Sample values:\n{df['gSales'].head(20)}")
print()

# Check for non-numeric values
non_numeric = df[pd.to_numeric(df['gSales'], errors='coerce').isna()]
print(f"⚠️  Non-numeric gSales values: {len(non_numeric)}")
if len(non_numeric) > 0:
    print("Sample non-numeric gSales:")
    print(non_numeric[['Year', 'Month Name', 'Business', 'gSales']].head(10))
    print()

# Convert and check results
df['gSales_num'] = pd.to_numeric(df['gSales'], errors='coerce')
print(f"After conversion:")
print(f"   NULL/NaN values: {df['gSales_num'].isna().sum()}")
print(f"   ZERO values: {(df['gSales_num'] == 0).sum()}")
print(f"   Total sum: €{df['gSales_num'].sum():,.2f}")

# Show examples with zero gSales
zero_gSales = df[df['gSales_num'] == 0]
print(f"\nZero gSales records by year:")
print(zero_gSales.groupby('Year').size())

