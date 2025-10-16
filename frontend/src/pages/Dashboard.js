import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Package, Activity } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { token } = useAuth();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const COLORS = ['#538EB7', '#0091A7', '#B1864E', '#184464'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Executive Overview
          </h1>
          <p className="text-gray-400 mt-1">Year-over-year performance and key metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total fGP"
            value={`$${(data?.total_fgp || 0).toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="#538EB7"
          />
          <KPICard
            title="Total Sales"
            value={`$${(data?.total_sales || 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="#0091A7"
          />
          <KPICard
            title="Total Cases"
            value={(data?.total_cases || 0).toLocaleString()}
            icon={<Package className="w-6 h-6" />}
            color="#B1864E"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yearly Performance */}
          <ChartCard title="Yearly Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.yearly_performance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Year" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="gSales" fill="#538EB7" name="Sales" />
                <Bar dataKey="fGP" fill="#0091A7" name="fGP" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Business Performance */}
          <ChartCard title="Business Performance">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.business_performance || []}
                  dataKey="gSales"
                  nameKey="Business"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(data?.business_performance || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monthly Trend */}
          <ChartCard title="Monthly Trend (Current Year)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Month_Name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="gSales" stroke="#538EB7" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="fGP" stroke="#0091A7" strokeWidth={2} name="fGP" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </Layout>
  );
};

const KPICard = ({ title, value, icon, color }) => (
  <div
    className="glass-effect rounded-xl p-6 shadow-custom"
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}
    data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className = '' }) => (
  <div
    className={`glass-effect rounded-xl p-6 shadow-custom ${className}`}
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}
  >
    <h3 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>
      {title}
    </h3>
    {children}
  </div>
);

export default Dashboard;