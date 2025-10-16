import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const CustomerAnalysis = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/customer-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load customer data');
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
            <p className="mt-4 text-gray-400">Loading customer analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const COLORS = ['#538EB7', '#0091A7', '#B1864E', '#184464'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="customer-analysis-page">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Customer Analysis
          </h1>
          <p className="text-gray-400 mt-1">Channel-wise and customer drilldowns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Performance */}
          <ChartCard title="Channel Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.channel_performance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Channel" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="gSales" fill="#538EB7" name="Sales" />
                <Bar dataKey="fGP" fill="#0091A7" name="fGP" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top 10 Customers */}
          <ChartCard title="Top 10 Customers">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.top_customers || []}
                  dataKey="gSales"
                  nameKey="Customer"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(data?.top_customers || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* All Customers Table */}
          <div className="lg:col-span-2">
            <ChartCard title="Customer Performance Overview">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Customer</th>
                      <th className="text-right py-3 px-4 text-gray-300">Sales</th>
                      <th className="text-right py-3 px-4 text-gray-300">fGP</th>
                      <th className="text-right py-3 px-4 text-gray-300">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.customer_performance || []).slice(0, 10).map((customer, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{customer.Customer}</td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          ${(customer.gSales || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          ${(customer.fGP || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          {(customer.Cases || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ChartCard = ({ title, children }) => (
  <div
    className="glass-effect rounded-xl p-6 shadow-custom"
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

export default CustomerAnalysis;