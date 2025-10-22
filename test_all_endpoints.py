import requests
import json

# Login
login_data = {
    "email": "data.admin@thrivebrands.ai",
    "password": "123456User"
}

response = requests.post("http://localhost:8001/api/auth/login", json=login_data)
token = response.json()['token']
headers = {"Authorization": f"Bearer {token}"}

# Test all endpoints
endpoints = [
    "/api/analytics/executive-overview",
    "/api/analytics/customer-analysis",
    "/api/analytics/brand-analysis", 
    "/api/analytics/category-analysis"
]

for endpoint in endpoints:
    try:
        r = requests.get(f"http://localhost:8001{endpoint}", headers=headers)
        print(f"{endpoint}: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"  Keys: {list(data.keys())[:5]}")
        else:
            print(f"  Error: {r.text[:100]}")
    except Exception as e:
        print(f"{endpoint}: ERROR - {str(e)}")
    print()
