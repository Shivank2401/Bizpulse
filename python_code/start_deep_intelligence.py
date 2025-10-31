#!/usr/bin/env python3
"""
Deep Intelligence FastAPI Server Startup Script
This script starts the enhanced FastAPI server for the Deep Intelligence feature.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if required dependencies are installed"""
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
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"Missing required packages: {', '.join(missing_packages)}")
        logger.info("Please install them using: pip install " + " ".join(missing_packages))
        return False
    
    return True

def check_data_file():
    """Check if the data file exists"""
    # Check for data file using environment variable or default location
    default_path = Path(__file__).resolve().parent / "yearly_data_1.xlsx"
    data_path = os.getenv("DATA_PATH", str(default_path))
    
    if not os.path.exists(data_path):
        logger.warning(f"Data file not found at: {data_path}")
        logger.info("Please set the DATA_PATH environment variable or place yearly_data_1.xlsx in the python_code directory")
        return False
    
    return True

def start_server():
    """Start the FastAPI server"""
    try:
        logger.info("Starting Deep Intelligence FastAPI server...")
        
        # Check dependencies
        if not check_dependencies():
            sys.exit(1)
        
        # Check data file
        if not check_data_file():
            logger.warning("Data file not found, but continuing with server startup...")
        
        # Start the server
        os.system("python enhanced_fastapi.py")
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()

