#!/usr/bin/env python3
"""
Quick setup script for Deep Intelligence API
This script helps you set up the environment variables quickly
"""

import os
import sys
import shutil

def main():
    print(" Deep Intelligence API - Quick Setup")
    print("=" * 50)
    
    # Check if .env already exists
    if os.path.exists('.env'):
        print("  .env file already exists!")
        response = input("Do you want to overwrite it? (y/N): ").lower()
        if response != 'y':
            print("Setup cancelled.")
            return
    
    # Copy .env.example to .env
    if os.path.exists('.env.example'):
        shutil.copy('.env.example', '.env')
        print(" Created .env file from .env.example")
    else:
        print(" .env.example file not found!")
        return
    
    print("\n Next steps:")
    print("1. Edit the .env file with your actual values:")
    print("   - PPLX_API_KEY1: Your Perplexity API key")
    print("   - DATA_PATH: Path to your Excel file")
    print("   - LOGO_PATH: Path to your logo file (optional)")
    print("\n2. Get your Perplexity API key from:")
    print("   https://www.perplexity.ai/settings/api")
    print("\n3. Run the application:")
    print("   python enhanced_fastapi.py")
    print("\n Setup complete! Happy coding!")

if __name__ == "__main__":
    main()
