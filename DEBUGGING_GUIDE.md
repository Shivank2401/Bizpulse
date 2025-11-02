# 🐛 BizPulse Data Loading Debugging Guide

## Overview

This guide documents all the issues we encountered while loading real Azure data into MongoDB and how we resolved them. Use this as a reference for future debugging.

---

## Table of Contents

1. [Issue 1: NULL Month_Name in MongoDB](#issue-1-null-month_name-in-mongodb)
2. [Issue 2: Zero Revenue Values](#issue-2-zero-revenue-values)
3. [Issue 3: Column Name Mismatches](#issue-3-column-name-mismatches)
4. [Issue 4: Comma Separators in Numeric Data](#issue-4-comma-separators-in-numeric-data)
5. [Issue 5: Data Distribution Issues (2025 Higher than 2023/2024)](#issue-5-data-distribution-issues)
6. [Issue 6: CORS Error When Backend Crashes](#issue-6-cors-error-when-backend-crashes)
7. [Database Selection](#database-selection)
8. [Verification Scripts](#verification-scripts)

---

## Issue 1: NULL Month_Name in MongoDB

### Problem

After loading data, MongoDB records showed:
```
Month_Name: None
Revenue: 0.0
```

**Impact:** 26,806 records had zero revenue because `Month_Name` was NULL.

### Root Cause

The sync script was using incorrect column mapping. Azure CSV has `'Month Name'` (with space) but the script was looking for different variations.

### Debugging Process

1. **Checked MongoDB records:**
   ```python
   sample = await db.business_data.find_one({'Month_Name': None})
   # Found NULL Month_Name
   ```

2. **Verified CSV columns:**
   ```python
   # Downloaded CSV from Azure
   df = pd.read_csv(StringIO(csv_text))
   print(df.columns)  # Found 'Month Name' with space
   ```

3. **Identified issue:** Rename map didn't include `'Month Name'` → `'Month_Name'`

### Solution

Added correct column mapping to `sync_azure_data.py`:

```python
rename_map = {
    'Month Name': 'Month_Name',  # Add space version
    'Month': 'Month_Name',
    'MonthName': 'Month_Name',
    # ... other mappings
}
```

---

## Issue 2: Zero Revenue Values

### Problem

Even after fixing `Month_Name`, we still had 26,806 records with zero revenue.

**Impact:** Dashboard showed incorrect totals (2023/2024 much lower than expected).

### Root Cause

The `gSales` column in Azure CSV contained comma-separated values like `"7,287.18"` instead of `7287.18`. When converted to numeric, pandas failed to parse them, converting them to 0 or NULL.

### Debugging Process

1. **Checked data types:**
   ```python
   print(df['gSales'].dtype)  # object (string)
   print(df['gSales'].head(20))  # Found values with commas
   ```

2. **Tested conversion:**
   ```python
   pd.to_numeric(df['gSales'], errors='coerce').isna().sum()  # 26,011 NULL values!
   ```

3. **Identified issue:** Comma separators in numeric values

### Solution

Created a helper function to clean numeric columns:

```python
def clean_numeric_column(series):
    """Remove commas and convert to numeric"""
    if series.dtype == 'object':
        return pd.to_numeric(series.astype(str).str.replace(',', ''), errors='coerce').fillna(0)
    return pd.to_numeric(series, errors='coerce').fillna(0)

# Apply to all numeric columns
for col in ['Gross_Profit', 'Revenue', 'Units', 'Year']:
    if col in df.columns:
        df[col] = clean_numeric_column(df[col])
```

**Before fix:**
- 2023: €5.99M
- 2024: €5.33M
- 2025: €64.40M

**After fix:**
- 2023: €116.94M ✅
- 2024: €117.79M ✅
- 2025: €64.40M ✅

---

## Issue 3: Column Name Mismatches

### Problem

Azure CSV has different column names than expected by the backend.

**Azure CSV Columns:**
- `Month Name` (with space)
- `P+L Brand` (with +L)
- `P+L Category` (with +L)
- `Sub-Cat` (with hyphen)
- `SubCat Name` (with space)
- `Brand Type Name` (with spaces)
- `P+L Cust. Grp` (with +L)

**Backend Expected:**
- `Month_Name` (with underscore)
- `PL_Brand` (underscore only)
- `PL_Category` (underscore only)
- `Sub_Cat` (underscore)
- `SubCat_Name` (underscore)
- `Brand_Type_Name` (underscores)
- `PL_Cust_Grp` (underscores)

### Solution

Complete column mapping added to both `server.py` and `sync_azure_data.py`:

```python
rename_map = {
    # Month variations
    'Month Name': 'Month_Name',
    'Month': 'Month_Name',
    'MonthName': 'Month_Name',
    'month_name': 'Month_Name',
    
    # Sub-Category variations
    'Sub-Cat': 'Sub_Cat',
    'Sub_Category': 'Sub_Cat',
    'SubCat Name': 'SubCat_Name',
    'SubCat': 'Sub_Cat',
    'sub_cat': 'Sub_Cat',
    
    # Brand Type variations
    'Brand Type Name': 'Brand_Type_Name',
    'Brand_Type': 'Brand_Type_Name',
    
    # P+L variations
    'P+L Brand': 'PL_Brand',
    'PL Brand': 'PL_Brand',
    'P+L Category': 'PL_Category',
    'PL Category': 'PL_Category',
    'P+L Cust. Grp': 'PL_Cust_Grp',
    'PL Cust Grp': 'PL_Cust_Grp',
    
    # Revenue/Metric mappings
    'gSales': 'Revenue',
    'fGP': 'Gross_Profit',
    'Cases': 'Units',
    
    # Other mappings
    'SKU Channel Name': 'SKU_Channel_Name',
}
```

---

## Issue 4: Comma Separators in Numeric Data

### Problem

Azure CSV stored numeric values with comma separators:
```
gSales: "7,287.18"
Cases: "12,345"
fGP: "2,123.45"
```

When loaded directly:
```python
pd.to_numeric(df['gSales'], errors='coerce')  # Returns 0 or NaN!
```

### Why It Happened

Azure Blob Storage sometimes exports CSVs with locale-specific formatting (European style: comma as thousand separator).

### Solutions

**Option 1: Clean the column (Implemented)**

```python
def clean_numeric_column(series):
    """Remove commas and convert to numeric"""
    if series.dtype == 'object':
        return pd.to_numeric(
            series.astype(str).str.replace(',', ''), 
            errors='coerce'
        ).fillna(0)
    return pd.to_numeric(series, errors='coerce').fillna(0)
```

**Option 2: Import with thousands parameter**

```python
df = pd.read_csv(StringIO(csv_text), thousands=',')
```

**Option 3: Clean entire CSV at load**

```python
df = pd.read_csv(StringIO(csv_text))
# Remove commas from all numeric-looking columns
for col in df.columns:
    if df[col].dtype == 'object':
        # Try to detect numeric columns
        sample = df[col].dropna().head(100)
        if sample.str.contains(r'^\d{1,3}(,\d{3})*(\.\d{2})?$', regex=True).any():
            df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce')
```

---

## Issue 5: Data Distribution Issues

### Problem

Dashboard showed:
- 2023: Very low totals
- 2024: Very low totals  
- 2025: Very high totals

**Suspected:** Data corruption or duplicate loading.

### Investigation

1. **Checked record counts by year:**
   ```python
   pipeline = [
       {'$group': {
           '_id': '$Year',
           'count': {'$sum': 1},
           'total': {'$sum': '$Revenue'}
       }}
   ]
   ```

2. **Found:**
   - 2023: 39,996 records (correct)
   - 2024: 36,270 records (correct)
   - 2025: 19,327 records (correct - incomplete year)

3. **Real issue:** Comma separators caused 2023/2024 to lose 26,000+ values!

### Resolution

After fixing comma separator issue, all years have correct totals.

**Key Lesson:** Distribution issues are often caused by data quality problems (formatting, types, NULLs), not volume.

---

## Issue 6: CORS Error When Backend Crashes with KeyError

### Problem

**Error message:**
```
CORS policy: No 'Access-Control-Allow-Origin' header is present
Failed to load data: {detail: "'Month Name'"}
GET /api/analytics/executive-overview 500 (Internal Server Error)
```

**Symptom:** CORS error appeared suddenly, even though CORS was configured correctly.

### Root Cause

**Not actually a CORS issue!** When a FastAPI route crashes with a 500 error before returning a response, the error handler doesn't include CORS headers. The browser interprets this as a CORS violation, but the real problem is a backend crash.

### Investigation Process

1. **Checked logs:**
   - Error: `{detail: "'Month Name'"}`
   - This is a `KeyError` message

2. **Found in code:**
   ```python
   # Line 398 in server.py
   monthly_trend = df.groupby('Month Name').agg({...})
   # Line 407
   "Month_Name": str(row['Month Name'])
   ```

3. **Root cause:** After syncing data with fixed column names, MongoDB has `Month_Name` (underscore), but the code was still looking for `'Month Name'` (space).

### Solution

Fixed column references in `server.py`:

```python
# BEFORE (WRONG):
monthly_trend = df.groupby('Month Name').agg({...})
"Month_Name": str(row['Month Name'])

# AFTER (CORRECT):
monthly_trend = df.groupby('Month_Name').agg({...})
"Month_Name": str(row['Month_Name'])
```

### Why CORS Was Blaming Wrong

CORS headers are added by middleware **after** the route returns successfully. If the route crashes:

1. Route executes
2. `KeyError: 'Month Name'` is thrown
3. FastAPI error handler returns `{"detail": "'Month Name'"}`
4. **No CORS headers are added**
5. Browser says "CORS violation"

But the real error is the `KeyError`, not CORS!

### Lesson

**When CORS errors appear suddenly:**
1. First check backend logs for 500 errors
2. The crash is the root cause, not CORS configuration
3. Fix the backend error, CORS will work again

---

## Database Selection

### Issue

User initially wanted to use `Bizpulse` database, but data was loaded into `thrivebrands_bi`.

### Resolution

**Important:** Always set `DB_NAME` in `.env` file to match where data should be loaded:

```env
MONGO_URL=mongodb+srv://...@cluster.../Bizpulse
DB_NAME=bizpulse  # Must match the database in MONGO_URL
```

**Note:** The database name in the connection string (`/Bizpulse`) is just the default. The `DB_NAME` environment variable overrides which database is used.

### Both Databases Have Data

After fixing issues, we loaded data into:
1. `thrivebrands_bi` - 95,593 records ✅
2. `bizpulse` - 95,593 records ✅

Both databases now have correct data. Use whichever one your backend `.env` points to.

---

## Verification Scripts

### 1. verify_azure_data.py

**Purpose:** Verify Azure CSV data structure and content.

**Usage:**
```bash
cd backend
python verify_azure_data.py
```

**What it checks:**
- Total record count
- Column names
- Data types
- Sample records
- Unique values (Years, Businesses, Brands)
- Total sums (gSales, fGP, Cases)

---

### 2. check_mongodb.py

**Purpose:** Verify MongoDB data after sync.

**Usage:**
```bash
cd backend
python check_mongodb.py
```

**What it checks:**
- Total record count
- Sample record structure
- Unique values
- Total sums by aggregation

---

### 3. check_year_totals.py

**Purpose:** Verify data distribution by year.

**Usage:**
```bash
cd backend
python check_year_totals.py
```

**What it checks:**
- Record counts by year
- Totals by year (Revenue, Profit, Units)
- NULL/zero value detection
- Sample records with issues

**Expected output:**
```
Year     Records    Revenue              Profit
-----------------------------------------------------------------
2023     39,996     €116,938,920.32      €34,501,770.37
2024     36,270     €117,791,605.02      €35,719,065.68
2025     19,327     €64,401,888.97       €20,309,814.62
```

---

### 4. debug_csv_issue.py

**Purpose:** Debug specific CSV issues (NULL values, column names).

**Usage:**
```bash
cd backend
python debug_csv_issue.py
```

---

### 5. debug_gSales.py

**Purpose:** Debug numeric conversion issues.

**Usage:**
```bash
cd backend
python debug_gSales.py
```

**What it checks:**
- Data type of gSales
- Sample values
- Non-numeric detection
- Conversion success rate
- Distribution of zeros by year

---

## Common Issues and Quick Fixes

### Issue: "Records with NULL revenue"

**Quick Fix:**
```python
# Ensure columns are properly renamed
rename_map = {
    'Month Name': 'Month_Name',  # Add space version!
    'gSales': 'Revenue',
    # ... complete mapping
}
```

---

### Issue: "Total sum much lower than expected"

**Quick Fix:**
```python
# Handle comma separators
def clean_numeric_column(series):
    if series.dtype == 'object':
        return pd.to_numeric(series.astype(str).str.replace(',', ''), errors='coerce').fillna(0)
    return pd.to_numeric(series, errors='coerce').fillna(0)
```

---

### Issue: "Month_Name is None"

**Quick Fix:**
1. Check CSV column name: `print(df.columns)`
2. Add correct mapping to `rename_map`
3. Re-run sync script

---

### Issue: "Wrong database"

**Quick Fix:**
1. Check `.env` file
2. Ensure `MONGO_URL` and `DB_NAME` match
3. Re-run sync script

---

## Best Practices

### 1. Always Verify Azure Data First

Before syncing, verify the CSV structure:

```bash
python verify_azure_data.py
```

### 2. Check After Syncing

After running `sync_azure_data.py`, always verify:

```bash
python check_year_totals.py
```

### 3. Expected Results

- **Total records:** ~95,000
- **Years:** 2023, 2024, 2025
- **2023 Revenue:** ~€117M
- **2024 Revenue:** ~€117M
- **2025 Revenue:** ~€64M
- **Zero revenue records:** < 1000 (acceptable)

### 4. Column Mapping

Always update column mapping in **both** files:
- `backend/server.py` - For Azure sync on startup
- `backend/sync_azure_data.py` - For manual sync

### 5. Data Quality Checks

Always check for:
- NULL values in key fields
- Zero values in numeric fields
- Column name mismatches
- Data type issues
- Comma separators
- Special characters

---

## Sync Script Process

### Complete Flow

1. **Load environment variables** from `.env`
2. **Connect to MongoDB Atlas**
3. **Download CSV from Azure Blob Storage**
4. **Normalize column names** (handle spaces, hyphens, etc.)
5. **Clean numeric columns** (remove commas, convert types)
6. **Delete existing data** (to avoid duplicates)
7. **Insert in batches** (5000 records at a time)
8. **Verify** total count matches

### Key Code

```python
async def load_data():
    # 1. Load env
    MONGO_URL = os.getenv('MONGO_URL')
    DB_NAME = os.getenv('DB_NAME')
    
    # 2. Connect
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # 3. Download CSV
    blob_service = BlobServiceClient.from_connection_string(conn_str)
    blob_client = container_client.get_blob_client(blob_path)
    stream = blob_client.download_blob()
    df = pd.read_csv(StringIO(csv_text))
    
    # 4. Clean and normalize
    df = df.rename(columns=rename_map)
    for col in ['Revenue', 'Gross_Profit', 'Units']:
        df[col] = clean_numeric_column(df[col])
    
    # 5. Insert
    await db.business_data.delete_many({})
    records = df.to_dict(orient='records')
    # Insert in batches...
    
    # 6. Verify
    count = await db.business_data.count_documents({})
    print(f"✅ Loaded {count} records")
```

---

## Environment Variables

### Required in backend/.env

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/Bizpulse?retryWrites=true&w=majority
DB_NAME=bizpulse
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_CONTAINER_NAME=thrive-worklytics
AZURE_BLOB_PATH=Biz-Pulse/yearly_data.csv
```

**Important:** 
- `DB_NAME` should match the database you want to use
- Database name in `MONGO_URL` (`/Bizpulse`) is just the default
- Actual database comes from `DB_NAME` environment variable

---

## Troubleshooting Checklist

When data looks wrong:

1. ✅ **Check Azure CSV directly** - Run `verify_azure_data.py`
2. ✅ **Check MongoDB totals** - Run `check_year_totals.py`
3. ✅ **Check for NULLs** - Look for records with NULL key fields
4. ✅ **Check for zeros** - Look for records with 0 in numeric fields
5. ✅ **Check column names** - Verify mapping matches CSV columns
6. ✅ **Check data types** - Ensure numeric fields are numeric
7. ✅ **Check comma separators** - Look for "7,287.18" format
8. ✅ **Check database selection** - Verify `DB_NAME` in `.env`
9. ✅ **Check total records** - Should be ~95,000
10. ✅ **Compare year totals** - Should be relatively balanced

When CORS errors appear:

1. ✅ **Check backend logs first** - Look for 500 errors
2. ✅ **Not a CORS config issue** - Usually backend crash
3. ✅ **Check for KeyError** - Column name mismatches
4. ✅ **Verify sync script and server.py are in sync** - Same column mappings

---

## Summary of Fixes

| Issue | Symptom | Root Cause | Fix |
|-------|---------|------------|-----|
| NULL Month_Name | 26,806 zero revenue records | Column name mismatch ('Month Name' vs 'Month_Name') | Added 'Month Name' to rename_map |
| Comma separators | 26,011 NULL values after conversion | CSV stored as "7,287.18" not 7287.18 | Created clean_numeric_column() function |
| Low 2023/2024 totals | €5.99M instead of €117M | Comma separators lost data | Cleaned all numeric columns |
| Wrong database | Data in thrivebrands_bi not bizpulse | DB_NAME in .env was wrong | Set correct DB_NAME |
| Column mismatches | NULL values in Business, Channel, etc. | Azure CSV has different column names | Added complete rename_map |
| CORS error after sync | CORS violation, 500 error | Backend crashes with KeyError before CORS headers added | Fixed 'Month Name' to 'Month_Name' in server.py |
| Column name inconsistency | server.py code uses 'Month Name' | Code and data out of sync after sync fixes | Updated server.py to use 'Month_Name' |

---

## Key Takeaways

1. **Always verify Azure CSV structure first** before syncing
2. **Check for comma separators** in numeric data
3. **Use complete column mapping** that handles all variations
4. **Verify after sync** to catch issues early
5. **Keep sync script and server.py mappings in sync**
6. **Use verification scripts** to debug quickly
7. **Check expected totals** (~€117M for 2023/2024, ~€64M for 2025)

---

## Questions to Ask When Debugging

1. "What does the Azure CSV actually contain?" → Run `verify_azure_data.py`
2. "Does MongoDB have the expected data?" → Run `check_year_totals.py`
3. "Are there NULL or zero values?" → Check aggregation results
4. "Are column names matching?" → Verify rename_map
5. "Are data types correct?" → Check dtypes after load
6. "Is the right database selected?" → Check .env file

---

**Last Updated:** October 31, 2025  
**Status:** All issues resolved, data loading working correctly ✅

