import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const BrandAnalysis = () => {
  const { token } = useAuth();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading brand analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="brand-analysis-page">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Brand Analysis
          </h1>
          <p className="text-gray-400 mt-1">Brand performance across categories and channels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Performance */}
          <ChartCard title="Overall Brand Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(data?.brand_performance || []).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Brand" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
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

          {/* Brand YoY Growth */}
          <ChartCard title="Brand Year-over-Year Growth">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.brand_yoy_growth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Year" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Legend />
                {[...new Set((data?.brand_yoy_growth || []).map(d => d.Brand))].slice(0, 5).map((brand, idx) => (
                  <Line
                    key={brand}
                    type="monotone"
                    dataKey="gSales"
                    data={(data?.brand_yoy_growth || []).filter(d => d.Brand === brand)}
                    stroke={['#538EB7', '#0091A7', '#B1864E', '#184464', '#4a5568'][idx]}
                    name={brand}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Brand by Business Table */}
          <div className="lg:col-span-2">
            <ChartCard title="Brand Performance by Business">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Brand</th>
                      <th className="text-left py-3 px-4 text-gray-300">Business</th>
                      <th className="text-right py-3 px-4 text-gray-300">Sales</th>
                      <th className="text-right py-3 px-4 text-gray-300">fGP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.brand_by_business || []).slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{item.Brand}</td>
                        <td className="py-3 px-4 text-gray-300">{item.Business}</td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          ${(item.gSales || 0).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-300">
                          ${(item.fGP || 0).toLocaleString()}
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

export default BrandAnalysis;