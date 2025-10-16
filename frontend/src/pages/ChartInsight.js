import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import AIInsightModal from '@/components/AIInsightModal';

const ChartInsight = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAIModal, setShowAIModal] = useState(false);
  const { chartTitle, insights, recommendations, data } = location.state || {};

  if (!chartTitle) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">No insight data available</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </Layout>
    );
  }

  const defaultInsights = insights || [
    { type: 'positive', text: 'Year-over-year growth shows strong upward trend in Q4 2024' },
    { type: 'neutral', text: 'Sales performance is consistent with industry benchmarks' },
    { type: 'attention', text: 'Consider increasing inventory for high-performing categories' }
  ];

  const defaultRecommendations = recommendations || [
    'Focus marketing efforts on high-growth segments',
    'Optimize pricing strategy for underperforming categories',
    'Expand product lines in top-performing brands'
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="chart-insight-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="border-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                {chartTitle} - Insights
              </h1>
              <p className="text-gray-500 mt-1">Detailed analysis and recommendations</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAIModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            data-testid="explore-ai-button"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Explore with AI
          </Button>
        </div>

        {/* Insights Section */}
        <div className="professional-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              Key Insights
            </h2>
          </div>

          <div className="space-y-4">
            {defaultInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: insight.type === 'positive' ? '#f0fdf4' :
                             insight.type === 'attention' ? '#fef3c7' : '#f8fafc',
                  border: '1px solid',
                  borderColor: insight.type === 'positive' ? '#86efac' :
                               insight.type === 'attention' ? '#fde047' : '#e2e8f0'
                }}
              >
                <div className="mt-0.5">
                  {insight.type === 'positive' ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  ) : insight.type === 'attention' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
                <p className="text-gray-700 flex-1">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="professional-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Lightbulb className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              Recommendations
            </h2>
          </div>

          <div className="space-y-3">
            {defaultRecommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {idx + 1}
                </span>
                <p className="text-gray-700 flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight Modal */}
      <AIInsightModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        chartTitle={chartTitle}
        data={data}
      />
    </Layout>
  );
};

export default ChartInsight;