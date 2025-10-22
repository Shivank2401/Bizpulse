"""
Dummy Data Generator for ThriveBrands BIZ Pulse Portal
Generates realistic business intelligence data for demonstration
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import random
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client['thrivebrands_bi']

# Business data configuration
YEARS = [2023, 2024, 2025]
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
BUSINESSES = [
    'Brillo & KMPL',
    'Brillo, Goddards & KMPL',
    'Call Call',
    'Food',
    'Green Aware',
    'Household',
    'Household & Beauty',
    'Kinetica'
]
CHANNELS = [
    'Convenience',
    'Discounter',
    'Grocery',
    'Health & Fitness',
    'Independent',
    'Online',
    'Pharmacy',
    'Retail',
    'Specialist Sport',
    'Wholesale'
]
CUSTOMERS = [
    'BWG', 'Centra', 'Circle K', 'Costcutter', 'Dunnes', 'Gala', 'Lidl', 'Londis',
    'Mace', 'Maxol', 'Musgrave', 'Spar', 'SuperValu', 'Tesco', 'Amazon', 'Boots',
    'DeCare Dental', 'Holland & Barrett', 'Life Style Sports', 'Shaws',
    'Sports Direct', 'Elverys', 'GetTheLabel', 'GNC', 'MyProtein',
    'Applegreen', 'Carry Out', 'Daybreak', 'Fresh', 'Topaz',
    'Aldi', 'AldiNI', 'BarryGroup', 'CoOp', 'Dealz', 'EuroSpar',
    'Henderson', 'Iceland', 'Joyce', 'Marks & Spencer', 'McCabes',
    'McCauleys', 'Morrisons', 'Nisa', 'Poundland', 'Sainsburys',
    'Sam McAuley', 'Tesco NI', 'Well Pharmacy', 'WH Smith', 'Waitrose'
]
BRANDS = [
    'Brillo', 'Goddards', 'KMPL', 'Call Call', 'Kinetica', 'GreenAware',
    'Household Private Label', 'Beauty Private Label', 'Food Private Label',
    'Own Brand Household', 'Own Brand Beauty', 'Premium Household',
    'Economy Range', 'Deluxe Line', 'Essential Range', 'Pro Series',
    'Active Range', 'Performance Plus', 'Elite Collection', 'Standard Line',
    'Value Range', 'Premium Selection', 'Professional Range', 'Classic Series',
    'Modern Collection', 'Traditional Range', 'Innovation Line', 'Signature Series',
    'Heritage Collection', 'Contemporary Range', 'Exclusive Line', 'Limited Edition',
    'Specialty Range', 'Artisan Collection', 'Gourmet Series', 'Everyday Essentials',
    'Superior Quality'
]
CATEGORIES = [
    'Household', 'Beauty', 'Food', 'Cleaning', 'Personal Care', 'Health & Wellness',
    'Sports Nutrition', 'Supplements', 'Protein Products', 'Energy Products',
    'Recovery Products', 'Pre-Workout', 'Post-Workout', 'Vitamins & Minerals',
    'Skincare', 'Haircare', 'Body Care', 'Oral Care', 'Laundry', 'Kitchen Care',
    'Bathroom Care', 'Floor Care', 'Surface Care', 'Dish Care', 'Air Care',
    'Fabric Care', 'Home Fragrance', 'Cleaning Tools', 'Disposables', 'Storage',
    'Organization', 'Paper Products', 'Plastic Products', 'Food Storage',
    'Kitchen Essentials', 'Bathroom Essentials', 'Bedroom Essentials', 'Living Room',
    'Outdoor', 'Seasonal', 'Pet Care', 'Baby Care', 'Kids Products', 'Adult Products',
    'Senior Products', 'Eco-Friendly', 'Organic', 'Natural', 'Premium', 'Budget',
    'Luxury'
]
SUB_CATEGORIES = [
    'Cotton Pad', 'Face Cream', 'Hand Soap', 'Body Lotion', 'Shampoo', 'Conditioner',
    'Protein Powder', 'Protein Bar', 'Energy Drink', 'Recovery Shake', 'Pre-Workout Mix',
    'BCAA', 'Creatine', 'Glutamine', 'Multivitamin', 'Vitamin C', 'Vitamin D',
    'Omega-3', 'Probiotics', 'Fiber Supplement', 'All-Purpose Cleaner', 'Glass Cleaner',
    'Bathroom Cleaner', 'Kitchen Cleaner', 'Floor Cleaner', 'Disinfectant', 'Bleach',
    'Detergent', 'Fabric Softener', 'Stain Remover', 'Dish Soap', 'Dishwasher Tablets',
    'Sponges', 'Cleaning Cloths', 'Mops', 'Brooms', 'Vacuum Bags', 'Air Freshener',
    'Candles', 'Diffusers', 'Room Spray', 'Garbage Bags', 'Storage Containers',
    'Food Wrap', 'Aluminum Foil', 'Parchment Paper', 'Napkins', 'Paper Towels',
    'Toilet Paper', 'Tissues', 'Cotton Swabs', 'Cotton Balls', 'Makeup Remover',
    'Facial Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Eye Cream', 'Face Mask',
    'Exfoliator', 'Sunscreen', 'Body Wash', 'Bar Soap', 'Hand Cream', 'Foot Cream',
    'Lip Balm', 'Deodorant', 'Antiperspirant', 'Toothpaste', 'Toothbrush', 'Mouthwash',
    'Dental Floss', 'Whitening Strips', 'Denture Care', 'Shaving Cream', 'Razor',
    'Aftershave', 'Hair Gel', 'Hair Spray', 'Hair Oil', 'Hair Mask', 'Hair Dye',
    'Nail Polish', 'Nail Polish Remover', 'Nail File', 'Cuticle Care', 'Hand Sanitizer',
    'First Aid', 'Pain Relief', 'Cold & Flu', 'Allergy Relief', 'Digestive Health',
    'Sleep Aid', 'Stress Relief', 'Energy Boost', 'Immune Support', 'Joint Support',
    'Heart Health', 'Brain Health', 'Eye Health', 'Bone Health', 'Skin Health',
    'Hair Health', 'Nail Health', 'Weight Management', 'Muscle Building', 'Fat Loss',
    'Endurance', 'Strength', 'Flexibility', 'Balance', 'Coordination', 'Agility',
    'Speed', 'Power', 'Recovery', 'Hydration', 'Nutrition', 'Meal Replacement',
    'Snack Bar', 'Healthy Snack', 'Organic Snack', 'Gluten-Free', 'Dairy-Free',
    'Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Low-Carb', 'High-Protein', 'Low-Fat',
    'Sugar-Free', 'Non-GMO', 'Natural', 'Organic', 'Premium', 'Luxury', 'Budget'
]

async def generate_dummy_data():
    """Generate comprehensive dummy data for the BI portal"""
    print("Starting dummy data generation...")
    
    # Clear existing data
    await db.business_data.delete_many({})
    print("Cleared existing data")
    
    records = []
    record_id = 1
    
    # Generate data for each combination
    for year in YEARS:
        for month_idx, month_name in enumerate(MONTHS, 1):
            # Limit 2025 data to first 9 months
            if year == 2025 and month_idx > 9:
                continue
                
            for business in BUSINESSES:
                for channel in CHANNELS:
                    # Not all combinations exist in reality
                    if random.random() < 0.3:  # 30% sparsity
                        continue
                    
                    # Select relevant customers for this channel
                    available_customers = random.sample(CUSTOMERS, k=random.randint(3, 8))
                    
                    for customer in available_customers:
                        # Select relevant brands for this business
                        available_brands = random.sample(BRANDS, k=random.randint(2, 5))
                        
                        for brand in available_brands:
                            # Select categories and subcategories
                            available_categories = random.sample(CATEGORIES, k=random.randint(1, 3))
                            
                            for category in available_categories:
                                available_subcategories = random.sample(SUB_CATEGORIES, k=random.randint(1, 2))
                                
                                for sub_category in available_subcategories:
                                    # Generate realistic KPIs
                                    base_units = random.randint(100, 5000)
                                    
                                    # Add growth trend across years
                                    year_multiplier = 1.0 + (year - 2023) * 0.15
                                    
                                    # Seasonal variation
                                    seasonal_multiplier = 1.0
                                    if month_idx in [11, 12, 1]:  # Holiday season
                                        seasonal_multiplier = 1.4
                                    elif month_idx in [6, 7, 8]:  # Summer
                                        seasonal_multiplier = 1.2
                                    
                                    units = int(base_units * year_multiplier * seasonal_multiplier)
                                    price_per_unit = random.uniform(15, 250)
                                    revenue = round(units * price_per_unit, 2)
                                    margin_percentage = random.uniform(0.25, 0.40)
                                    gross_profit = round(revenue * margin_percentage, 2)
                                    
                                    record = {
                                        'Year': year,
                                        'Month': month_idx,
                                        'Month_Name': month_name,
                                        'Business': business,
                                        'Channel': channel,
                                        'Customer': customer,
                                        'Brand': brand,
                                        'Category': category,
                                        'Sub_Category': sub_category,
                                        'Units': units,
                                        'Revenue': revenue,
                                        'Gross_Profit': gross_profit,
                                        'record_id': record_id
                                    }
                                    records.append(record)
                                    record_id += 1
                                    
                                    # Batch insert every 10000 records
                                    if len(records) >= 10000:
                                        await db.business_data.insert_many(records)
                                        print(f"Inserted {len(records)} records... Total: {record_id - 1}")
                                        records = []
    
    # Insert remaining records
    if records:
        await db.business_data.insert_many(records)
        print(f"Inserted final {len(records)} records")
    
    total_count = await db.business_data.count_documents({})
    print(f"\n✅ Successfully generated {total_count:,} dummy records!")
    
    # Create indexes for performance
    print("\nCreating indexes...")
    await db.business_data.create_index([('Year', 1)])
    await db.business_data.create_index([('Month', 1)])
    await db.business_data.create_index([('Business', 1)])
    await db.business_data.create_index([('Channel', 1)])
    await db.business_data.create_index([('Customer', 1)])
    await db.business_data.create_index([('Brand', 1)])
    await db.business_data.create_index([('Category', 1)])
    print("✅ Indexes created")
    
    # Print summary statistics
    print("\n📊 Data Summary:")
    pipeline = [
        {
            '$group': {
                '_id': '$Year',
                'total_revenue': {'$sum': '$Revenue'},
                'total_profit': {'$sum': '$Gross_Profit'},
                'total_units': {'$sum': '$Units'}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    async for doc in db.business_data.aggregate(pipeline):
        year = doc['_id']
        revenue = doc['total_revenue']
        profit = doc['total_profit']
        units = doc['total_units']
        print(f"  {year}: Revenue=€{revenue:,.2f}, Profit=€{profit:,.2f}, Units={units:,}")

if __name__ == "__main__":
    asyncio.run(generate_dummy_data())
