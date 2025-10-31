#!/usr/bin/env python3
"""
Debug Test File for Deep Intelligence API
This file helps you test your setup without wasting Perplexity API credits
"""

import os
import sys
import json
import requests
from datetime import datetime

def test_environment_variables():
    """Test if environment variables are properly loaded"""
    print("🔍 Testing Environment Variables...")
    print("=" * 50)
    
    # Check if .env file exists
    if os.path.exists('.env'):
        print("✅ .env file found")
        
        # Read .env file
        with open('.env', 'r') as f:
            env_content = f.read()
            print("📄 .env file content:")
            print(env_content[:200] + "..." if len(env_content) > 200 else env_content)
    else:
        print("❌ .env file not found")
        print("💡 Run: copy .env.example .env")
        return False
    
    # Check for required variables
    required_vars = ['PPLX_API_KEY1', 'DATA_PATH']
    missing_vars = []
    
    for var in required_vars:
        if var in env_content:
            print(f"✅ {var} found in .env file")
        else:
            print(f"❌ {var} missing from .env file")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n⚠️  Missing required variables: {', '.join(missing_vars)}")
        return False
    
    print("\n✅ Environment variables test passed!")
    return True

def test_data_file():
    """Test if data file exists and is accessible"""
    print("\n🔍 Testing Data File...")
    print("=" * 50)
    
    # Try to read DATA_PATH from environment
    data_path = os.getenv('DATA_PATH')
    if not data_path:
        print("❌ DATA_PATH not found in environment")
        return False
    
    print(f"📁 Data path: {data_path}")
    
    # Check if file exists
    if os.path.exists(data_path):
        print("✅ Data file exists")
        
        # Check file size
        file_size = os.path.getsize(data_path)
        print(f"📊 File size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)")
        
        # Try to read the file
        try:
            import pandas as pd
            df = pd.read_excel(data_path)
            print(f"✅ File readable - {len(df)} rows, {len(df.columns)} columns")
            print(f"📋 Columns: {list(df.columns)[:5]}...")  # Show first 5 columns
            return True
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return False
    else:
        print("❌ Data file not found")
        print("💡 Check the DATA_PATH in your .env file")
        return False

def test_fastapi_server():
    """Test if FastAPI server is running and responding"""
    print("\n🔍 Testing FastAPI Server...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint responding")
            print(f"📊 Response: {response.json()}")
        else:
            print(f"❌ Health endpoint error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to FastAPI server")
        print("💡 Make sure the server is running: python enhanced_fastapi.py")
        return False
    except Exception as e:
        print(f"❌ Error testing health endpoint: {e}")
        return False
    
    # Test CORS preflight
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{base_url}/chat", headers=headers, timeout=5)
        if response.status_code == 200:
            print("✅ CORS preflight working")
        else:
            print(f"⚠️  CORS preflight issue: {response.status_code}")
            print(f"📊 Response headers: {dict(response.headers)}")
    except Exception as e:
        print(f"⚠️  CORS preflight error: {e}")
    
    return True

def test_chat_endpoint_without_api():
    """Test chat endpoint without calling Perplexity API"""
    print("\n🔍 Testing Chat Endpoint (Without API Call)...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test with a simple query
    test_data = {
        "query": "test query",
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
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Chat endpoint responding")
            response_data = response.json()
            print(f"📊 Response keys: {list(response_data.keys())}")
            return True
        else:
            print(f"❌ Chat endpoint error: {response.status_code}")
            print(f"📊 Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing chat endpoint: {e}")
        return False

def test_filter_options():
    """Test filter options endpoint"""
    print("\n🔍 Testing Filter Options Endpoint...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    try:
        response = requests.get(f"{base_url}/filter-options", timeout=5)
        if response.status_code == 200:
            print("✅ Filter options endpoint responding")
            data = response.json()
            print(f"📊 Available filters:")
            for key, value in data.items():
                if isinstance(value, list):
                    print(f"   {key}: {len(value)} options")
                else:
                    print(f"   {key}: {value}")
            return True
        else:
            print(f"❌ Filter options error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing filter options: {e}")
        return False

def test_data_summary():
    """Test data summary endpoint"""
    print("\n🔍 Testing Data Summary Endpoint...")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    try:
        response = requests.get(f"{base_url}/data-summary", timeout=5)
        if response.status_code == 200:
            print("✅ Data summary endpoint responding")
            data = response.json()
            print(f"📊 Data summary:")
            for key, value in data.items():
                print(f"   {key}: {value}")
            return True
        else:
            print(f"❌ Data summary error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing data summary: {e}")
        return False

def test_frontend_connection():
    """Test if frontend can connect to backend"""
    print("\n🔍 Testing Frontend Connection...")
    print("=" * 50)
    
    # This simulates what your frontend does
    base_url = "http://localhost:8000"
    
    try:
        # Test the exact request your frontend makes
        headers = {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        # First, test OPTIONS request (CORS preflight)
        options_response = requests.options(f"{base_url}/chat", headers=headers, timeout=5)
        print(f"📊 OPTIONS request status: {options_response.status_code}")
        
        if options_response.status_code == 200:
            print("✅ CORS preflight successful")
        else:
            print(f"❌ CORS preflight failed: {options_response.status_code}")
            print(f"📊 Response: {options_response.text}")
            return False
        
        # Test actual POST request
        test_data = {
            "query": "What is the total gSales?",
            "conversation_history": []
        }
        
        post_response = requests.post(
            f"{base_url}/chat", 
            json=test_data, 
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 POST request status: {post_response.status_code}")
        
        if post_response.status_code == 200:
            print("✅ Frontend connection successful")
            return True
        else:
            print(f"❌ Frontend connection failed: {post_response.status_code}")
            print(f"📊 Error response: {post_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing frontend connection: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Deep Intelligence API - Debug Test Suite")
    print("=" * 60)
    print("This test suite helps you debug without wasting API credits")
    print("=" * 60)
    
    tests = [
        ("Environment Variables", test_environment_variables),
        ("Data File", test_data_file),
        ("FastAPI Server", test_fastapi_server),
        ("Chat Endpoint", test_chat_endpoint_without_api),
        ("Filter Options", test_filter_options),
        ("Data Summary", test_data_summary),
        ("Frontend Connection", test_frontend_connection)
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
        print("🎉 All tests passed! Your setup should be working.")
        print("💡 If you're still having issues in the frontend, check:")
        print("   - Browser console for errors")
        print("   - Network tab for failed requests")
        print("   - CORS settings in your FastAPI app")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        print("💡 Common fixes:")
        print("   - Make sure .env file exists and has correct values")
        print("   - Ensure FastAPI server is running")
        print("   - Check file paths in .env file")
        print("   - Verify CORS settings")

if __name__ == "__main__":
    main()
