#!/usr/bin/env python3
"""
Test Deep Intelligence API without calling Perplexity API
This helps you test the data processing and API endpoints without wasting credits
"""

import os
import pandas as pd
import requests
import json
from datetime import datetime
from pathlib import Path

def test_data_processing():
    """Test data processing without API calls"""
    print("🔍 Testing Data Processing (Without API)...")
    print("=" * 50)
    
    try:
        # Load data - use environment variable or default to local file
        default_path = Path(__file__).resolve().parent / "yearly_data_1.xlsx"
        data_path = os.getenv("DATA_PATH", str(default_path))
        df = pd.read_excel(data_path)
        print(f"✅ Data loaded: {len(df)} rows, {len(df.columns)} columns")
        
        # Test basic data analysis
        print(f"📊 Data summary:")
        print(f"   - Years: {sorted(df['Year'].unique())}")
        print(f"   - Business segments: {len(df['Business'].unique())}")
        print(f"   - Channels: {len(df['Channel'].unique())}")
        print(f"   - Total gSales: €{df['gSales'].sum():,.0f}")
        print(f"   - Total fGP: €{df['fGP'].sum():,.0f}")
        
        # Test query parsing
        test_queries = [
            "What is the total gSales?",
            "Which channel had the least gSales?",
            "Show me profit trends for 2024",
            "What are the cost drivers?"
        ]
        
        print(f"\n📝 Testing query parsing:")
        for query in test_queries:
            columns, filters, is_trend, is_loser = parse_query(query)
            print(f"   Query: '{query}'")
            print(f"   Columns: {columns}")
            print(f"   Filters: {filters}")
            print(f"   Is trend: {is_trend}, Is loser: {is_loser}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Data processing error: {e}")
        return False

def parse_query(query):
    """Simple query parser (copied from your code)"""
    query = query.lower()
    filters = {}
    is_trend_query = "trend" in query or "compare" in query or "last 3 years" in query
    is_loser_query = "loser" in query or "worst" in query or "lowest" in query or "least" in query
    
    columns = []
    if "gsales" in query or "money" in query or "sales" in query:
        columns.append("gSales")
    if "fgp" in query or "profit" in query:
        columns.append("fGP")
    if "cases" in query or "inventory" in query:
        columns.append("Cases")
    if "price downs" in query or "cost drivers" in query:
        columns.append("Price Downs")
    if "perm disc" in query or "permanent discount" in query or "cost drivers" in query:
        columns.append("Perm. Disc.")
    if "group cost" in query or "cost drivers" in query:
        columns.append("Group Cost")
    if "lta" in query or "cost drivers" in query:
        columns.append("LTA")
    
    if "business" in query:
        filters["Business"] = None
    if "channel" in query:
        filters["Channel"] = None
    if "customer" in query:
        filters["Customer"] = None
    if "brand" in query:
        filters["Brand"] = None
    if "category" in query:
        filters["Category"] = None
    
    if not is_trend_query:
        for year in ["2023", "2024", "2025"]:
            if year in query:
                filters["Year"] = int(year)
    
    return columns, filters, is_trend_query, is_loser_query

def test_api_endpoints():
    """Test API endpoints without making actual API calls"""
    print("🔍 Testing API Endpoints...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("💡 Make sure to run: python enhanced_fastapi_fixed.py")
        return False
    
    # Test filter options
    try:
        response = requests.get(f"{base_url}/filter-options", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Filter options working")
            print(f"   Available years: {data['years']}")
            print(f"   Available businesses: {len(data['businesses'])}")
        else:
            print(f"❌ Filter options error: {response.status_code}")
    except Exception as e:
        print(f"❌ Filter options error: {e}")
    
    # Test data summary
    try:
        response = requests.get(f"{base_url}/data-summary", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Data summary working")
            print(f"   Total rows: {data['total_rows']}")
            print(f"   Year range: {data['year_range']}")
        else:
            print(f"❌ Data summary error: {response.status_code}")
    except Exception as e:
        print(f"❌ Data summary error: {e}")
    
    return True

def test_cors_headers():
    """Test CORS headers specifically"""
    print("\n🔍 Testing CORS Headers...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test OPTIONS request (CORS preflight)
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(f"{base_url}/chat", headers=headers, timeout=5)
        print(f"📊 OPTIONS request status: {response.status_code}")
        print(f"📊 Response headers:")
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods', 
            'Access-Control-Allow-Headers',
            'Access-Control-Allow-Credentials'
        ]
        
        for header in cors_headers:
            value = response.headers.get(header, 'NOT SET')
            print(f"   {header}: {value}")
        
        if response.status_code == 200:
            print("✅ CORS preflight working")
            return True
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
        return False

def test_chat_endpoint_mock():
    """Test chat endpoint with mock data (no API call)"""
    print("\n🔍 Testing Chat Endpoint (Mock Response)...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test with a simple query
    test_data = {
        "query": "What is the total gSales?",
        "conversation_history": []
    }
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000'
        }
        
        response = requests.post(
            f"{base_url}/chat", 
            json=test_data, 
            headers=headers, 
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Chat endpoint responding")
            response_data = response.json()
            print(f"📊 Response structure:")
            print(f"   - Has response: {'response' in response_data}")
            print(f"   - Has timestamp: {'timestamp' in response_data}")
            print(f"   - Has context: {'context' in response_data}")
            print(f"   - Has data: {'data' in response_data}")
            
            # Show a snippet of the response
            if 'response' in response_data:
                response_text = response_data['response']
                print(f"📝 Response preview: {response_text[:100]}...")
            
            return True
        else:
            print(f"❌ Chat endpoint error: {response.status_code}")
            print(f"📊 Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing chat endpoint: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Deep Intelligence API - Test Suite (No API Calls)")
    print("=" * 60)
    print("This test suite helps you debug without wasting Perplexity credits")
    print("=" * 60)
    
    tests = [
        ("Data Processing", test_data_processing),
        ("API Endpoints", test_api_endpoints),
        ("CORS Headers", test_cors_headers),
        ("Chat Endpoint (Mock)", test_chat_endpoint_mock)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n📈 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your API should be working.")
        print("💡 If frontend still doesn't work, check:")
        print("   - Browser console for JavaScript errors")
        print("   - Network tab for failed requests")
        print("   - Make sure frontend is running on http://localhost:3000")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        print("💡 Common fixes:")
        print("   - Make sure FastAPI server is running")
        print("   - Check if data file path is correct")
        print("   - Verify CORS settings")

if __name__ == "__main__":
    main()
