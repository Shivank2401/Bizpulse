#!/usr/bin/env python3
"""
Test the category analysis endpoint after fix
"""

import requests
import json

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
            break

print(f"Testing category analysis at: {BASE_URL}")

# Login first
login_data = {
    "email": "data.admin@thrivebrands.ai",
    "password": "123456User"
}

try:
    # Login
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=10)
    if response.status_code == 200:
        token = response.json()["token"]
        print("✅ Login successful")
        
        # Test category analysis
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/category-analysis", headers=headers, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Category Analysis API working!")
            print(f"Categories: {len(data.get('category_performance', []))}")
            print(f"Sub-categories: {len(data.get('subcategory_performance', []))}")
            print(f"Board categories: {len(data.get('board_category_performance', []))}")
        else:
            print(f"❌ Category Analysis failed: {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print(f"❌ Login failed: {response.status_code}")

except Exception as e:
    print(f"❌ Error: {e}")