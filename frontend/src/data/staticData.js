// Static Sample Data for BeaconIQ Portal Demo
// Use this data for showcasing without database connection

export const staticData = {
  // Filter Options
  filters: {
    years: [2023, 2024, 2025],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    businesses: [
      'Enterprise Solutions',
      'Cloud Services',
      'Consumer Products',
      'Digital Marketing',
      'Professional Services',
      'Technology Hardware',
      'Software Development',
      'Data Analytics'
    ],
    channels: [
      'Direct Sales',
      'E-commerce',
      'Retail Partners',
      'Distributors',
      'Wholesale',
      'Online Marketplace',
      'Enterprise Accounts',
      'Channel Partners'
    ],
    brands: [
      'Premium Suite',
      'Professional Edition',
      'Enterprise Plus',
      'Business Essentials',
      'Starter Pack',
      'Advanced Tools',
      'Cloud Connect',
      'Data Insights Pro',
      'Analytics Dashboard',
      'Workflow Manager'
    ],
    customers: [
      'Enterprise Corp A',
      'Enterprise Corp B',
      'Mid-Market Company 1',
      'Mid-Market Company 2',
      'Tech Startup 1',
      'Retail Chain A',
      'Healthcare Provider 1',
      'Financial Services A',
      'Manufacturing Co 1',
      'Educational Institution A'
    ],
    categories: [
      'Software Licenses',
      'Cloud Infrastructure',
      'Data Analytics',
      'Security Solutions',
      'Productivity Tools',
      'Collaboration Software',
      'Customer Relationship Management',
      'Enterprise Resource Planning',
      'Human Capital Management',
      'Financial Management'
    ]
  },

  // Executive Overview / Business Compass Data
  executiveOverview: {
    total_revenue: 67145834.5,
    total_profit: 35682508.3,
    total_units: 122541250,
    
    yearly_performance: [
      { Year: 2023, Revenue: 21500000, Gross_Profit: 11200000, Units: 40000000 },
      { Year: 2024, Revenue: 24500000, Gross_Profit: 13000000, Units: 45000000 },
      { Year: 2025, Revenue: 21145834.5, Gross_Profit: 11482508.3, Units: 37541250 }
    ],
    
    business_performance: [
      { Business: 'Enterprise Solutions', Revenue: 12500000, Gross_Profit: 6800000, Units: 18000000 },
      { Business: 'Cloud Services', Revenue: 11200000, Gross_Profit: 6200000, Units: 16500000 },
      { Business: 'Consumer Products', Revenue: 9800000, Gross_Profit: 4900000, Units: 22000000 },
      { Business: 'Digital Marketing', Revenue: 8900000, Gross_Profit: 5100000, Units: 15000000 },
      { Business: 'Professional Services', Revenue: 7600000, Gross_Profit: 4200000, Units: 12500000 },
      { Business: 'Technology Hardware', Revenue: 6500000, Gross_Profit: 3100000, Units: 18500000 },
      { Business: 'Software Development', Revenue: 5845834.5, Gross_Profit: 3382508.3, Units: 11041250 },
      { Business: 'Data Analytics', Revenue: 4800000, Gross_Profit: 2000000, Units: 9000000 }
    ],
    
    monthly_trend: [
      { Month_Name: 'January', Revenue: 2100000, Gross_Profit: 1150000, Units: 3800000 },
      { Month_Name: 'February', Revenue: 2250000, Gross_Profit: 1200000, Units: 3950000 },
      { Month_Name: 'March', Revenue: 2600000, Gross_Profit: 1380000, Units: 4500000 },
      { Month_Name: 'April', Revenue: 2400000, Gross_Profit: 1280000, Units: 4200000 },
      { Month_Name: 'May', Revenue: 2550000, Gross_Profit: 1350000, Units: 4350000 },
      { Month_Name: 'June', Revenue: 2700000, Gross_Profit: 1450000, Units: 4600000 },
      { Month_Name: 'July', Revenue: 2500000, Gross_Profit: 1320000, Units: 4300000 },
      { Month_Name: 'August', Revenue: 2350000, Gross_Profit: 1250000, Units: 4100000 },
      { Month_Name: 'September', Revenue: 2695834.5, Gross_Profit: 1102508.3, Units: 5741250 }
    ],
    
    channel_performance: [
      { Channel: 'Direct Sales', Revenue: 15200000, Gross_Profit: 8100000, Units: 28000000 },
      { Channel: 'E-commerce', Revenue: 13800000, Gross_Profit: 7500000, Units: 26500000 },
      { Channel: 'Retail Partners', Revenue: 11500000, Gross_Profit: 6200000, Units: 22000000 },
      { Channel: 'Distributors', Revenue: 9200000, Gross_Profit: 4800000, Units: 17500000 },
      { Channel: 'Wholesale', Revenue: 7600000, Gross_Profit: 3900000, Units: 14000000 },
      { Channel: 'Online Marketplace', Revenue: 5400000, Gross_Profit: 2800000, Units: 8500000 },
      { Channel: 'Enterprise Accounts', Revenue: 3245834.5, Gross_Profit: 1782508.3, Units: 4541250 },
      { Channel: 'Channel Partners', Revenue: 1200000, Gross_Profit: 600000, Units: 1500000 }
    ]
  },

  // Customer Analysis Data
  customerAnalysis: {
    channel_performance: [
      { Channel: 'Direct Sales', Revenue: 15200000, Gross_Profit: 8100000, Units: 28000000 },
      { Channel: 'E-commerce', Revenue: 13800000, Gross_Profit: 7500000, Units: 26500000 },
      { Channel: 'Retail Partners', Revenue: 11500000, Gross_Profit: 6200000, Units: 22000000 },
      { Channel: 'Distributors', Revenue: 9200000, Gross_Profit: 4800000, Units: 17500000 },
      { Channel: 'Wholesale', Revenue: 7600000, Gross_Profit: 3900000, Units: 14000000 },
      { Channel: 'Online Marketplace', Revenue: 5400000, Gross_Profit: 2800000, Units: 8500000 },
      { Channel: 'Enterprise Accounts', Revenue: 3245834.5, Gross_Profit: 1782508.3, Units: 4541250 },
      { Channel: 'Channel Partners', Revenue: 1200000, Gross_Profit: 600000, Units: 1500000 }
    ],
    
    top_customers: [
      { Customer: 'Enterprise Corp A', Revenue: 8500000, Gross_Profit: 4600000, Units: 15000000 },
      { Customer: 'Enterprise Corp B', Revenue: 7200000, Gross_Profit: 3900000, Units: 13000000 },
      { Customer: 'Mid-Market Company 1', Revenue: 6100000, Gross_Profit: 3200000, Units: 11000000 },
      { Customer: 'Retail Chain A', Revenue: 5300000, Gross_Profit: 2800000, Units: 9500000 },
      { Customer: 'Tech Startup 1', Revenue: 4800000, Gross_Profit: 2600000, Units: 8700000 },
      { Customer: 'Healthcare Provider 1', Revenue: 4200000, Gross_Profit: 2200000, Units: 7600000 },
      { Customer: 'Financial Services A', Revenue: 3900000, Gross_Profit: 2000000, Units: 7000000 },
      { Customer: 'Manufacturing Co 1', Revenue: 3500000, Gross_Profit: 1800000, Units: 6300000 },
      { Customer: 'Mid-Market Company 2', Revenue: 3100000, Gross_Profit: 1600000, Units: 5500000 },
      { Customer: 'Educational Institution A', Revenue: 2800000, Gross_Profit: 1400000, Units: 5000000 }
    ]
  },

  // Brand Analysis Data
  brandAnalysis: {
    brand_performance: [
      { Brand: 'Premium Suite', Revenue: 9800000, Gross_Profit: 5400000, Units: 14000000 },
      { Brand: 'Professional Edition', Revenue: 8600000, Gross_Profit: 4700000, Units: 12500000 },
      { Brand: 'Enterprise Plus', Revenue: 7900000, Gross_Profit: 4300000, Units: 11000000 },
      { Brand: 'Business Essentials', Revenue: 6700000, Gross_Profit: 3500000, Units: 10200000 },
      { Brand: 'Cloud Connect', Revenue: 5900000, Gross_Profit: 3200000, Units: 9100000 },
      { Brand: 'Data Insights Pro', Revenue: 5200000, Gross_Profit: 2800000, Units: 8300000 },
      { Brand: 'Analytics Dashboard', Revenue: 4600000, Gross_Profit: 2500000, Units: 7500000 },
      { Brand: 'Workflow Manager', Revenue: 4100000, Gross_Profit: 2200000, Units: 6800000 },
      { Brand: 'Starter Pack', Revenue: 3700000, Gross_Profit: 1900000, Units: 6200000 },
      { Brand: 'Advanced Tools', Revenue: 3300000, Gross_Profit: 1700000, Units: 5500000 },
      { Brand: 'Security Shield', Revenue: 2900000, Gross_Profit: 1500000, Units: 4900000 },
      { Brand: 'Performance Optimizer', Revenue: 2500000, Gross_Profit: 1300000, Units: 4300000 },
      { Brand: 'Integration Hub', Revenue: 2200000, Gross_Profit: 1100000, Units: 3800000 },
      { Brand: 'Mobile Solutions', Revenue: 1900000, Gross_Profit: 1000000, Units: 3300000 },
      { Brand: 'API Gateway', Revenue: 1645834.5, Gross_Profit: 882508.3, Units: 2841250 }
    ]
  },

  // Category Analysis Data
  categoryAnalysis: {
    category_performance: [
      { Category: 'Software Licenses', Revenue: 11200000, Gross_Profit: 6100000, Units: 16500000 },
      { Category: 'Cloud Infrastructure', Revenue: 9800000, Gross_Profit: 5300000, Units: 14200000 },
      { Category: 'Data Analytics', Revenue: 8500000, Gross_Profit: 4600000, Units: 12800000 },
      { Category: 'Security Solutions', Revenue: 7300000, Gross_Profit: 3900000, Units: 11000000 },
      { Category: 'Productivity Tools', Revenue: 6400000, Gross_Profit: 3400000, Units: 9800000 },
      { Category: 'Collaboration Software', Revenue: 5600000, Gross_Profit: 3000000, Units: 8600000 },
      { Category: 'CRM', Revenue: 4900000, Gross_Profit: 2600000, Units: 7500000 },
      { Category: 'ERP', Revenue: 4200000, Gross_Profit: 2200000, Units: 6400000 },
      { Category: 'HCM', Revenue: 3700000, Gross_Profit: 1900000, Units: 5600000 },
      { Category: 'Financial Management', Revenue: 3200000, Gross_Profit: 1700000, Units: 4900000 },
      { Category: 'Supply Chain', Revenue: 2800000, Gross_Profit: 1400000, Units: 4200000 },
      { Category: 'Marketing Automation', Revenue: 2400000, Gross_Profit: 1200000, Units: 3700000 },
      { Category: 'Sales Enablement', Revenue: 2100000, Gross_Profit: 1100000, Units: 3200000 },
      { Category: 'Customer Support', Revenue: 1800000, Gross_Profit: 900000, Units: 2800000 },
      { Category: 'IT Management', Revenue: 1345834.5, Gross_Profit: 682508.3, Units: 2241250 }
    ],
    
    subcategory_performance: [
      { Sub_Category: 'Annual License', Revenue: 4500000, Gross_Profit: 2400000, Units: 6800000 },
      { Sub_Category: 'Monthly Subscription', Revenue: 4200000, Gross_Profit: 2300000, Units: 6300000 },
      { Sub_Category: 'Enterprise Plan', Revenue: 3800000, Gross_Profit: 2000000, Units: 5700000 },
      { Sub_Category: 'Professional Plan', Revenue: 3400000, Gross_Profit: 1800000, Units: 5200000 },
      { Sub_Category: 'Cloud-Hosted', Revenue: 3100000, Gross_Profit: 1600000, Units: 4800000 },
      { Sub_Category: 'SaaS', Revenue: 2800000, Gross_Profit: 1500000, Units: 4300000 },
      { Sub_Category: 'Premium Support', Revenue: 2500000, Gross_Profit: 1300000, Units: 3900000 },
      { Sub_Category: 'Consulting Hours', Revenue: 2200000, Gross_Profit: 1100000, Units: 3500000 },
      { Sub_Category: 'Training Session', Revenue: 1900000, Gross_Profit: 1000000, Units: 3100000 },
      { Sub_Category: 'Basic Plan', Revenue: 1600000, Gross_Profit: 800000, Units: 2700000 }
    ]
  }
};

export default staticData;
