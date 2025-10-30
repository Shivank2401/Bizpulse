import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChartComponent from '@/components/ChartComponent';
import { formatNumber } from '@/utils/formatters';
import staticData from '@/data/staticData';
import { Layers, TrendingUp, DollarSign } from 'lucide-react';

const CategoryAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load static data
    setData(staticData.categoryAnalysis);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading category analysis...</p>
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

  const categoryData = (data.category_performance || []).slice(0, 15);
  const subcategoryData = (data.subcategory_performance || []).slice(0, 20);

  // Calculate totals
  const totalRevenue = categoryData.reduce((sum, item) => sum + (item.Revenue || 0), 0);
  const totalProfit = categoryData.reduce((sum, item) => sum + (item.Gross_Profit || 0), 0);

  // Rainbow colors
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Analysis</h1>
          <p className="text-gray-600">Product category and sub-category performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totalRevenue)}</p>
            <p className="text-sm opacity-80 mt-2">Across categories</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Profit</h3>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totalProfit)}</p>
            <p className="text-sm opacity-80 mt-2">{((totalProfit/totalRevenue)*100).toFixed(1)}% margin</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Categories</h3>
              <Layers className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{categoryData.length}</p>
            <p className="text-sm opacity-80 mt-2">Active categories</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
            <div className="h-96">
              {categoryData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: categoryData.map(item => item.Category),
                    datasets: [{
                      label: 'Revenue',
                      data: categoryData.map(item => item.Revenue),
                      backgroundColor: colors,
                      borderRadius: 6
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `$${formatNumber(context.parsed.x)}`
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '$' + formatNumber(value) },
                        grid: { color: '#f3f4f6' }
                      },
                      y: { grid: { display: false } }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <div className="h-96">
              {categoryData.length > 0 ? (
                <ChartComponent
                  type="doughnut"
                  data={{
                    labels: categoryData.slice(0, 10).map(item => item.Category),
                    datasets: [{
                      data: categoryData.slice(0, 10).map(item => item.Revenue),
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
                        labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
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

          {/* Profit by Category */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit by Category (Top 10)</h3>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: categoryData.slice(0, 10).map(item => item.Category),
                    datasets: [{
                      label: 'Profit',
                      data: categoryData.slice(0, 10).map(item => item.Gross_Profit),
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
                      x: { 
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 45 }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Sub-category Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Sub-Categories by Revenue</h3>
            <div className="h-80">
              {subcategoryData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: subcategoryData.slice(0, 10).map(item => item.Sub_Category),
                    datasets: [{
                      label: 'Revenue',
                      data: subcategoryData.slice(0, 10).map(item => item.Revenue),
                      backgroundColor: '#f59e0b',
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
                      x: { 
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 45 }
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

export default CategoryAnalysis;
