import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import ChartComponent from '@/components/ChartComponent';
import InsightModal from '@/components/InsightModal';
import { formatNumber } from '@/utils/formatters';
import staticData from '@/data/staticData';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Users, Target, Activity, Lightbulb 
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  
  // Page-level multi-select filters
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  
  // Chart-level filters
  const [chartFilters, setChartFilters] = useState({});
  
  // Insight modal
  const [insightModal, setInsightModal] = useState({ isOpen: false, chartTitle: '' });

  useEffect(() => {
    // Load static data
    setFilters(staticData.filters);
    setData(staticData.executiveOverview);
    setLoading(false);
  }, []);

  const handleChartFilterChange = async (chartName, filterType, value) => {
    const newFilters = {
      ...chartFilters,
      [chartName]: {
        ...(chartFilters[chartName] || {}),
        [filterType]: value
      }
    };
    setChartFilters(newFilters);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </Layout>
    );
  }

  const yearlyData = (data?.yearly_performance || []).filter(item => item && item.Year);
  const businessData = (data?.business_performance || []).filter(item => item && item.Business && item.Revenue > 0);
  const monthlyData = (data?.monthly_trend || []).filter(item => item && item.Month_Name);
  const channelData = (data?.channel_performance || []).filter(item => item && item.Channel);

  // Calculate metrics
  const totalRevenue = data?.total_revenue || 0;
  const totalProfit = data?.total_profit || 0;
  const totalUnits = data?.total_units || 0;
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  // Mock growth percentages (in real app, calculate from historical data)
  const revenueGrowth = 8.2;
  const profitGrowth = 5.1;
  const unitsGrowth = -2.3;
  const yoyGrowth = 15.2;
  const customerAcquisition = 245;
  const marketShare = 28.5;
  const operationalEfficiency = 92;

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const ChartCard = ({ title, chartName, children }) => {
    const currentFilters = chartFilters[chartName] || {};
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        
        {/* Chart Filters */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <select
            value={currentFilters.year || 'all'}
            onChange={(e) => handleChartFilterChange(chartName, 'year', e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 bg-white"
          >
            <option value="all">All Years</option>
            {filters?.years?.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select
            value={currentFilters.month || 'all'}
            onChange={(e) => handleChartFilterChange(chartName, 'month', e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 bg-white"
          >
            <option value="all">All Months</option>
            {filters?.months?.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          
          <select
            value={currentFilters.business || 'all'}
            onChange={(e) => handleChartFilterChange(chartName, 'business', e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 bg-white"
          >
            <option value="all">All Businesses</option>
            {filters?.businesses?.map(business => (
              <option key={business} value={business}>{business}</option>
            ))}
          </select>
          
          <button
            onClick={() => setInsightModal({ isOpen: true, chartTitle: title })}
            className="ml-auto px-4 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            View Insight
          </button>
        </div>
        
        {children}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Compass</h1>
          <p className="text-gray-600">Comprehensive business analytics and performance metrics</p>
        </div>

        {/* Overall Page Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Global Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <MultiSelectFilter
              label="Year"
              options={filters?.years || []}
              selectedValues={selectedYears}
              onChange={setSelectedYears}
              placeholder="All Years"
            />
            <MultiSelectFilter
              label="Month"
              options={filters?.months || []}
              selectedValues={selectedMonths}
              onChange={setSelectedMonths}
              placeholder="All Months"
            />
            <MultiSelectFilter
              label="Business"
              options={filters?.businesses || []}
              selectedValues={selectedBusinesses}
              onChange={setSelectedBusinesses}
              placeholder="All Businesses"
            />
            <MultiSelectFilter
              label="Brand"
              options={filters?.brands || []}
              selectedValues={selectedBrands}
              onChange={setSelectedBrands}
              placeholder="All Brands"
            />
            <MultiSelectFilter
              label="Channel"
              options={filters?.channels || []}
              selectedValues={selectedChannels}
              onChange={setSelectedChannels}
              placeholder="All Channels"
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Total Sales</span>
            </div>
            <p className="text-xl font-bold text-gray-900">${formatNumber(totalRevenue/1000000)}M</p>
            <p className={`text-xs flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(revenueGrowth)}%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Gross Profit</span>
            </div>
            <p className="text-xl font-bold text-gray-900">${formatNumber(totalProfit/1000)}K</p>
            <p className={`text-xs flex items-center gap-1 ${profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(profitGrowth)}%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">Cases Sold</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatNumber(totalUnits/1000)}K</p>
            <p className={`text-xs flex items-center gap-1 ${unitsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {unitsGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(unitsGrowth)}%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-600">Avg. Margin</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Current</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">YoY Growth</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{yoyGrowth}%</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Strong
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">New Customers</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{customerAcquisition}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              8.5%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-gray-600">Market Share</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{marketShare}%</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              3.2%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-gray-600">Efficiency</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{operationalEfficiency}%</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              3.0%
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend YTD */}
          <ChartCard title="Sales Trend (YTD)" chartName="salesTrend">
            <div className="h-80">
              {monthlyData.length > 0 ? (
                <ChartComponent
                  type="line"
                  data={{
                    labels: monthlyData.map(item => item.Month_Name),
                    datasets: [{
                      label: 'Revenue',
                      data: monthlyData.map(item => item.Revenue),
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                      borderWidth: 3
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `$${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Revenue vs Expenses */}
          <ChartCard title="Revenue vs Expenses" chartName="revenueExpenses">
            <div className="h-80">
              {yearlyData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: yearlyData.map(item => item.Year),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: yearlyData.map(item => item.Revenue),
                        backgroundColor: '#10b981',
                        borderRadius: 8
                      },
                      {
                        label: 'Expenses',
                        data: yearlyData.map(item => item.Revenue - item.Gross_Profit),
                        backgroundColor: '#ef4444',
                        borderRadius: 8
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.dataset.label}: $${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Business vs Cases */}
          <ChartCard title="Business vs Cases" chartName="businessCases">
            <div className="h-80">
              {businessData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: businessData.map(item => item.Business),
                    datasets: [{
                      label: 'Units',
                      data: businessData.map(item => item.Units),
                      backgroundColor: colors,
                      borderRadius: 8
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${formatNumber(context.parsed.y)} units`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => formatNumber(value) }
                      },
                      x: { ticks: { maxRotation: 45, minRotation: 45 } }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Business vs Sales */}
          <ChartCard title="Business vs Sales" chartName="businessSales">
            <div className="h-80">
              {businessData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: businessData.map(item => item.Business),
                    datasets: [{
                      label: 'Revenue',
                      data: businessData.map(item => item.Revenue),
                      backgroundColor: '#3b82f6',
                      borderRadius: 8
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `$${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) }
                      },
                      x: { ticks: { maxRotation: 45, minRotation: 45 } }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Business vs Gross Profit */}
          <ChartCard title="Business vs Gross Profit" chartName="businessProfit">
            <div className="h-80">
              {businessData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: businessData.map(item => item.Business),
                    datasets: [{
                      label: 'Profit',
                      data: businessData.map(item => item.Gross_Profit),
                      backgroundColor: '#10b981',
                      borderRadius: 8
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `$${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) }
                      },
                      x: { ticks: { maxRotation: 45, minRotation: 45 } }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Channel Distribution */}
          <ChartCard title="Channel Distribution" chartName="channelDist">
            <div className="h-80">
              {channelData.length > 0 ? (
                <ChartComponent
                  type="doughnut"
                  data={{
                    labels: channelData.map(item => item.Channel),
                    datasets: [{
                      data: channelData.map(item => item.Revenue),
                      backgroundColor: colors,
                      borderWidth: 2,
                      borderColor: '#fff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: $${formatNumber(context.parsed)}`
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Business Performance */}
          <ChartCard title="Business Performance" chartName="businessPerf">
            <div className="h-80">
              {businessData.length > 0 ? (
                <ChartComponent
                  type="pie"
                  data={{
                    labels: businessData.map(item => item.Business),
                    datasets: [{
                      data: businessData.map(item => item.Revenue),
                      backgroundColor: colors,
                      borderWidth: 2,
                      borderColor: '#fff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: $${formatNumber(context.parsed)}`
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>

          {/* Top Performers */}
          <ChartCard title="Top Performers" chartName="topPerformers">
            <div className="h-80">
              {businessData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: businessData.slice(0, 5).map(item => item.Business),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: businessData.slice(0, 5).map(item => item.Revenue),
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                      },
                      {
                        label: 'Profit',
                        data: businessData.slice(0, 5).map(item => item.Gross_Profit),
                        backgroundColor: '#10b981',
                        borderRadius: 6
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.dataset.label}: $${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data</p>
              )}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Insight Modal */}
      <InsightModal
        isOpen={insightModal.isOpen}
        onClose={() => setInsightModal({ isOpen: false, chartTitle: '' })}
        chartTitle={insightModal.chartTitle}
        insights={[]}
        recommendations={[]}
        onExploreDeep={() => {}}
      />
    </Layout>
  );
};

export default Dashboard;
