import pandas as pd

# Load the CSV file
df = pd.read_csv('yearly_data (1).csv')

print('=== DETAILED DATA ANALYSIS ===')
print(f'Total records: {len(df)}')
print(f'Years in data: {sorted(df["Year"].unique())}')

# Check each year separately
for year in [2023, 2024, 2025]:
    print(f'\n=== {year} DATA ANALYSIS ===')
    df_year = df[df['Year'] == year]
    print(f'{year} records: {len(df_year)}')
    print(f'{year} months: {df_year["Month Name"].unique().tolist()}')
    
    # Check for any string values in numeric columns
    print(f'\n{year} - Checking for non-numeric values:')
    for col in ['gSales', 'fGP', 'Cases']:
        if col in df_year.columns:
            # Check for non-numeric values
            non_numeric = df_year[~pd.to_numeric(df_year[col], errors='coerce').notna()]
            if len(non_numeric) > 0:
                print(f'  {col}: {len(non_numeric)} non-numeric values found')
                print(f'    Sample non-numeric values: {non_numeric[col].head(3).tolist()}')
            else:
                print(f'  {col}: All values are numeric')
    
    # Convert to numeric and check ranges
    print(f'\n{year} - Numeric ranges (after conversion):')
    for col in ['gSales', 'fGP', 'Cases']:
        if col in df_year.columns:
            df_year[col] = pd.to_numeric(df_year[col], errors='coerce').fillna(0)
            print(f'  {col}: {df_year[col].min():.2f} to {df_year[col].max():.2f}')
    
    # Calculate totals
    print(f'\n{year} - Totals:')
    total_sales = df_year['gSales'].sum()
    total_profit = df_year['fGP'].sum()
    total_cases = df_year['Cases'].sum()
    print(f'  Total gSales: €{total_sales:,.2f}')
    print(f'  Total fGP: €{total_profit:,.2f}')
    print(f'  Total Cases: {total_cases:,.0f}')
    
    # Monthly breakdown
    print(f'\n{year} - Monthly breakdown:')
    monthly = df_year.groupby('Month Name').agg({
        'gSales': 'sum',
        'fGP': 'sum',
        'Cases': 'sum'
    }).round(2)
    print(monthly)

print('\n=== COMPARISON ACROSS YEARS ===')
comparison_data = []
for year in [2023, 2024, 2025]:
    df_year = df[df['Year'] == year]
    for col in ['gSales', 'fGP', 'Cases']:
        if col in df_year.columns:
            df_year[col] = pd.to_numeric(df_year[col], errors='coerce').fillna(0)
    
    total_sales = df_year['gSales'].sum()
    total_profit = df_year['fGP'].sum()
    total_cases = df_year['Cases'].sum()
    record_count = len(df_year)
    
    comparison_data.append({
        'Year': year,
        'Records': record_count,
        'Total_Sales': total_sales,
        'Total_Profit': total_profit,
        'Total_Cases': total_cases,
        'Avg_Sales_Per_Record': total_sales / record_count if record_count > 0 else 0,
        'Avg_Profit_Per_Record': total_profit / record_count if record_count > 0 else 0,
        'Avg_Cases_Per_Record': total_cases / record_count if record_count > 0 else 0
    })

comparison_df = pd.DataFrame(comparison_data)
print(comparison_df.to_string(index=False))

print('\n=== SAMPLE RECORDS FROM EACH YEAR ===')
for year in [2023, 2024, 2025]:
    df_year = df[df['Year'] == year]
    print(f'\n{year} sample records:')
    sample = df_year[['Year', 'Month Name', 'gSales', 'fGP', 'Cases']].head(5)
    print(sample.to_string(index=False))
