#!/usr/bin/env python3
"""
Check 2025 data availability
"""

import requests
import json

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
            break

# Login
login_data = {
    "email": "data.admin@thrivebrands.ai",
    "password": "123456User"
}

response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
token = response.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Check executive overview for 2025 data
print("=== Executive Overview - 2025 Data ===")
response = requests.get(f"{BASE_URL}/api/analytics/executive-overview", headers=headers)
data = response.json()
yearly_data = data.get("yearly_performance", [])
for year_record in yearly_data:
    if year_record.get("Year") == 2025:
        print(f"✅ Found 2025 data: Sales=${year_record.get('gSales', 0):,.2f}, fGP=${year_record.get('fGP', 0):,.2f}")

# Check filter options
print("\n=== Filter Options - Available Years ===")
response = requests.get(f"{BASE_URL}/api/filters/options", headers=headers)
data = response.json()
years = data.get("years", [])
print(f"Available years: {years}")
print(f"2025 in years: {2025 in years}")

# Check monthly trend for 2025
monthly_trend = data.get("monthly_trend", [])
if monthly_trend:
    print(f"\n=== Monthly Trend Data (Current Year) ===")
    print(f"Number of months with data: {len(monthly_trend)}")
    for month in monthly_trend[:3]:  # Show first 3 months
        print(f"  {month.get('Month_Name')}: Sales=${month.get('gSales', 0):,.2f}")