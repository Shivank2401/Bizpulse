import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import InsightModal from '@/components/InsightModal';
import AIInsightModal from '@/components/AIInsightModal';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    // TODO: Apply filters to data
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Ensure data exists and has values
  const yearlyData = (data?.yearly_performance || []).filter(item => item && item.Year);
  const businessData = (data?.business_performance || []).filter(item => item && item.Business && item.gSales > 0);
  const monthlyData = (data?.monthly_trend || []).filter(item => item && item.Month_Name);

  return (
    <Layout>
      <div className="space-y-5" data-testid="dashboard-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Executive Overview
          </h1>
          <p className="text-gray-600 text-sm mt-1">Year-over-year performance and key metrics</p>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />

        {/* KPI Cards */}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Yearly Performance */}
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Year" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="gSales" fill="#3b82f6" name="Sales" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fGP" fill="#10b981" name="fGP" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Business Performance */}
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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={businessData}
                  dataKey="gSales"
                  nameKey="Business"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.Business?.substring(0, 15)}...`}
                  labelLine={false}
                >
                  {businessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monthly Trend */}
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
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Month_Name" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="gSales"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Sales"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="fGP"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="fGP"
                  dot={{ fill: '#10b981', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Insight Modal */}
      <InsightModal
        isOpen={insightModal.isOpen}
        onClose={() => setInsightModal({ isOpen: false, chartTitle: '', insights: [], recommendations: [] })}
        chartTitle={insightModal.chartTitle}
        insights={insightModal.insights}
        recommendations={insightModal.recommendations}
        onExploreDeep={handleExploreDeep}
      />

      {/* AI Modal */}
      <AIInsightModal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal({ isOpen: false, chartTitle: '' })}
        chartTitle={aiModal.chartTitle}
      />
    </Layout>
  );
};

const KPICard = ({ title, value, icon, color, bgColor }) => (
  <div
    className="professional-card p-5"
    data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-xs mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className="p-2.5 rounded-xl"
        style={{ backgroundColor: bgColor, color }}
      >
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