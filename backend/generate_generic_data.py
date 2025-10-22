"""
Generic Business Intelligence Data Generator
Creates standard business data that works for any company
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
db = client['thrive_biz_pulse']  # Use the correct database name

# Generic Business Configuration
YEARS = [2023, 2024, 2025]
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
          'July', 'August', 'September', 'October', 'November', 'December']
MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# Generic Business Units
BUSINESSES = [
    'Enterprise Solutions',
    'Cloud Services',
    'Consumer Products',
    'Digital Marketing',
    'Professional Services',
    'Technology Hardware',
    'Software Development',
    'Data Analytics'
]

# Sales Channels
CHANNELS = [
    'Direct Sales',
    'E-commerce',
    'Retail Partners',
    'Distributors',
    'Wholesale',
    'Online Marketplace',
    'Enterprise Accounts',
    'Channel Partners',
    'Resellers',
    'Strategic Alliances'
]

# Customer Segments
CUSTOMERS = [
    'Enterprise Corp A', 'Enterprise Corp B', 'Enterprise Corp C',
    'Mid-Market Company 1', 'Mid-Market Company 2', 'Mid-Market Company 3',
    'SMB Partner A', 'SMB Partner B', 'SMB Partner C',
    'Tech Startup 1', 'Tech Startup 2', 'Tech Startup 3',
    'Retail Chain A', 'Retail Chain B', 'Retail Chain C',
    'Healthcare Provider 1', 'Healthcare Provider 2',
    'Financial Services A', 'Financial Services B',
    'Manufacturing Co 1', 'Manufacturing Co 2',
    'Educational Institution A', 'Educational Institution B',
    'Government Agency 1', 'Government Agency 2',
    'Telecom Provider A', 'Telecom Provider B',
    'Media Company A', 'Media Company B',
    'Energy Company A', 'Energy Company B',
    'Transportation Co A', 'Transportation Co B',
    'Hospitality Group A', 'Hospitality Group B',
    'Real Estate Firm A', 'Real Estate Firm B',
    'Insurance Provider A', 'Insurance Provider B',
    'Pharmaceutical Co A', 'Pharmaceutical Co B',
    'Automotive Company A', 'Automotive Company B',
    'Aerospace Firm A', 'Aerospace Firm B',
    'Construction Co A', 'Construction Co B',
    'Agriculture Business A', 'Agriculture Business B',
    'Consulting Firm A', 'Consulting Firm B',
    'Legal Services A', 'Legal Services B',
    'Marketing Agency A', 'Marketing Agency B'
]

# Product Brands
BRANDS = [
    'Premium Suite', 'Professional Edition', 'Enterprise Plus',
    'Business Essentials', 'Starter Pack', 'Advanced Tools',
    'Cloud Connect', 'Data Insights Pro', 'Analytics Dashboard',
    'Workflow Manager', 'Security Shield', 'Performance Optimizer',
    'Integration Hub', 'Mobile Solutions', 'API Gateway',
    'Smart Platform', 'Digital Workspace', 'Collaboration Suite',
    'Customer Success', 'Revenue Accelerator', 'Growth Engine',
    'Innovation Labs', 'Future Tech', 'Next Generation',
    'Core Services', 'Extended Features', 'Premium Support',
    'Elite Package', 'Standard Offering', 'Basic Bundle'
]

# Product Categories
CATEGORIES = [
    'Software Licenses', 'Cloud Infrastructure', 'Data Analytics',
    'Security Solutions', 'Productivity Tools', 'Collaboration Software',
    'Customer Relationship Management', 'Enterprise Resource Planning',
    'Human Capital Management', 'Financial Management',
    'Supply Chain Management', 'Marketing Automation',
    'Sales Enablement', 'Customer Support', 'IT Management',
    'Business Intelligence', 'AI & Machine Learning', 'IoT Solutions',
    'Mobile Applications', 'Web Services', 'API Services',
    'Professional Services', 'Training & Education', 'Consulting',
    'Implementation Services', 'Managed Services', 'Support & Maintenance',
    'Hardware Equipment', 'Network Infrastructure', 'Storage Solutions',
    'Backup & Recovery', 'Disaster Recovery', 'Cloud Migration',
    'DevOps Tools', 'Testing & Quality Assurance', 'Monitoring Solutions'
]

# Sub-Categories
SUB_CATEGORIES = [
    'Annual License', 'Monthly Subscription', 'Perpetual License',
    'User-Based Pricing', 'Usage-Based Pricing', 'Tiered Pricing',
    'Basic Plan', 'Professional Plan', 'Enterprise Plan',
    'Starter Edition', 'Growth Edition', 'Scale Edition',
    'Single User', 'Team (5-10)', 'Department (11-50)',
    'Organization (51-200)', 'Enterprise (201+)', 'Unlimited',
    'On-Premise', 'Cloud-Hosted', 'Hybrid',
    'SaaS', 'PaaS', 'IaaS',
    'Consulting Hours', 'Project-Based', 'Retainer',
    'Training Session', 'Workshop', 'Certification',
    'Basic Support', 'Premium Support', 'Enterprise Support',
    '24/7 Support', 'Business Hours', 'Email Support',
    'Phone Support', 'Chat Support', 'Dedicated Account Manager'
]

# Geographic Regions
REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa']

# Industries
INDUSTRIES = [
    'Technology', 'Healthcare', 'Financial Services', 'Manufacturing',
    'Retail', 'Education', 'Government', 'Telecommunications',
    'Media & Entertainment', 'Energy', 'Transportation', 'Hospitality',
    'Real Estate', 'Insurance', 'Pharmaceutical', 'Automotive'
]

async def generate_business_data():
    """Generate comprehensive generic business data"""
    print("🚀 Starting generic business data generation...")
    
    # Clear existing data
    await db.business_data.delete_many({})
    print("✅ Cleared existing data")
    
    records = []
    record_id = 1
    
    # Generate data for each combination
    for year in YEARS:
        for month_idx, (month_name, month_abbr) in enumerate(zip(MONTHS, MONTH_ABBR), 1):
            # Limit 2025 data to first 9 months
            if year == 2025 and month_idx > 9:
                continue
                
            for business in BUSINESSES:
                for channel in CHANNELS:
                    # Not all combinations exist (30% sparsity for realism)
                    if random.random() < 0.35:
                        continue
                    
                    # Select relevant customers for this channel
                    num_customers = random.randint(5, 12)
                    available_customers = random.sample(CUSTOMERS, k=min(num_customers, len(CUSTOMERS)))
                    
                    for customer in available_customers:
                        # Select relevant brands
                        num_brands = random.randint(2, 6)
                        available_brands = random.sample(BRANDS, k=min(num_brands, len(BRANDS)))
                        
                        for brand in available_brands:
                            # Select categories
                            num_categories = random.randint(1, 4)
                            available_categories = random.sample(CATEGORIES, k=min(num_categories, len(CATEGORIES)))
                            
                            for category in available_categories:
                                # Select subcategories
                                num_subcategories = random.randint(1, 3)
                                available_subcategories = random.sample(SUB_CATEGORIES, k=min(num_subcategories, len(SUB_CATEGORIES)))
                                
                                for sub_category in available_subcategories:
                                    # Select region and industry
                                    region = random.choice(REGIONS)
                                    industry = random.choice(INDUSTRIES)
                                    
                                    # Generate realistic business metrics
                                    base_units = random.randint(50, 2000)
                                    
                                    # Add growth trend across years (8-15% YoY)
                                    year_multiplier = 1.0 + (year - 2023) * random.uniform(0.08, 0.15)
                                    
                                    # Seasonal variation
                                    seasonal_multiplier = 1.0
                                    if month_idx in [11, 12, 1]:  # Holiday/Year-end
                                        seasonal_multiplier = random.uniform(1.3, 1.6)
                                    elif month_idx in [6, 7, 8]:  # Mid-year
                                        seasonal_multiplier = random.uniform(1.1, 1.3)
                                    elif month_idx in [3, 4]:  # Q1 end
                                        seasonal_multiplier = random.uniform(1.2, 1.4)
                                    
                                    units = int(base_units * year_multiplier * seasonal_multiplier)
                                    
                                    # Price varies by category and brand
                                    if 'Premium' in brand or 'Enterprise' in brand:
                                        price_per_unit = random.uniform(500, 5000)
                                    elif 'Professional' in brand:
                                        price_per_unit = random.uniform(200, 1500)
                                    else:
                                        price_per_unit = random.uniform(50, 500)
                                    
                                    revenue = round(units * price_per_unit, 2)
                                    
                                    # Margin varies by business type
                                    if business in ['Software Development', 'Cloud Services', 'Digital Marketing']:
                                        margin_percentage = random.uniform(0.60, 0.85)  # High margin
                                    elif business in ['Professional Services', 'Data Analytics']:
                                        margin_percentage = random.uniform(0.40, 0.60)  # Medium margin
                                    else:
                                        margin_percentage = random.uniform(0.25, 0.45)  # Standard margin
                                    
                                    gross_profit = round(revenue * margin_percentage, 2)
                                    
                                    # Calculate additional metrics
                                    cost_of_goods = round(revenue - gross_profit, 2)
                                    avg_deal_size = round(revenue / units, 2) if units > 0 else 0
                                    
                                    record = {
                                        'Year': year,
                                        'Month': month_idx,
                                        'Month_Name': month_name,
                                        'Month_Abbr': month_abbr,
                                        'Quarter': f'Q{(month_idx-1)//3 + 1}',
                                        'Business': business,
                                        'Channel': channel,
                                        'Customer': customer,
                                        'Brand': brand,
                                        'Category': category,
                                        'Sub_Category': sub_category,
                                        'Region': region,
                                        'Industry': industry,
                                        'Units': units,
                                        'Revenue': revenue,
                                        'Gross_Profit': gross_profit,
                                        'Cost_of_Goods': cost_of_goods,
                                        'Margin_Percentage': round(margin_percentage * 100, 2),
                                        'Avg_Deal_Size': avg_deal_size,
                                        'record_id': record_id
                                    }
                                    records.append(record)
                                    record_id += 1
                                    
                                    # Batch insert every 10000 records
                                    if len(records) >= 10000:
                                        await db.business_data.insert_many(records)
                                        print(f"📦 Inserted {len(records)} records... Total: {record_id - 1}")
                                        records = []
    
    # Insert remaining records
    if records:
        await db.business_data.insert_many(records)
        print(f"📦 Inserted final {len(records)} records")
    
    total_count = await db.business_data.count_documents({})
    print(f"\n✅ Successfully generated {total_count:,} generic business records!")
    
    # Create indexes for performance
    print("\n🔧 Creating indexes...")
    await db.business_data.create_index([('Year', 1)])
    await db.business_data.create_index([('Month', 1)])
    await db.business_data.create_index([('Business', 1)])
    await db.business_data.create_index([('Channel', 1)])
    await db.business_data.create_index([('Customer', 1)])
    await db.business_data.create_index([('Brand', 1)])
    await db.business_data.create_index([('Category', 1)])
    await db.business_data.create_index([('Region', 1)])
    await db.business_data.create_index([('Industry', 1)])
    print("✅ Indexes created")
    
    # Print summary statistics
    print("\n📊 Data Summary by Year:")
    pipeline = [
        {
            '$group': {
                '_id': '$Year',
                'total_revenue': {'$sum': '$Revenue'},
                'total_profit': {'$sum': '$Gross_Profit'},
                'total_units': {'$sum': '$Units'},
                'avg_margin': {'$avg': '$Margin_Percentage'}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    async for doc in db.business_data.aggregate(pipeline):
        year = doc['_id']
        revenue = doc['total_revenue']
        profit = doc['total_profit']
        units = doc['total_units']
        margin = doc['avg_margin']
        print(f"  {year}: Revenue=${revenue:,.0f}, Profit=${profit:,.0f}, Units={units:,}, Avg Margin={margin:.1f}%")
    
    print("\n📈 Top 5 Business Units by Revenue:")
    pipeline_business = [
        {
            '$group': {
                '_id': '$Business',
                'total_revenue': {'$sum': '$Revenue'}
            }
        },
        {'$sort': {'total_revenue': -1}},
        {'$limit': 5}
    ]
    
    async for doc in db.business_data.aggregate(pipeline_business):
        print(f"  {doc['_id']}: ${doc['total_revenue']:,.0f}")
    
    print("\n🎯 Top 5 Channels by Revenue:")
    pipeline_channel = [
        {
            '$group': {
                '_id': '$Channel',
                'total_revenue': {'$sum': '$Revenue'}
            }
        },
        {'$sort': {'total_revenue': -1}},
        {'$limit': 5}
    ]
    
    async for doc in db.business_data.aggregate(pipeline_channel):
        print(f"  {doc['_id']}: ${doc['total_revenue']:,.0f}")

if __name__ == "__main__":
    asyncio.run(generate_business_data())
