import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChartComponent from '@/components/ChartComponent';
import { formatNumber } from '@/utils/formatters';
import staticData from '@/data/staticData';
import { Users, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

const CustomerAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load static data
    setData(staticData.customerAnalysis);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer analysis...</p>
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

  const channelData = data.channel_performance || [];
  const customerData = data.customer_performance || [];
  const topCustomers = (data.top_customers || []).slice(0, 10);

  // Calculate totals
  const totalRevenue = channelData.reduce((sum, item) => sum + (item.Revenue || 0), 0);
  const totalProfit = channelData.reduce((sum, item) => sum + (item.Gross_Profit || 0), 0);
  const totalUnits = channelData.reduce((sum, item) => sum + (item.Units || 0), 0);

  // Colorful palette
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Analysis</h1>
          <p className="text-gray-600">Channel performance and customer insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">${formatNumber(totalRevenue)}</p>
            <p className="text-sm opacity-80 mt-2">Across all channels</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Profit</h3>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">${formatNumber(totalProfit)}</p>
            <p className="text-sm opacity-80 mt-2">{((totalProfit/totalRevenue)*100).toFixed(1)}% margin</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Units</h3>
              <ShoppingCart className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totalUnits)}</p>
            <p className="text-sm opacity-80 mt-2">Units sold</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Channel</h3>
            <div className="h-80">
              {channelData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: channelData.map(item => item.Channel),
                    datasets: [{
                      label: 'Revenue',
                      data: channelData.map(item => item.Revenue),
                      backgroundColor: colors,
                      borderRadius: 8,
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Revenue: $${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) },
                        grid: { color: '#f3f4f6' }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Top 10 Customers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Customers</h3>
            <div className="h-80">
              {topCustomers.length > 0 ? (
                <ChartComponent
                  type="pie"
                  data={{
                    labels: topCustomers.map(item => item.Customer),
                    datasets: [{
                      data: topCustomers.map(item => item.Revenue),
                      backgroundColor: colors,
                      borderWidth: 2,
                      borderColor: '#fff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'right',
                        labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: $${formatNumber(value)}`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Channel Profit Margin */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit by Channel</h3>
            <div className="h-80">
              {channelData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: channelData.map(item => item.Channel),
                    datasets: [{
                      label: 'Profit',
                      data: channelData.map(item => item.Gross_Profit),
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
                          label: (context) => `Profit: $${formatNumber(context.parsed.y)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) },
                        grid: { color: '#f3f4f6' }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Units by Channel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Units by Channel</h3>
            <div className="h-80">
              {channelData.length > 0 ? (
                <ChartComponent
                  type="doughnut"
                  data={{
                    labels: channelData.map(item => item.Channel),
                    datasets: [{
                      data: channelData.map(item => item.Units),
                      backgroundColor: colors,
                      borderWidth: 2,
                      borderColor: '#fff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'right',
                        labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${formatNumber(value)} units`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerAnalysis;
