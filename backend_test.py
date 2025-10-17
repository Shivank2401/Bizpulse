#!/usr/bin/env python3
"""
ThriveBrands BIZ Pulse Portal - Backend API Testing
Tests all backend endpoints for functionality and data integrity
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

print(f"Testing backend at: {BASE_URL}")

# Test results tracking
test_results = {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(test_name, success, message="", response_data=None):
    """Log test results"""
    test_results["total_tests"] += 1
    if success:
        test_results["passed"] += 1
        print(f"✅ {test_name}: {message}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")
        print(f"❌ {test_name}: {message}")
    
    if response_data and not success:
        print(f"   Response: {response_data}")

def test_login_authentication():
    """Test login authentication with different password combinations"""
    print("\n=== Testing Login Authentication ===")
    
    # Test with password from test request (123456)
    login_data = {
        "email": "data.admin@thrivebrands.ai",
        "password": "123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "email" in data:
                log_test("Login with password '123456'", True, f"Successfully authenticated user: {data['email']}")
                return data["token"]
            else:
                log_test("Login with password '123456'", False, "Missing token or email in response", data)
        else:
            # Try with the password from backend code (123456User)
            login_data["password"] = "123456User"
            response2 = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=10)
            
            if response2.status_code == 200:
                data = response2.json()
                if "token" in data and "email" in data:
                    log_test("Login with password '123456User'", True, f"Successfully authenticated user: {data['email']}")
                    return data["token"]
                else:
                    log_test("Login with password '123456User'", False, "Missing token or email in response", data)
            else:
                log_test("Login Authentication", False, 
                        f"Both passwords failed. Status: {response.status_code}, {response2.status_code}", 
                        {"first_response": response.text, "second_response": response2.text})
    
    except requests.exceptions.RequestException as e:
        log_test("Login Authentication", False, f"Request failed: {str(e)}")
    
    return None

def test_analytics_endpoints(token):
    """Test all analytics endpoints"""
    print("\n=== Testing Analytics Endpoints ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    analytics_endpoints = [
        ("/api/analytics/executive-overview", "Executive Overview"),
        ("/api/analytics/customer-analysis", "Customer Analysis"),
        ("/api/analytics/brand-analysis", "Brand Analysis"),
        ("/api/analytics/category-analysis", "Category Analysis")
    ]
    
    for endpoint, name in analytics_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response contains expected data structure
                if endpoint == "/api/analytics/executive-overview":
                    expected_keys = ["yearly_performance", "business_performance", "monthly_trend"]
                    if all(key in data for key in expected_keys):
                        # Check if we have 2025 data
                        yearly_data = data.get("yearly_performance", [])
                        has_2025 = any(item.get("Year") == 2025 for item in yearly_data)
                        log_test(f"{name} API", True, 
                                f"Valid data structure. Has 2025 data: {has_2025}. Records: {len(yearly_data)}")
                    else:
                        log_test(f"{name} API", False, f"Missing expected keys: {expected_keys}", data)
                
                elif endpoint == "/api/analytics/customer-analysis":
                    expected_keys = ["channel_performance", "customer_performance", "top_customers"]
                    if all(key in data for key in expected_keys):
                        channels = len(data.get("channel_performance", []))
                        customers = len(data.get("customer_performance", []))
                        log_test(f"{name} API", True, f"Valid data. Channels: {channels}, Customers: {customers}")
                    else:
                        log_test(f"{name} API", False, f"Missing expected keys: {expected_keys}", data)
                
                elif endpoint == "/api/analytics/brand-analysis":
                    expected_keys = ["brand_performance", "brand_by_business", "brand_yoy_growth"]
                    if all(key in data for key in expected_keys):
                        brands = len(data.get("brand_performance", []))
                        log_test(f"{name} API", True, f"Valid data. Brands: {brands}")
                    else:
                        log_test(f"{name} API", False, f"Missing expected keys: {expected_keys}", data)
                
                elif endpoint == "/api/analytics/category-analysis":
                    expected_keys = ["category_performance", "subcategory_performance", "board_category_performance"]
                    if all(key in data for key in expected_keys):
                        categories = len(data.get("category_performance", []))
                        log_test(f"{name} API", True, f"Valid data. Categories: {categories}")
                    else:
                        log_test(f"{name} API", False, f"Missing expected keys: {expected_keys}", data)
            
            else:
                log_test(f"{name} API", False, f"HTTP {response.status_code}", response.text)
        
        except requests.exceptions.RequestException as e:
            log_test(f"{name} API", False, f"Request failed: {str(e)}")

def test_filter_endpoints(token):
    """Test filter endpoints"""
    print("\n=== Testing Filter Endpoints ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/filters/options", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            expected_filters = ["years", "months", "businesses", "channels", "brands", "categories"]
            missing_filters = [f for f in expected_filters if f not in data]
            
            if not missing_filters:
                # Check if we have meaningful data
                years = data.get("years", [])
                months = data.get("months", [])
                businesses = data.get("businesses", [])
                
                has_2025 = 2025 in years
                log_test("Filter Options API", True, 
                        f"All filters available. Years: {len(years)} (2025: {has_2025}), "
                        f"Months: {len(months)}, Businesses: {len(businesses)}")
            else:
                log_test("Filter Options API", False, f"Missing filters: {missing_filters}", data)
        
        else:
            log_test("Filter Options API", False, f"HTTP {response.status_code}", response.text)
    
    except requests.exceptions.RequestException as e:
        log_test("Filter Options API", False, f"Request failed: {str(e)}")

def test_data_sync_endpoint(token):
    """Test data sync endpoint"""
    print("\n=== Testing Data Sync Endpoint ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/data/sync", headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if "status" in data and "records_count" in data:
                records_count = data.get("records_count", 0)
                log_test("Data Sync API", True, 
                        f"Sync successful. Status: {data['status']}, Records: {records_count}")
            else:
                log_test("Data Sync API", False, "Missing status or records_count in response", data)
        
        else:
            log_test("Data Sync API", False, f"HTTP {response.status_code}", response.text)
    
    except requests.exceptions.RequestException as e:
        log_test("Data Sync API", False, f"Request failed: {str(e)}")

def test_ai_chat_endpoint(token):
    """Test AI chat endpoint"""
    print("\n=== Testing AI Chat Endpoint ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    chat_data = {
        "message": "What are the top performing brands in 2025?",
        "session_id": "test-session-123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/ai/chat", json=chat_data, headers=headers, timeout=20)
        
        if response.status_code == 200:
            data = response.json()
            
            if "response" in data and "session_id" in data:
                response_text = data.get("response", "")
                if len(response_text) > 10:  # Basic check for meaningful response
                    log_test("AI Chat API", True, f"AI responded with {len(response_text)} characters")
                else:
                    log_test("AI Chat API", False, "AI response too short or empty", data)
            else:
                log_test("AI Chat API", False, "Missing response or session_id in response", data)
        
        else:
            log_test("AI Chat API", False, f"HTTP {response.status_code}", response.text)
    
    except requests.exceptions.RequestException as e:
        log_test("AI Chat API", False, f"Request failed: {str(e)}")

def test_unauthorized_access():
    """Test endpoints without authentication"""
    print("\n=== Testing Unauthorized Access ===")
    
    protected_endpoints = [
        "/api/analytics/executive-overview",
        "/api/filters/options",
        "/api/data/sync"
    ]
    
    for endpoint in protected_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            
            if response.status_code == 401 or response.status_code == 403:
                log_test(f"Unauthorized access to {endpoint}", True, "Correctly rejected unauthorized request")
            else:
                log_test(f"Unauthorized access to {endpoint}", False, 
                        f"Should return 401/403 but got {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            log_test(f"Unauthorized access to {endpoint}", False, f"Request failed: {str(e)}")

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("ThriveBrands BIZ Pulse Portal - Backend API Tests")
    print("=" * 60)
    print(f"Testing at: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Authentication
    token = test_login_authentication()
    
    if token:
        # Test 2: Analytics endpoints (requires authentication)
        test_analytics_endpoints(token)
        
        # Test 3: Filter endpoints (requires authentication)
        test_filter_endpoints(token)
        
        # Test 4: Data sync endpoint (requires authentication)
        test_data_sync_endpoint(token)
        
        # Test 5: AI Chat endpoint (requires authentication)
        test_ai_chat_endpoint(token)
    else:
        print("\n⚠️  Skipping authenticated endpoint tests due to login failure")
    
    # Test 6: Unauthorized access
    test_unauthorized_access()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    
    if test_results['errors']:
        print("\nFAILED TESTS:")
        for error in test_results['errors']:
            print(f"  - {error}")
    
    success_rate = (test_results['passed'] / test_results['total_tests']) * 100 if test_results['total_tests'] > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend APIs are working well!")
    elif success_rate >= 60:
        print("⚠️  Backend APIs have some issues that need attention")
    else:
        print("🚨 Backend APIs have critical issues that need immediate attention")
    
    return test_results['failed'] == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)