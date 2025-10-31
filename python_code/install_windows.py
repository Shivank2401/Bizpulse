#!/usr/bin/env python3
"""
Windows-specific installation script for Deep Intelligence dependencies
This script handles Windows-specific installation issues and provides alternatives.
"""

import os
import sys
import subprocess
import platform
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    logger.info(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor >= 13:
        logger.warning("Python 3.13+ detected. Some packages may have compatibility issues.")
        logger.info("Consider using Python 3.11 or 3.12 for better compatibility.")
    
    return version

def install_package(package):
    """Install a single package with error handling"""
    try:
        logger.info(f"Installing {package}...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", package], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ {package} installed successfully")
            return True
        else:
            logger.error(f"❌ Failed to install {package}: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"❌ Error installing {package}: {e}")
        return False

def install_core_packages():
    """Install core packages one by one"""
    core_packages = [
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0", 
        "requests>=2.31.0",
        "pydantic>=2.5.0",
        "python-multipart>=0.0.6"
    ]
    
    logger.info("Installing core packages...")
    failed_packages = []
    
    for package in core_packages:
        if not install_package(package):
            failed_packages.append(package)
    
    return failed_packages

def install_pandas_alternative():
    """Try alternative methods to install pandas"""
    logger.info("Attempting to install pandas with alternatives...")
    
    # Try installing from conda-forge if available
    try:
        result = subprocess.run(["conda", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info("Conda found. Trying conda install...")
            result = subprocess.run(["conda", "install", "-c", "conda-forge", "pandas", "-y"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                logger.info("✅ Pandas installed via conda")
                return True
    except:
        pass
    
    # Try installing without dependencies
    alternatives = [
        "pandas --no-deps",
        "pandas>=2.0.0 --only-binary=all",
        "pandas>=1.5.0 --only-binary=all"
    ]
    
    for alt in alternatives:
        logger.info(f"Trying: pip install {alt}")
        if install_package(alt):
            return True
    
    return False

def install_numpy_alternative():
    """Try alternative methods to install numpy"""
    logger.info("Attempting to install numpy with alternatives...")
    
    alternatives = [
        "numpy>=1.24.0 --only-binary=all",
        "numpy>=1.21.0 --only-binary=all",
        "numpy --prefer-binary"
    ]
    
    for alt in alternatives:
        logger.info(f"Trying: pip install {alt}")
        if install_package(alt):
            return True
    
    return False

def create_minimal_server():
    """Create a minimal server that works without pandas"""
    minimal_server_code = '''
import requests
import json
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

# Setup logging
logging.basicConfig(filename="deep_intelligence_errors.log", level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load API key from environment - REQUIRED, no fallback for security
import os
PPLX_API_KEY1 = os.getenv("PPLX_API_KEY1")
if not PPLX_API_KEY1:
    raise ValueError("PPLX_API_KEY1 environment variable is required")

# Initialize FastAPI app
app = FastAPI(title="Deep Intelligence API - Minimal Version", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    conversation_history: Optional[List[ChatMessage]] = []
    filters: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    response: str
    timestamp: str
    context: str
    charts: Optional[List[Dict[str, Any]]] = []
    data: Optional[Dict[str, Any]] = {}

def query_perplexity(prompt, conversation_history=None):
    """Query Perplexity API"""
    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {PPLX_API_KEY1}", "Content-Type": "application/json"}
    messages = [{
        "role": "system",
        "content": (
            "You are Vector AI, a friendly financial data analyst for BVG. "
            "Provide intelligent business insights and recommendations. "
            "All monetary values are in Euros (€). Be conversational and engaging."
        )
    }]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": prompt})
    payload = {"model": "sonar-pro", "messages": messages, "max_tokens": 1000}
    
    try:
        logger.info("Sending request to Perplexity API")
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        logger.info("Received response from Perplexity API")
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"I apologize, but I'm experiencing technical difficulties. Please try again later."

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "minimal"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request.query}")
        
        # Simple prompt without data processing
        prompt = f"Please analyze and provide insights for this business question: {request.query}"
        
        response = query_perplexity(prompt, request.conversation_history)
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now().strftime("%I:%M %p IST on %B %d, %Y"),
            context="Minimal version - data processing not available",
            data={"note": "This is a minimal version without data processing capabilities"}
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/filter-options")
async def get_filter_options():
    return {
        "years": ["2023", "2024", "2025"],
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "businesses": ["Brillo, Goddards & KMPL", "Cali Cali", "Food", "Green Aware", "Household & Beauty", "Kinetica"],
        "channels": ["Convenience", "Grocery", "International", "Online", "Sports & Others", "Wholesale"],
        "brands": ["Asda", "Babykind", "Bensons", "Bonne Maman", "Brillo", "BV Honey", "Koka", "McDonnells"],
        "categories": ["Pickles", "Plastic sacks", "Polish", "Pots", "Preserves", "Protein Bar", "Protein Milk", "Shopping bags", "Snacking"],
        "customers": ["Aldi ROI", "Amazon", "Australia", "Austria", "Bahrain", "Barry Group", "Belgium", "BWG", "Canada"]
    }

@app.get("/data-summary")
async def get_data_summary():
    return {
        "total_rows": "Data processing not available in minimal version",
        "year_range": "2023 - 2025",
        "business_segments": 6,
        "channels": 6,
        "customers": 50,
        "brands": 25,
        "categories": 15
    }

if __name__ == "__main__":
    logger.info("Starting Minimal Deep Intelligence FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
'''
    
    with open("minimal_fastapi.py", "w") as f:
        f.write(minimal_server_code)
    
    logger.info("✅ Created minimal_fastapi.py - a lightweight version without pandas")

def main():
    """Main installation process"""
    logger.info("🚀 Starting Windows-specific installation for Deep Intelligence")
    
    # Check Python version
    python_version = check_python_version()
    
    # Install core packages
    failed_packages = install_core_packages()
    
    # Try to install pandas
    pandas_success = install_pandas_alternative()
    numpy_success = install_numpy_alternative()
    
    if not pandas_success or not numpy_success:
        logger.warning("⚠️  Pandas/numpy installation failed. Creating minimal server...")
        create_minimal_server()
        logger.info("🎉 Minimal server created! You can run it with: python minimal_fastapi.py")
        logger.info("📝 Note: This version won't have data processing but will work for AI chat")
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("📋 INSTALLATION SUMMARY")
    logger.info("="*50)
    
    if pandas_success and numpy_success:
        logger.info("✅ Full installation successful!")
        logger.info("🚀 You can run: python enhanced_fastapi.py")
    else:
        logger.info("⚠️  Partial installation - using minimal version")
        logger.info("🚀 You can run: python minimal_fastapi.py")
        logger.info("💡 For full features, consider using Python 3.11 or 3.12")
    
    logger.info("📖 Check the README.md for detailed instructions")

if __name__ == "__main__":
    main()

