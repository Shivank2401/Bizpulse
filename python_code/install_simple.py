#!/usr/bin/env python3
"""
Simple installation script that bypasses pandas/numpy issues
"""

import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_command(cmd):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ Success: {cmd}")
            return True
        else:
            logger.error(f"❌ Failed: {cmd}")
            logger.error(f"Error: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"❌ Exception: {cmd} - {e}")
        return False

def main():
    logger.info("🚀 Simple installation for Deep Intelligence")
    
    # Install packages one by one with proper syntax
    packages = [
        "fastapi",
        "uvicorn[standard]", 
        "requests",
        "pydantic",
        "python-multipart"
    ]
    
    logger.info("Installing core packages...")
    for package in packages:
        cmd = f'pip install "{package}"'
        run_command(cmd)
    
    # Try to install numpy first (simpler)
    logger.info("Trying to install numpy...")
    if run_command('pip install numpy'):
        logger.info("✅ Numpy installed successfully")
        
        # Try pandas after numpy
        logger.info("Trying to install pandas...")
        if run_command('pip install pandas'):
            logger.info("✅ Pandas installed successfully")
            logger.info("🎉 Full installation complete! Run: python enhanced_fastapi.py")
        else:
            logger.warning("⚠️  Pandas failed, but minimal server is available")
            logger.info("🚀 Run: python minimal_fastapi.py")
    else:
        logger.warning("⚠️  Numpy failed, using minimal server")
        logger.info("🚀 Run: python minimal_fastapi.py")

if __name__ == "__main__":
    main()

