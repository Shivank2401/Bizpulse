import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CategoryAnalysis = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/category-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load category data');
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
            <p className="mt-4 text-gray-600">Loading category analysis...</p>
          </div>
        </div>
      </Layout>
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="category-analysis-page">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Category Analysis
          </h1>
          <p className="text-gray-600 mt-1">Category and sub-category deep dives</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <ChartCard
            title="Category Performance"
            onViewInsight={() =>
              handleViewInsight(
                'Category Performance',
                [
                  { type: 'positive', text: 'Beauty category leads with 45% market share' },
                  { type: 'neutral', text: 'Category mix diversified across segments' }
                ],
                data?.category_performance
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.category_performance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Category" stroke="#6b7280" angle={-45} textAnchor="end" height={100} style={{ fontSize: '11px' }} />
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

          {/* Board Category Distribution */}
          <ChartCard
            title="Board Category Distribution"
            onViewInsight={() =>
              handleViewInsight(
                'Board Category Distribution',
                [
                  { type: 'positive', text: 'Balanced portfolio across board categories' },
                  { type: 'attention', text: 'Opportunity to expand in emerging categories' }
                ],
                data?.board_category_performance
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.board_category_performance || []}
                  dataKey="gSales"
                  nameKey="Board_Category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.Board_Category}
                  labelLine={false}
                >
                  {(data?.board_category_performance || []).map((entry, index) => (
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

          {/* Sub-Category Performance Table */}
          <div className="lg:col-span-2">
            <div className="professional-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                  Sub-Category Performance
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Sub-Category</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Sales</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">fGP</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.subcategory_performance || []).slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-gray-900 font-medium">{item.Sub_Cat}</td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          ${(item.gSales || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          ${(item.fGP || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {(item.Cases || 0).toLocaleString()}
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

export default CategoryAnalysis;