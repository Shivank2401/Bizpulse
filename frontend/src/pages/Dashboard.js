import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import InsightModal from '@/components/InsightModal';
import AIInsightModal from '@/components/AIInsightModal';
import ChartComponent from '@/components/ChartComponent';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { TrendingUp, DollarSign, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Dashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: 'all',
    month: 'all',
    business: 'all',
    channel: 'all',
    brand: 'all',
    category: 'all'
  });
  const [insightModal, setInsightModal] = useState({ isOpen: false, chartTitle: '', insights: [], recommendations: [] });
  const [aiModal, setAiModal] = useState({ isOpen: false, chartTitle: '' });

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API}/filters/options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilters(response.data);
    } catch (error) {
      console.error('Failed to load filters');
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/executive-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleViewInsight = (chartTitle, insights, recommendations) => {
    setInsightModal({ isOpen: true, chartTitle, insights, recommendations });
  };

  const handleExploreDeep = () => {
    setInsightModal({ isOpen: false, chartTitle: '', insights: [], recommendations: [] });
    setAiModal({ isOpen: true, chartTitle: insightModal.chartTitle });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const yearlyData = (data?.yearly_performance || []).filter(item => item && item.Year);
  const businessData = (data?.business_performance || []).filter(item => item && item.Business && item.gSales > 0);
  const monthlyData = (data?.monthly_trend || []).filter(item => item && item.Month_Name);

  // Yearly Performance Chart Data
  const yearlyChartData = {
    labels: yearlyData.map(item => item.Year),
    datasets: [
      {
        label: 'Sales',
        data: yearlyData.map(item => item.gSales),
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'fGP',
        data: yearlyData.map(item => item.fGP),
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Business Performance Pie Chart Data
  const businessChartData = {
    labels: businessData.map(item => item.Business),
    datasets: [
      {
        data: businessData.map(item => item.gSales),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Monthly Trend Line Chart Data
  const monthlyChartData = {
    labels: monthlyData.map(item => item.Month_Name),
    datasets: [
      {
        label: 'Sales',
        data: monthlyData.map(item => item.gSales),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      },
      {
        label: 'fGP',
        data: monthlyData.map(item => item.fGP),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { size: 11 },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          font: { size: 11 },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  return (
    <Layout>
      <div className="space-y-5" data-testid="dashboard-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Executive Overview
          </h1>
          <p className="text-gray-600 text-sm mt-1">Year-over-year performance and key metrics</p>
        </div>

        <FilterBar
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <KPICard
            title="Total fGP"
            value={`$${(data?.total_fgp || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="#10b981"
            bgColor="#d1fae5"
          />
          <KPICard
            title="Total Sales"
            value={`$${(data?.total_sales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="#3b82f6"
            bgColor="#dbeafe"
          />
          <KPICard
            title="Total Cases"
            value={(data?.total_cases || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            icon={<Package className="w-5 h-5" />}
            color="#f59e0b"
            bgColor="#fef3c7"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard
            title="Yearly Performance"
            onViewInsight={() =>
              handleViewInsight(
                'Yearly Performance',
                [
                  { type: 'positive', text: `Total revenue of $${(data?.total_sales || 0).toLocaleString()} across ${yearlyData.length} years` },
                  { type: 'neutral', text: 'fGP margins remain stable at 29.5% average' }
                ],
                [
                  'Monitor year-over-year growth trends',
                  'Focus on maintaining consistent profit margins',
                  'Explore opportunities in high-growth years'
                ]
              )
            }
          >
            <div className="chart-container">
              {yearlyData.length > 0 && <ChartComponent type="bar" data={yearlyChartData} options={chartOptions} />}
            </div>
          </ChartCard>

          <ChartCard
            title="Business Performance"
            onViewInsight={() =>
              handleViewInsight(
                'Business Performance',
                [
                  { type: 'positive', text: `${businessData.length} active business units contributing to revenue` },
                  { type: 'attention', text: 'Consider portfolio diversification for risk mitigation' }
                ],
                [
                  'Analyze top-performing business units',
                  'Invest in emerging business opportunities',
                  'Balance portfolio across business segments'
                ]
              )
            }
          >
            <div className="chart-container">
              {businessData.length > 0 && <Pie key="business-chart" data={businessChartData} options={pieOptions} />}
            </div>
          </ChartCard>

          <ChartCard
            title="Monthly Trend (Current Year)"
            className="lg:col-span-2"
            onViewInsight={() =>
              handleViewInsight(
                'Monthly Trend',
                [
                  { type: 'positive', text: `${monthlyData.length} months of data showing seasonal patterns` },
                  { type: 'neutral', text: 'Performance aligns with industry benchmarks' }
                ],
                [
                  'Optimize inventory for peak months',
                  'Plan marketing campaigns around high-performing periods',
                  'Address underperforming months with targeted strategies'
                ]
              )
            }
          >
            <div className="chart-container">
              {monthlyData.length > 0 && <Line key="monthly-chart" data={monthlyChartData} options={chartOptions} />}
            </div>
          </ChartCard>
        </div>
      </div>

      <InsightModal
        isOpen={insightModal.isOpen}
        onClose={() => setInsightModal({ isOpen: false, chartTitle: '', insights: [], recommendations: [] })}
        chartTitle={insightModal.chartTitle}
        insights={insightModal.insights}
        recommendations={insightModal.recommendations}
        onExploreDeep={handleExploreDeep}
      />

      <AIInsightModal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal({ isOpen: false, chartTitle: '' })}
        chartTitle={aiModal.chartTitle}
      />
    </Layout>
  );
};

const KPICard = ({ title, value, icon, color, bgColor }) => (
  <div className="professional-card p-5" data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-xs mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: bgColor, color }}>
        {icon}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, onViewInsight, className = '' }) => (
  <div className={`professional-card p-5 ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
        {title}
      </h3>
      <Button
        onClick={onViewInsight}
        size="sm"
        variant="outline"
        className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
        data-testid={`view-insight-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Eye className="w-3 h-3 mr-1.5" />
        View Insight
      </Button>
    </div>
    {children}
  </div>
);

export default Dashboard;