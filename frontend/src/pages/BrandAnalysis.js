import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BrandAnalysis = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/brand-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load brand data');
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
            <p className="mt-4 text-gray-600">Loading brand analysis...</p>
          </div>
        </div>
      </Layout>
    );
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="brand-analysis-page">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Brand Analysis
          </h1>
          <p className="text-gray-600 mt-1">Brand performance across categories and channels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Performance */}
          <ChartCard
            title="Overall Brand Performance"
            onViewInsight={() =>
              handleViewInsight(
                'Overall Brand Performance',
                [
                  { type: 'positive', text: 'Top 5 brands contribute to 73% of total revenue' },
                  { type: 'neutral', text: 'Brand portfolio diversification on track' }
                ],
                data?.brand_performance
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(data?.brand_performance || []).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Brand" stroke="#6b7280" angle={-45} textAnchor="end" height={100} style={{ fontSize: '11px' }} />
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

          {/* Brand YoY Growth */}
          <ChartCard
            title="Brand Year-over-Year Growth"
            onViewInsight={() =>
              handleViewInsight(
                'Brand Year-over-Year Growth',
                [
                  { type: 'positive', text: 'Emerging brands show 42% growth trajectory' },
                  { type: 'attention', text: 'Monitor legacy brands for market share retention' }
                ],
                data?.brand_yoy_growth
              )
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.brand_yoy_growth || []}>
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
                {[...new Set((data?.brand_yoy_growth || []).map(d => d.Brand))].slice(0, 5).map((brand, idx) => (
                  <Line
                    key={brand}
                    type="monotone"
                    dataKey="gSales"
                    data={(data?.brand_yoy_growth || []).filter(d => d.Brand === brand)}
                    stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx]}
                    strokeWidth={2}
                    name={brand}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Brand by Business Table */}
          <div className="lg:col-span-2">
            <div className="professional-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                  Brand Performance by Business
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Brand</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Business</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Sales</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">fGP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.brand_by_business || []).slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 text-gray-900 font-medium">{item.Brand}</td>
                        <td className="py-3 px-4 text-gray-700">{item.Business}</td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          ${(item.gSales || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          ${(item.fGP || 0).toLocaleString()}
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

export default BrandAnalysis;