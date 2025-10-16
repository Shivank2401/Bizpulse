import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CustomerAnalysis = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
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
            <p className="mt-4 text-gray-600">Loading customer analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="customer-analysis-page">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Customer Analysis
          </h1>
          <p className="text-gray-600 mt-1">Channel-wise and customer drilldowns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Performance */}
          <ChartCard
            title="Channel Performance"
            onViewInsight={() =>
              handleViewInsight(
                'Channel Performance',
                [
                  { type: 'positive', text: 'Grocery channel shows 35% growth YoY' },
                  { type: 'attention', text: 'Convenience channel needs attention with declining margins' }
                ],
                data?.channel_performance
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.channel_performance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Channel" stroke="#6b7280" style={{ fontSize: '12px' }} />
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

          {/* Top 10 Customers */}
          <ChartCard
            title="Top 10 Customers"
            onViewInsight={() =>
              handleViewInsight(
                'Top 10 Customers',
                [
                  { type: 'positive', text: 'Top 3 customers account for 62% of total revenue' },
                  { type: 'neutral', text: 'Customer concentration risk within acceptable range' }
                ],
                data?.top_customers
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.top_customers || []}
                  dataKey="gSales"
                  nameKey="Customer"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.Customer}
                  labelLine={false}
                >
                  {(data?.top_customers || []).map((entry, index) => (
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

          {/* All Customers Table */}
          <div className="lg:col-span-2">
            <div className="professional-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                  Customer Performance Overview
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Customer</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Sales</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">fGP</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.customer_performance || []).slice(0, 10).map((customer, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-gray-900 font-medium">{customer.Customer}</td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          ${(customer.gSales || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          ${(customer.fGP || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {(customer.Cases || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ChartCard = ({ title, children, onViewInsight }) => (
  <div className="professional-card p-6">
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

export default CustomerAnalysis;