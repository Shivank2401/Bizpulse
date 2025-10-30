import pandas as pd
import re

def clean_numeric_value(value):
    """Clean numeric values by removing commas and converting to float"""
    if pd.isna(value):
        return 0.0
    
    # Convert to string and remove commas
    str_value = str(value).replace(',', '')
    
    # Try to convert to float
    try:
        return float(str_value)
    except (ValueError, TypeError):
        return 0.0

# Load the CSV file
print("Loading CSV file...")
df = pd.read_csv('yearly_data (1).csv')

print(f"Original data shape: {df.shape}")
print(f"Years: {sorted(df['Year'].unique())}")

# Clean the numeric columns
print("\nCleaning numeric columns...")
for col in ['gSales', 'fGP', 'Cases']:
    if col in df.columns:
        print(f"Cleaning {col}...")
        # Apply cleaning function
        df[col] = df[col].apply(clean_numeric_value)
        print(f"  {col} range: {df[col].min():.2f} to {df[col].max():.2f}")

# Verify the cleaning worked
print("\n=== VERIFICATION AFTER CLEANING ===")
for year in [2023, 2024, 2025]:
    df_year = df[df['Year'] == year]
    print(f"\n{year} - Cleaned data:")
    print(f"  Records: {len(df_year)}")
    print(f"  gSales range: {df_year['gSales'].min():.2f} to {df_year['gSales'].max():.2f}")
    print(f"  fGP range: {df_year['fGP'].min():.2f} to {df_year['fGP'].max():.2f}")
    print(f"  Cases range: {df_year['Cases'].min():.0f} to {df_year['Cases'].max():.0f}")
    
    total_sales = df_year['gSales'].sum()
    total_profit = df_year['fGP'].sum()
    total_cases = df_year['Cases'].sum()
    print(f"  Total gSales: €{total_sales:,.2f}")
    print(f"  Total fGP: €{total_profit:,.2f}")
    print(f"  Total Cases: {total_cases:,.0f}")
    print(f"  Avg per record: €{total_sales/len(df_year):.2f}")

# Save the cleaned data
print(f"\nSaving cleaned data...")
df.to_csv('yearly_data_cleaned.csv', index=False)
print("Cleaned data saved as 'yearly_data_cleaned.csv'")

# Show sample of cleaned data
print("\n=== SAMPLE CLEANED DATA ===")
for year in [2023, 2024, 2025]:
    df_year = df[df['Year'] == year]
    print(f"\n{year} sample (first 3 records):")
    sample = df_year[['Year', 'Month Name', 'gSales', 'fGP', 'Cases']].head(3)
    print(sample.to_string(index=False))
