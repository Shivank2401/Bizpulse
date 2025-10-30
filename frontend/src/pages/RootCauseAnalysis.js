import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import ChartComponent from '@/components/ChartComponent';
import { formatNumber } from '@/utils/formatters';
import staticData from '@/data/staticData';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  Target,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  Mail,
  MousePointer,
  RefreshCw,
  Eye,
  MapPin,
  Layers,
  Award,
  Zap
} from 'lucide-react';

const RootCauseAnalysis = () => {
  const [activeTab, setActiveTab] = useState('root-cause-analysis');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState('Overall');
  
  // Multi-select filter states
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  useEffect(() => {
    // Load static data
    setFilters(staticData.filters);
    setData(staticData.executiveOverview);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading root cause analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const businessData = (data?.business_performance || []).filter(item => item && item.Business && item.Revenue > 0);

  // Root Cause Analysis Issues
  const issues = [
    {
      id: 1,
      title: 'Sales Decline in Q4',
      severity: 'high',
      rootCause: 'Increased competition from new market entrants',
      impact: '€250K revenue loss',
      recommendation: 'Launch competitive pricing strategy and enhanced marketing',
      status: 'investigating',
      icon: TrendingDown,
      color: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' }
    },
    {
      id: 2,
      title: 'Customer Churn Rate Increase',
      severity: 'medium',
      rootCause: 'Service delivery delays due to supply chain issues',
      impact: '15% increase in churn',
      recommendation: 'Optimize logistics and implement customer retention program',
      status: 'resolved',
      icon: AlertTriangle,
      color: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' }
    },
    {
      id: 3,
      title: 'Inventory Turnover Slowdown',
      severity: 'low',
      rootCause: 'Overstocking of seasonal products',
      impact: '€120K in tied capital',
      recommendation: 'Implement dynamic inventory management system',
      status: 'monitoring',
      icon: CheckCircle,
      color: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '#10b981' }
    }
  ];

  // Marketing Strategy Data
  const marketingStrategyModules = [
    {
      id: 1,
      title: 'Strategic Framework',
      description: 'Define your marketing strategy framework',
      icon: Target,
      status: 'active',
      color: { bg: '#dbeafe', icon: '#2563eb' }
    },
    {
      id: 2,
      title: 'Channel Strategy',
      description: 'Optimize your marketing channel mix',
      icon: Layers,
      status: 'active',
      color: { bg: '#d1fae5', icon: '#059669' }
    },
    {
      id: 3,
      title: 'Budget Allocation',
      description: 'Strategic budget planning and allocation',
      icon: DollarSign,
      status: 'active',
      color: { bg: '#fef3c7', icon: '#d97706' }
    },
    {
      id: 4,
      title: 'Market Segmentation',
      description: 'Define and refine your target segments',
      icon: Users,
      status: 'active',
      color: { bg: '#e0e7ff', icon: '#4f46e5' }
    },
    {
      id: 5,
      title: 'Brand Positioning',
      description: 'Develop and maintain brand positioning',
      icon: Award,
      status: 'active',
      color: { bg: '#fce7f3', icon: '#9f1239' }
    },
    {
      id: 6,
      title: 'Competitive Strategy',
      description: 'Strategic response to competitive landscape',
      icon: Zap,
      status: 'active',
      color: { bg: '#fed7aa', icon: '#ea580c' }
    }
  ];

  // AI Insights Data
  const aiInsights = [
    {
      id: 1,
      title: 'Signup Drop-off Spike',
      priority: 'critical',
      description: 'AI-generated marketing insight based on campaign performance data',
      details: '42% increase in form abandonment at step 3 detected. Users are leaving at the payment information field, indicating potential security concerns or complex checkout process.',
      color: { bg: '#fee2e2', text: '#991b1b', label: 'Critical' }
    },
    {
      id: 2,
      title: 'Weekend Engagement Window',
      priority: 'medium',
      description: 'AI-generated marketing insight based on campaign performance data',
      details: 'Email engagement increases by 68% on weekends between 10AM-2PM. Consider scheduling high-priority campaigns during this window for maximum impact.',
      color: { bg: '#fef3c7', text: '#92400e', label: 'Medium' }
    },
    {
      id: 3,
      title: 'Mobile Traffic Surge',
      priority: 'high',
      description: 'AI-generated marketing insight based on campaign performance data',
      details: 'Mobile traffic increased 85% but conversion rate is 23% lower than desktop. Mobile UX optimization recommended to capitalize on increased traffic.',
      color: { bg: '#fed7aa', text: '#9a3412', label: 'High' }
    }
  ];

  // Performance Charts Data
  const roasData = {
    labels: ['Apr 22', 'Apr 25', 'Apr 28', 'May 1', 'May 4', 'May 7', 'May 10', 'May 13', 'May 16', 'May 19', 'May 22', 'May 25', 'May 28', 'Jun 1', 'Jun 4', 'Jun 7', 'Jun 10', 'Jun 13', 'Jun 16', 'Jun 19', 'Jun 22', 'Jun 25', 'Jun 28', 'Jul 1', 'Jul 4', 'Jul 7', 'Jul 10', 'Jul 13'],
    values: [3.2, 4.1, 2.8, 3.5, 4.5, 3.9, 2.9, 4.2, 3.7, 4.8, 3.4, 2.6, 3.8, 4.3, 3.1, 4.6, 3.5, 2.9, 4.1, 3.6, 4.4, 3.2, 3.9, 4.7, 3.3, 4.0, 3.8, 4.2]
  };

  const emailOpenRateData = {
    labels: ['Apr 22', 'Apr 25', 'Apr 28', 'May 1', 'May 4', 'May 7', 'May 10', 'May 13', 'May 16', 'May 19', 'May 22', 'May 25', 'May 28', 'Jun 1', 'Jun 4', 'Jun 7', 'Jun 10', 'Jun 13', 'Jun 16', 'Jun 19', 'Jun 22', 'Jun 25', 'Jun 28', 'Jul 1', 'Jul 4', 'Jul 7', 'Jul 10', 'Jul 13'],
    values: [0.22, 0.21, 0.28, 0.23, 0.22, 0.24, 0.23, 0.22, 0.21, 0.25, 0.23, 0.22, 0.24, 0.23, 0.22, 0.21, 0.24, 0.23, 0.22, 0.23, 0.22, 0.24, 0.23, 0.25, 0.24, 0.23, 0.22, 0.24]
  };

  const clickThroughRateData = {
    labels: ['Apr 22', 'Apr 25', 'Apr 28', 'May 1', 'May 4', 'May 7', 'May 10', 'May 13', 'May 16', 'May 19', 'May 22', 'May 25', 'May 28', 'Jun 1', 'Jun 4', 'Jun 7', 'Jun 10', 'Jun 13', 'Jun 16', 'Jun 19', 'Jun 22', 'Jun 25', 'Jun 28', 'Jul 1', 'Jul 4', 'Jul 7', 'Jul 10', 'Jul 13'],
    values: [0.042, 0.038, 0.051, 0.044, 0.039, 0.048, 0.043, 0.040, 0.037, 0.049, 0.044, 0.038, 0.047, 0.043, 0.039, 0.036, 0.048, 0.044, 0.040, 0.045, 0.041, 0.049, 0.043, 0.050, 0.046, 0.043, 0.039, 0.047]
  };

  const conversionRateData = {
    labels: ['Apr 22', 'Apr 25', 'Apr 28', 'May 1', 'May 4', 'May 7', 'May 10', 'May 13', 'May 16', 'May 19', 'May 22', 'May 25', 'May 28', 'Jun 1', 'Jun 4', 'Jun 7', 'Jun 10', 'Jun 13', 'Jun 16', 'Jun 19', 'Jun 22', 'Jun 25', 'Jun 28', 'Jul 1', 'Jul 4', 'Jul 7', 'Jul 10', 'Jul 13'],
    values: [0.028, 0.025, 0.035, 0.030, 0.026, 0.033, 0.029, 0.027, 0.024, 0.034, 0.030, 0.025, 0.032, 0.029, 0.026, 0.023, 0.033, 0.030, 0.027, 0.031, 0.028, 0.034, 0.029, 0.035, 0.032, 0.029, 0.026, 0.033]
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeTab === 'root-cause-analysis' ? 'Root Cause Analysis' : 'Marketing Strategy'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'root-cause-analysis' 
              ? 'Identify and resolve business performance issues' 
              : 'Define and manage your overall marketing strategy and frameworks'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="professional-card p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('root-cause-analysis')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'root-cause-analysis'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Root Cause Analysis
            </button>
            <button
              onClick={() => setActiveTab('marketing-strategy')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'marketing-strategy'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Marketing Strategy
            </button>
          </div>
        </div>

        {/* Multi-Select Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MultiSelectFilter
              label="Year"
              options={filters?.years || []}
              selectedValues={selectedYears}
              onChange={setSelectedYears}
              placeholder="All Years"
            />
            <MultiSelectFilter
              label="Month"
              options={filters?.months || []}
              selectedValues={selectedMonths}
              onChange={setSelectedMonths}
              placeholder="All Months"
            />
            <MultiSelectFilter
              label="Business"
              options={filters?.businesses || []}
              selectedValues={selectedBusinesses}
              onChange={setSelectedBusinesses}
              placeholder="All Businesses"
            />
            <MultiSelectFilter
              label="Channel"
              options={filters?.channels || []}
              selectedValues={selectedChannels}
              onChange={setSelectedChannels}
              placeholder="All Channels"
            />
          </div>
        </div>

        {/* Issues Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Critical Issues</h3>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">3</p>
            <p className="text-sm text-red-600 mt-1">Require immediate attention</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Under Investigation</h3>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">5</p>
            <p className="text-sm text-amber-600 mt-1">Analysis in progress</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Resolved</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-sm text-green-600 mt-1">Successfully addressed</p>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Identified Issues</h2>
          
          {issues.map((issue) => {
            const Icon = issue.icon;
            return (
              <div
                key={issue.id}
                className="bg-white rounded-lg border p-6"
                style={{ borderColor: issue.color.border }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <Icon className="w-6 h-6" style={{ color: issue.color.icon }} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{issue.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {issue.severity.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        issue.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                        issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Root Cause</p>
                        <p className="text-sm text-gray-900">{issue.rootCause}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Impact</p>
                        <p className="text-sm font-semibold text-gray-900">{issue.impact}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-sm text-gray-900 capitalize">{issue.status}</p>
                      </div>
                    </div>

                    <div 
                      className="rounded-lg p-3"
                      style={{ background: '#fef3c7' }}
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#92400e' }}>
                            AI Recommendation:
                          </p>
                          <p className="text-xs" style={{ color: '#92400e' }}>
                            {issue.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Analysis Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Performance by Segment</h3>
          <div className="h-80">
            {businessData.length > 0 ? (
              <ChartComponent
                type="bar"
                data={{
                  labels: businessData.map(item => item.Business),
                  datasets: [
                    {
                      label: 'Revenue',
                      data: businessData.map(item => item.Revenue),
                      backgroundColor: '#3b82f6',
                      borderRadius: 6
                    },
                    {
                      label: 'Profit',
                      data: businessData.map(item => item.Gross_Profit),
                      backgroundColor: '#10b981',
                      borderRadius: 6
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true, position: 'top' } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (value) => '€' + formatNumber(value) }
                    }
                  }
                }}
              />
            ) : (
              <p className="text-center text-gray-500 py-8">No data available</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RootCauseAnalysis;
