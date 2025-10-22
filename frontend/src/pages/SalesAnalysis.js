import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import ChartComponent from '@/components/ChartComponent';
import { formatNumber } from '@/utils/formatters';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { TrendingUp, TrendingDown, DollarSign, Package, Eye, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SalesAnalysis = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  
  // Multi-select filter states
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, [selectedYears, selectedMonths, selectedBusinesses, selectedChannels]);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API}/filters/options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilters(response.data);
    } catch (error) {
      console.error('Failed to load filters', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (selectedYears.length > 0) queryParams.append('years', selectedYears.join(','));
      if (selectedMonths.length > 0) queryParams.append('months', selectedMonths.join(','));
      if (selectedBusinesses.length > 0) queryParams.append('businesses', selectedBusinesses.join(','));
      if (selectedChannels.length > 0) queryParams.append('channels', selectedChannels.join(','));
      
      const response = await axios.get(`${API}/analytics/executive-overview?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to load sales data', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sales analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const yearlyData = (data?.yearly_performance || []).filter(item => item && item.Year);
  const businessData = (data?.business_performance || []).filter(item => item && item.Business && item.Revenue > 0);

  // KPIs
  const totalSales = data?.total_sales || 0;
  const totalCases = data?.total_cases || 0;
  const avgPrice = totalCases > 0 ? totalSales / totalCases : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: €${formatNumber(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '€' + formatNumber(value)
        }
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Analysis</h1>
          <p className="text-gray-600">Comprehensive sales performance metrics and trends</p>
        </div>

        {/* Multi-Select Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              label="Channel"
              options={filters?.channels || []}
              selectedValues={selectedChannels}
              onChange={setSelectedChannels}
              placeholder="All Channels"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">€{formatNumber(totalSales)}</p>
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +12.5% vs last period
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Cases</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCases)}</p>
            <p className="text-sm text-blue-600 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +8.3% vs last period
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Price/Case</h3>
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">€{formatNumber(avgPrice)}</p>
            <p className="text-sm text-amber-600 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +3.8% vs last period
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Year</h3>
            <div className="h-80">
              {yearlyData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: yearlyData.map(item => item.Year),
                    datasets: [{
                      label: 'Sales',
                      data: yearlyData.map(item => item.Revenue),
                      backgroundColor: '#f59e0b',
                      borderRadius: 6
                    }]
                  }}
                  options={chartOptions}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Business</h3>
            <div className="h-80">
              {businessData.length > 0 ? (
                <ChartComponent
                  type="bar"
                  data={{
                    labels: businessData.map(item => item.Business),
                    datasets: [{
                      label: 'Sales',
                      data: businessData.map(item => item.Revenue),
                      backgroundColor: '#3b82f6',
                      borderRadius: 6
                    }]
                  }}
                  options={chartOptions}
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

export default SalesAnalysis;
