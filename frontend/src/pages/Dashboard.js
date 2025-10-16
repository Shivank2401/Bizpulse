import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleViewInsight = (chartTitle, insights, data) => {
    navigate('/chart-insight', {
      state: { chartTitle, insights, data }
    });
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

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Executive Overview
          </h1>
          <p className="text-gray-600 mt-1">Year-over-year performance and key metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total fGP"
            value={`$${(data?.total_fgp || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="#10b981"
            bgColor="#d1fae5"
          />
          <KPICard
            title="Total Sales"
            value={`$${(data?.total_sales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="#3b82f6"
            bgColor="#dbeafe"
          />
          <KPICard
            title="Total Cases"
            value={(data?.total_cases || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            icon={<Package className="w-6 h-6" />}
            color="#f59e0b"
            bgColor="#fef3c7"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yearly Performance */}
          <ChartCard
            title="Yearly Performance"
            onViewInsight={() =>
              handleViewInsight(
                'Yearly Performance',
                [
                  { type: 'positive', text: 'Consistent growth across all years' },
                  { type: 'neutral', text: 'fGP margins remain stable at 29.5%' }
                ],
                data?.yearly_performance
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.yearly_performance || []}>
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
                <Legend />
                <Bar dataKey="gSales" fill="#3b82f6" name="Sales" radius={[8, 8, 0, 0]} />
                <Bar dataKey="fGP" fill="#10b981" name="fGP" radius={[8, 8, 0, 0]} />
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
                  { type: 'positive', text: 'Household & Beauty leads with 78% market share' },
                  { type: 'attention', text: 'Consider diversification opportunities' }
                ],
                data?.business_performance
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.business_performance || []}
                  dataKey="gSales"
                  nameKey="Business"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.Business}
                  labelLine={false}
                >
                  {(data?.business_performance || []).map((entry, index) => (
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
                  { type: 'positive', text: 'Strong Q4 performance with 15% growth' },
                  { type: 'neutral', text: 'Seasonal patterns align with historical data' }
                ],
                data?.monthly_trend
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Month_Name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gSales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Sales"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="fGP"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="fGP"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </Layout>
  );
};

const KPICard = ({ title, value, icon, color, bgColor }) => (
  <div
    className="professional-card p-6"
    data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className="p-3 rounded-xl"
        style={{ backgroundColor: bgColor, color }}
      >
        {icon}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, onViewInsight, className = '' }) => (
  <div className={`professional-card p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
        {title}
      </h3>
      <Button
        onClick={onViewInsight}
        size="sm"
        variant="outline"
        className="border-blue-200 text-blue-600 hover:bg-blue-50"
        data-testid={`view-insight-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Eye className="w-4 h-4 mr-2" />
        View Insight
      </Button>
    </div>
    {children}
  </div>
);

export default Dashboard;