#!/usr/bin/env python3
"""
Start the fixed Deep Intelligence API server
This script starts the server with proper CORS configuration
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    print("🔍 Checking requirements...")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'pandas',
        'requests',
        'pydantic'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} installed")
        except ImportError:
            print(f"❌ {package} missing")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("💡 Install them with: pip install " + " ".join(missing_packages))
        return False
    
    return True

def check_env_file():
    """Check if .env file exists"""
    print("\n🔍 Checking .env file...")
    
    if os.path.exists('.env'):
        print("✅ .env file found")
        
        # Check for required variables
        with open('.env', 'r') as f:
            content = f.read()
            
        required_vars = ['PPLX_API_KEY1', 'DATA_PATH']
        missing_vars = []
        
        for var in required_vars:
            if var in content:
                print(f"✅ {var} found in .env")
            else:
                print(f"❌ {var} missing from .env")
                missing_vars.append(var)
        
        if missing_vars:
            print(f"\n⚠️  Missing required variables: {', '.join(missing_vars)}")
            print("💡 Edit your .env file and add the missing variables")
            return False
        
        return True
    else:
        print("❌ .env file not found")
        print("💡 Run: copy .env.example .env")
        print("💡 Then edit .env with your actual values")
        return False

def start_server():
    """Start the fixed FastAPI server"""
    print("\n🚀 Starting Fixed Deep Intelligence API Server...")
    print("=" * 60)
    
    # Check if the fixed file exists
    if not os.path.exists('enhanced_fastapi_fixed.py'):
        print("❌ enhanced_fastapi_fixed.py not found")
        return False
    
    try:
        print("📡 Starting server on http://localhost:8000")
        print("🔧 CORS configured for http://localhost:3000")
        print("📊 API documentation: http://localhost:8000/docs")
        print("\n💡 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Start the server
        subprocess.run([
            sys.executable, 
            'enhanced_fastapi_fixed.py'
        ])
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        return True
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Deep Intelligence API - Fixed Server Startup")
    print("=" * 60)
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements check failed")
        return
    
    # Check .env file
    if not check_env_file():
        print("\n❌ Environment check failed")
        return
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
