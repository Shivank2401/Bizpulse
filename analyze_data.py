import pandas as pd

# Read the CSV file
df = pd.read_csv('yearly_data.csv')

print('=== DATA OVERVIEW ===')
print(f'Total records: {len(df)}')
print(f'Years in data: {sorted(df["Year"].unique())}')
print()

print('=== RECORDS BY YEAR ===')
year_counts = df['Year'].value_counts().sort_index()
for year, count in year_counts.items():
    print(f'{year}: {count:,} records')

print()
print('=== RECORDS BY YEAR AND MONTH ===')
year_month = df.groupby(['Year', 'Month Name']).size().unstack(fill_value=0)
print(year_month)

print()
print('=== REVENUE BY YEAR ===')
revenue_by_year = df.groupby('Year')['gSales'].sum().sort_index()
for year, revenue in revenue_by_year.items():
    print(f'{year}: €{revenue:,.0f}')

print()
print('=== UNITS BY YEAR ===')
units_by_year = df.groupby('Year')['Cases'].sum().sort_index()
for year, units in units_by_year.items():
    print(f'{year}: {units:,.0f} units')

print()
print('=== MONTHS IN 2025 ===')
months_2025 = df[df['Year'] == 2025]['Month Name'].unique()
print(f'2025 months: {sorted(months_2025)}')

print()
print('=== SAMPLE 2025 DATA ===')
sample_2025 = df[df['Year'] == 2025][['Year', 'Month Name', 'gSales', 'Cases']].head(10)
print(sample_2025)
