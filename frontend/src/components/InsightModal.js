import React, { useState } from 'react';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Sparkles, TrendingUp, AlertCircle, Lightbulb, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const InsightModal = ({ isOpen, onClose, chartTitle, insights, recommendations, onExploreDeep }) => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `I'm analyzing ${chartTitle}. What would you like to know about this data?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = `insight-${Date.now()}`;

  if (!isOpen) return null;

  const defaultInsights = insights || [
    { type: 'positive', text: 'Year-over-year growth shows strong upward trend' },
    { type: 'neutral', text: 'Sales performance is consistent with industry benchmarks' },
    { type: 'attention', text: 'Consider optimizing inventory for high-demand periods' }
  ];

  const defaultRecommendations = recommendations || [
    'Focus marketing efforts on high-growth segments',
    'Optimize pricing strategy for underperforming categories',
    'Expand product lines in top-performing brands'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        data-testid="insight-modal"
      >
        {/* Header */}
        <div
          className="p-5 border-b flex items-center justify-between rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                {chartTitle} - Insights
              </h3>
              <p className="text-sm text-blue-100">Detailed analysis and recommendations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6 overflow-y-auto">
          {/* Insights Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Key Insights
              </h3>
            </div>

            <div className="space-y-3">
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
                  <p className="text-gray-700 text-sm flex-1">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Recommendations
              </h3>
            </div>

            <div className="space-y-3">
              {defaultRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 text-sm flex-1">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <p className="text-sm text-gray-600">Want to explore deeper insights with AI?</p>
          <Button
            onClick={onExploreDeep}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            data-testid="explore-deep-button"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Explore with AI
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;