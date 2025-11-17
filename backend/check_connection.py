"""
Check which database we're connecting to and verify users
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv, find_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
_dotenv_path = find_dotenv(str(ROOT_DIR / '.env')) or find_dotenv()
if _dotenv_path:
    load_dotenv(_dotenv_path)
    print(f"Loaded .env from: {_dotenv_path}")
else:
    print("No .env file found")

# MongoDB connection
mongo_url = os.getenv('MONGO_URL')
db_name = os.getenv('DB_NAME')

print(f"\n🔍 Connection Details:")
print(f"   MONGO_URL: {mongo_url}")
print(f"   DB_NAME: {db_name}")

if not mongo_url or not db_name:
    print("\n❌ Missing MONGO_URL or DB_NAME in environment variables")
    print("   Please check your .env file in the backend directory")
    exit(1)

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def check_database():
    print(f"\n📊 Database: {db_name}")
    
    # List all databases
    db_list = await client.list_database_names()
    print(f"\n📁 Available databases: {db_list}")
    
    # Check if our database exists
    if db_name in db_list:
        print(f"✅ Database '{db_name}' exists")
    else:
        print(f"❌ Database '{db_name}' does NOT exist")
        return
    
    # List collections
    collections = await db.list_collection_names()
    print(f"\n📚 Collections in '{db_name}': {collections}")
    
    # Check users collection
    if 'users' in collections:
        user_count = await db.users.count_documents({})
        print(f"\n👥 Users collection: {user_count} documents")
        
        # Show all users
        users = await db.users.find({}, {"email": 1, "name": 1, "department": 1, "status": 1}).to_list(100)
        print(f"\n📋 All users in database:")
        for user in users:
            print(f"   - {user.get('email')} ({user.get('name')}) - {user.get('department')} - {user.get('status')}")
        
        # Check for Barry specifically
        barry = await db.users.find_one({"email": {"$regex": "barry", "$options": "i"}})
        if barry:
            print(f"\n✅ Barry user found: {barry.get('email')}")
        else:
            print(f"\n❌ Barry user NOT found")
    else:
        print(f"\n❌ 'users' collection does NOT exist")

if __name__ == "__main__":
    asyncio.run(check_database())

