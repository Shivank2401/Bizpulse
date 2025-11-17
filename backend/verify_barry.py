"""
Verify Barry user details
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'bizpulse')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def verify_barry():
    # Try different email variations
    emails_to_try = [
        'Barry@thrivebrands.ai',
        'barry@thrivebrands.ai',
        'BARRY@thrivebrands.ai',
    ]
    
    print("Checking for Barry user with different email cases:\n")
    
    for email in emails_to_try:
        user = await db.users.find_one({"email": email})
        if user:
            print(f"✅ Found with: {email}")
            print(f"   Stored email: {user.get('email')}")
            print(f"   Name: {user.get('name')}")
            print(f"   Department: {user.get('department')}")
            print(f"   Role: {user.get('role')}")
            print(f"   Status: {user.get('status')}")
            print(f"   Has password_hash: {bool(user.get('password_hash'))}")
            break
    else:
        print("❌ User not found with any case variation")
        print("\nAll users in database:")
        all_users = await db.users.find({}, {"email": 1, "name": 1}).to_list(100)
        for u in all_users:
            print(f"  - {u.get('email')} ({u.get('name')})")

if __name__ == "__main__":
    asyncio.run(verify_barry())

