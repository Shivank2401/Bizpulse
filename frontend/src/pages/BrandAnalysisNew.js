import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChartComponent from '@/components/ChartComponent';
import { formatNumber } from '@/utils/formatters';
import staticData from '@/data/staticData';
import { Tag, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

const BrandAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load static data
    setData(staticData.brandAnalysis);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading brand analysis...</p>
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

  const brandData = (data.brand_performance || []).slice(0, 15);
  const brandByBusiness = data.brand_by_business || [];
  const brandGrowth = (data.brand_yoy_growth || []).slice(0, 10);

  // Calculate totals
  const totalRevenue = brandData.reduce((sum, item) => sum + (item.Revenue || 0), 0);
  const totalProfit = brandData.reduce((sum, item) => sum + (item.Gross_Profit || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Vibrant colors
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
    '#6366f1', '#f43f5e', '#0ea5e9', '#8b5cf6', '#d946ef'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Analysis</h1>
          <p className="text-gray-600">Brand performance metrics and insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totalRevenue)}</p>
            <p className="text-sm opacity-80 mt-2">Across {brandData.length} brands</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Profit</h3>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totalProfit)}</p>
            <p className="text-sm opacity-80 mt-2">{avgMargin.toFixed(1)}% margin</p>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Active Brands</h3>
              <Tag className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{brandData.length}</p>
            <p className="text-sm opacity-80 mt-2">In portfolio</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Brands by Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 15 Brands by Revenue</h3>
            <div className="h-96">
              {brandData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: brandData.map(item => item.Brand),
                    datasets: [{
                      label: 'Revenue',
                      data: brandData.map(item => item.Revenue),
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

          {/* Brand Performance Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Revenue Distribution</h3>
            <div className="h-96">
              {brandData.length > 0 ? (
                <ChartComponent
                  type="pie"
                  data={{
                    labels: brandData.slice(0, 10).map(item => item.Brand),
                    datasets: [{
                      data: brandData.slice(0, 10).map(item => item.Revenue),
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${formatNumber(value)} (${percentage}%)`;
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

          {/* Profit by Brand */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Brands by Profit</h3>
            <div className="h-80">
              {brandData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: brandData.slice(0, 10).map(item => item.Brand),
                    datasets: [{
                      label: 'Profit',
                      data: brandData.slice(0, 10).map(item => item.Gross_Profit),
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

          {/* Brand Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Profit (Top 10)</h3>
            <div className="h-80">
              {brandData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: brandData.slice(0, 10).map(item => item.Brand),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: brandData.slice(0, 10).map(item => item.Revenue),
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                      },
                      {
                        label: 'Profit',
                        data: brandData.slice(0, 10).map(item => item.Gross_Profit),
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

export default BrandAnalysis;
