import requests
import json

# Login first
login_data = {
    "email": "data.admin@thrivebrands.ai",
    "password": "123456User"
}

response = requests.post("http://localhost:8001/api/auth/login", json=login_data)
print(f"Login response: {response.status_code}")
if response.status_code == 200:
    token = response.json()['token']
    print(f"Token received: {token[:50]}...")
    
    # Test executive overview
    headers = {"Authorization": f"Bearer {token}"}
    exec_response = requests.get("http://localhost:8001/api/analytics/executive-overview", headers=headers)
    print(f"\nExecutive Overview response: {exec_response.status_code}")
    if exec_response.status_code == 200:
        data = exec_response.json()
        print(f"Total Revenue: ${data.get('total_revenue', 0):,.0f}")
        print(f"Total Profit: ${data.get('total_profit', 0):,.0f}")
        print(f"Total Units: {data.get('total_units', 0):,}")
        print(f"Yearly records: {len(data.get('yearly_performance', []))}")
        print(f"Business records: {len(data.get('business_performance', []))}")
    else:
        print(f"Error: {exec_response.text}")
else:
    print(f"Login failed: {response.text}")
