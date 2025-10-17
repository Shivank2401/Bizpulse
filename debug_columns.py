#!/usr/bin/env python3
"""
Debug script to check available columns in the business data
"""

import pandas as pd
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def check_columns():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get sample data
    data = await db.business_data.find({}, {"_id": 0}).limit(5).to_list(5)
    
    if data:
        df = pd.DataFrame(data)
        print("Available columns:")
        for col in sorted(df.columns):
            print(f"  - {col}")
        
        print(f"\nSample record:")
        print(df.iloc[0].to_dict())
        
        # Check for Board_Category specifically
        if 'Board_Category' in df.columns:
            unique_board_cats = df['Board_Category'].dropna().unique()
            print(f"\nBoard_Category unique values: {unique_board_cats}")
        else:
            print("\n❌ Board_Category column not found!")
    else:
        print("No data found in database")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_columns())