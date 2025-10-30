import pandas as pd

# Load the new CSV file
df = pd.read_csv('yearly_data (1).csv')

print('=== FILE OVERVIEW ===')
print(f'Total records: {len(df)}')
print(f'Years in data: {sorted(df["Year"].unique())}')
print(f'Columns: {list(df.columns)}')

print()
print('=== 2025 DATA ANALYSIS ===')
df_2025 = df[df['Year'] == 2025]
print(f'2025 records: {len(df_2025)}')
print(f'2025 months: {df_2025["Month Name"].unique().tolist()}')

# Check the numeric columns
print()
print('=== 2025 NUMERIC VALUES RANGE ===')
print(f'gSales range: {df_2025["gSales"].min()} to {df_2025["gSales"].max()}')
print(f'fGP range: {df_2025["fGP"].min()} to {df_2025["fGP"].max()}')
print(f'Cases range: {df_2025["Cases"].min()} to {df_2025["Cases"].max()}')

print()
print('=== SAMPLE 2025 RECORDS ===')
print(df_2025[['Year', 'Month Name', 'gSales', 'fGP', 'Cases']].head(10))

print()
print('=== 2023 DATA FOR COMPARISON ===')
df_2023 = df[df['Year'] == 2023]
print(f'2023 gSales range: {df_2023["gSales"].min()} to {df_2023["gSales"].max()}')
print(df_2023[['Year', 'Month Name', 'gSales', 'fGP', 'Cases']].head(5))

print()
print('=== 2025 MONTHLY BREAKDOWN ===')
monthly_2025 = df_2025.groupby('Month Name').agg({
    'gSales': ['sum', 'mean', 'count'],
    'fGP': ['sum', 'mean'],
    'Cases': ['sum', 'mean']
}).round(2)
print(monthly_2025)

print()
print('=== 2025 TOTAL VALUES ===')
print(f'2025 Total gSales: {df_2025["gSales"].sum():,.2f}')
print(f'2025 Total fGP: {df_2025["fGP"].sum():,.2f}')
print(f'2025 Total Cases: {df_2025["Cases"].sum():,.0f}')

print()
print('=== 2023 TOTAL VALUES FOR COMPARISON ===')
print(f'2023 Total gSales: {df_2023["gSales"].sum():,.2f}')
print(f'2023 Total fGP: {df_2023["fGP"].sum():,.2f}')
print(f'2023 Total Cases: {df_2023["Cases"].sum():,.0f}')
