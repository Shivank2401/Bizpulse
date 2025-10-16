import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import InsightModal from '@/components/InsightModal';
import AIInsightModal from '@/components/AIInsightModal';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CategoryAnalysis = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: 'all', month: 'all', business: 'all', channel: 'all', brand: 'all', category: 'all'
  });
  const [insightModal, setInsightModal] = useState({ isOpen: false, chartTitle: '', insights: [], recommendations: [] });
  const [aiModal, setAiModal] = useState({ isOpen: false, chartTitle: '' });

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API}/filters/options`, { headers: { Authorization: `Bearer ${token}` } });
      setFilters(response.data);
    } catch (error) {
      console.error('Failed to load filters');
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/category-analysis`, { headers: { Authorization: `Bearer ${token}` } });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load category data');
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
            <p className="mt-4 text-gray-600">Loading category analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const channelData = (data?.channel_performance || []).filter(item => item && item.Channel);
  const topCategorys = (data?.top_categorys || []).filter(item => item && item.Category && item.gSales > 0);

  return (
    <Layout>
      <div className="space-y-5" data-testid="category-analysis-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Category Analysis
          </h1>
          <p className="text-gray-600 text-sm mt-1">Channel-wise and category drilldowns</p>
        </div>

        <FilterBar filters={filters} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard
            title="Channel Performance"
            onViewInsight={() => handleViewInsight(
              'Channel Performance',
              [
                { type: 'positive', text: 'Grocery channel shows strong performance' },
                { type: 'attention', text: 'Convenience channel needs strategic attention' }
              ],
              ['Optimize channel mix', 'Focus on high-margin channels', 'Expand distribution network']
            )}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Channel" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="gSales" fill="#3b82f6" name="Sales" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fGP" fill="#10b981" name="fGP" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Top 10 Categorys"
            onViewInsight={() => handleViewInsight(
              'Top 10 Categorys',
              [
                { type: 'positive', text: 'Strong category base with loyal repeat buyers' },
                { type: 'neutral', text: 'Category concentration within acceptable range' }
              ],
              ['Strengthen top category relationships', 'Develop loyalty programs', 'Expand category acquisition']
            )}
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={topCategorys}
                  dataKey="gSales"
                  nameKey="Category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.Category?.substring(0, 12)}...`}
                  labelLine={false}
                >
                  {topCategorys.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="lg:col-span-2">
            <div className="professional-card p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                Category Performance Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 text-gray-700 font-semibold text-xs">Category</th>
                      <th className="text-right py-2 px-3 text-gray-700 font-semibold text-xs">Sales</th>
                      <th className="text-right py-2 px-3 text-gray-700 font-semibold text-xs">fGP</th>
                      <th className="text-right py-2 px-3 text-gray-700 font-semibold text-xs">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.category_performance || []).slice(0, 10).map((category, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-2 px-3 text-gray-900 font-medium text-sm">{category.Category}</td>
                        <td className="text-right py-2 px-3 text-gray-700 text-sm">${(category.gSales || 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-3 text-gray-700 text-sm">${(category.fGP || 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-3 text-gray-700 text-sm">{(category.Cases || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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

const ChartCard = ({ title, children, onViewInsight }) => (
  <div className="professional-card p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
        {title}
      </h3>
      <Button
        onClick={onViewInsight}
        size="sm"
        variant="outline"
        className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
      >
        <Eye className="w-3 h-3 mr-1.5" />
        View Insight
      </Button>
    </div>
    {children}
  </div>
);

export default CategoryAnalysis;
