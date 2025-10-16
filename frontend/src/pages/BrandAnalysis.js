import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import InsightModal from '@/components/InsightModal';
import AIInsightModal from '@/components/AIInsightModal';
import axios from 'axios';
import { API, useAuth } from '@/App';
import ChartComponent from '@/components/ChartComponent';
import { formatNumber, formatChartValue, formatCurrency } from '@/utils/formatters';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BrandAnalysis = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({ year: 'all', month: 'all', business: 'all', channel: 'all', brand: 'all', category: 'all' });
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
      const response = await axios.get(`${API}/analytics/brand-analysis`, { headers: { Authorization: `Bearer ${token}` } });
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load brand data');
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
            <p className="mt-4 text-gray-600">Loading brand analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const brandData = (data?.brand_performance || []).filter(item => item && item.Brand).slice(0, 10);
  const brandYoYData = (data?.brand_yoy_growth || []).filter(item => item && item.Brand);

  const brandChartData = {
    labels: brandData.map(item => item.Brand),
    datasets: [
      { label: 'Sales', data: brandData.map(item => item.gSales), backgroundColor: '#3b82f6', borderRadius: 6 },
      { label: 'fGP', data: brandData.map(item => item.fGP), backgroundColor: '#10b981', borderRadius: 6 },
    ],
  };

  // Get unique brands and years for YoY chart
  const uniqueBrands = [...new Set(brandYoYData.map(d => d.Brand))].slice(0, 5);
  const uniqueYears = [...new Set(brandYoYData.map(d => d.Year))].sort();
  
  const brandYoYChartData = {
    labels: uniqueYears,
    datasets: uniqueBrands.map((brand, idx) => ({
      label: brand,
      data: uniqueYears.map(year => {
        const item = brandYoYData.find(d => d.Brand === brand && d.Year === year);
        return item ? item.gSales : 0;
      }),
      borderColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx],
      backgroundColor: `${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx]}20`,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, padding: 10 } },
      tooltip: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        titleColor: '#1f2937', 
        bodyColor: '#1f2937', 
        borderColor: '#e5e7eb', 
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            label += formatChartValue(context.parsed.y || context.parsed);
            return label;
          }
        }
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, callback: (value) => formatNumber(value) } },
    },
  };

  return (
    <Layout>
      <div className="space-y-5" data-testid="brand-analysis-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>Brand Analysis</h1>
          <p className="text-gray-600 text-sm mt-1">Brand performance across categories and channels</p>
        </div>

        <FilterBar filters={filters} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Overall Brand Performance" onViewInsight={() => handleViewInsight('Overall Brand Performance', [{ type: 'positive', text: 'Top 5 brands contribute to 73% of total revenue' }, { type: 'neutral', text: 'Brand portfolio diversification on track' }], ['Focus on high-performing brands', 'Invest in brand building', 'Explore new brand opportunities'])}>
            <div className="chart-container">
              {brandData.length > 0 && <ChartComponent type="bar" data={brandChartData} options={chartOptions} />}
            </div>
          </ChartCard>

          <ChartCard title="Brand Year-over-Year Growth" onViewInsight={() => handleViewInsight('Brand Year-over-Year Growth', [{ type: 'positive', text: 'Emerging brands show 42% growth trajectory' }, { type: 'attention', text: 'Monitor legacy brands for market share retention' }], ['Analyze growth drivers', 'Scale successful brands', 'Optimize underperforming brands'])}>
            <div className="chart-container">
              {brandYoYData.length > 0 && <ChartComponent type="line" data={brandYoYChartData} options={chartOptions} />}
            </div>
          </ChartCard>

          <div className="lg:col-span-2">
            <div className="professional-card p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk' }}>Brand Performance by Business</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 text-gray-700 font-semibold text-xs">Brand</th>
                      <th className="text-left py-2 px-3 text-gray-700 font-semibold text-xs">Business</th>
                      <th className="text-right py-2 px-3 text-gray-700 font-semibold text-xs">Sales</th>
                      <th className="text-right py-2 px-3 text-gray-700 font-semibold text-xs">fGP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.brand_by_business || []).slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-2 px-3 text-gray-900 font-medium text-sm">{item.Brand}</td>
                        <td className="py-2 px-3 text-gray-700 text-sm">{item.Business}</td>
                        <td className="text-right py-2 px-3 text-gray-700 text-sm">${(item.gSales || 0).toLocaleString()}</td>
                        <td className="text-right py-2 px-3 text-gray-700 text-sm">${(item.fGP || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InsightModal isOpen={insightModal.isOpen} onClose={() => setInsightModal({ isOpen: false, chartTitle: '', insights: [], recommendations: [] })} chartTitle={insightModal.chartTitle} insights={insightModal.insights} recommendations={insightModal.recommendations} onExploreDeep={handleExploreDeep} />
      <AIInsightModal isOpen={aiModal.isOpen} onClose={() => setAiModal({ isOpen: false, chartTitle: '' })} chartTitle={aiModal.chartTitle} />
    </Layout>
  );
};

const ChartCard = ({ title, children, onViewInsight }) => (
  <div className="professional-card p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{title}</h3>
      <Button onClick={onViewInsight} size="sm" variant="outline" className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
        <Eye className="w-3 h-3 mr-1.5" />View Insight
      </Button>
    </div>
    {children}
  </div>
);

export default BrandAnalysis;