import pandas as pd

df = pd.read_csv('yearly_data.csv')

print('=== 2025 DATA ANALYSIS ===')
df_2025 = df[df['Year'] == 2025]
print(f'2025 records: {len(df_2025)}')
print(f'2025 gSales range: {df_2025["gSales"].min()} to {df_2025["gSales"].max()}')
print(f'2025 fGP range: {df_2025["fGP"].min()} to {df_2025["fGP"].max()}')
print(f'2025 Cases range: {df_2025["Cases"].min()} to {df_2025["Cases"].max()}')

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
