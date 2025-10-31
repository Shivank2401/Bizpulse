import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/formatters';
import {
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Sparkles,
  MoreVertical,
  Users as UsersIcon,
  Zap,
  CheckCircle,
  Clock,
  Mail,
  Share2,
  Video,
  Tag as TagIcon,
  Award,
  Flag,
  BarChart3,
  ArrowUpRight,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const Kanban = () => {
  // Check if we need to navigate to a specific tab (from Cockpit insights)
  const initialTab = sessionStorage.getItem('kanbanActiveTab') || 'strategic-kanban';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Clear the session storage after reading
  React.useEffect(() => {
    sessionStorage.removeItem('kanbanActiveTab');
  }, []);
  const [initiatives, setInitiatives] = useState({
    recommended: [
      {
        id: 1,
        title: 'New Customer Acquisition - Lookalikes',
        description: 'Leverage high-value customer data to create lookalike audiences across Meta and Google platforms. Focus on demographics and behaviors that mirror our best customers.',
        type: 'system',
        category: 'acquisition',
        startDate: '2025-01-20',
        endDate: '2025-03-20',
        budget: 95000,
        impact: { value: 312500, percentage: 12.5 },
        reasoning: 'Historical data shows lookalike audiences from top 10% customers drive 3.2x higher conversion rates. Recommended budget allocation based on projected CAC of $45 and expected 2,100 new customers.',
        channels: ['Meta Ads', 'Google Ads'],
        aiScore: 94
      },
      {
        id: 2,
        title: 'Cross-Sell Product Bundles',
        description: 'AI-driven product recommendations for existing customers based on purchase history and browsing behavior. Focus on complementary products with higher margins.',
        type: 'system',
        category: 'retention',
        startDate: '2025-01-25',
        endDate: '2025-03-25',
        budget: 78000,
        impact: { value: 245000, percentage: 15.8 },
        reasoning: 'Purchase pattern analysis reveals 62% of customers who bought Category A also viewed Category B within 30 days. Targeting this cohort with personalized bundles shows 41% increase in AOV.',
        channels: ['Email', 'In-App'],
        aiScore: 91
      },
      {
        id: 3,
        title: 'Social Media Influence Campaign',
        description: 'Partner with micro-influencers in relevant niches to drive brand awareness and acquisition. Focus on authentic content and user-generated reviews.',
        type: 'system',
        category: 'acquisition',
        startDate: '2025-02-01',
        endDate: '2025-04-30',
        budget: 125000,
        impact: { value: 420000, percentage: 18.2 },
        reasoning: 'Influencer partnerships in Q4 2024 showed 5.8x ROI with micro-influencers (10k-50k followers) vs traditional advertising. Engagement rates 3x higher than brand content.',
        channels: ['Social Media', 'Video', 'Influencer'],
        aiScore: 88
      },
      {
        id: 4,
        title: 'Win-Back Email Sequence',
        description: 'Automated email campaign targeting churned customers from the last 90 days with personalized offers and product recommendations.',
        type: 'system',
        category: 'retention',
        startDate: '2025-01-15',
        endDate: '2025-02-28',
        budget: 42000,
        impact: { value: 185000, percentage: 22.5 },
        reasoning: 'Analysis of 3,200 churned customers shows 28% can be reactivated within 90 days with right incentive. Personalized win-back campaigns show 3.5x higher response vs generic offers.',
        channels: ['Email', 'SMS'],
        aiScore: 86
      }
    ],
    live: [
      {
        id: 5,
        title: 'Welcome Nudge',
        type: 'custom',
        category: 'retention',
        startDate: '2024-07-10',
        endDate: null,
        budget: 31250,
        impact: { value: 312500, percentage: 12.5 },
        status: 'running',
        progress: 68,
        channels: ['Email', 'Push Notification']
      },
      {
        id: 6,
        title: 'VIP Experience',
        type: 'custom',
        category: 'retention',
        startDate: '2024-07-10',
        endDate: null,
        budget: 9100,
        impact: { value: 91000, percentage: 10.2 },
        status: 'running',
        progress: 82,
        channels: ['Email', 'In-App']
      },
      {
        id: 7,
        title: 'Mobile App Push',
        type: 'custom',
        category: 'retention',
        startDate: '2024-07-10',
        endDate: null,
        budget: 15600,
        impact: { value: 156000, percentage: 8.9 },
        status: 'running',
        progress: 55,
        channels: ['Push Notification', 'In-App']
      }
    ]
  });

  const [showReasoning, setShowReasoning] = useState(null);

  // Goals Management Data
  const [goals, setGoals] = useState({
    quarters: [
      {
        id: 1,
        quarter: 'Q1 2026',
        period: 'Jan - Mar 2026',
        status: 'active',
        objectives: [
          {
            id: 1,
            title: 'Increase Customer Acquisition',
            description: 'Drive 30% growth in new customer acquisition through digital channels',
            owner: 'Marketing Team',
            progress: 72,
            status: 'on-track',
            targetValue: 5000,
            currentValue: 3600,
            metric: 'customers',
            keyResults: [
              { id: 1, description: 'Launch 3 new acquisition campaigns', progress: 100, target: 3, current: 3 },
              { id: 2, description: 'Achieve 15% conversion rate on landing pages', progress: 80, target: 15, current: 12 },
              { id: 3, description: 'Reduce CAC by 20%', progress: 45, target: 20, current: 9 }
            ]
          },
          {
            id: 2,
            title: 'Improve Customer Retention',
            description: 'Increase retention rate from 85% to 92% through engagement programs',
            owner: 'Customer Success',
            progress: 58,
            status: 'at-risk',
            targetValue: 92,
            currentValue: 88,
            metric: '% retention',
            keyResults: [
              { id: 1, description: 'Implement loyalty program with 50% enrollment', progress: 65, target: 50, current: 32.5 },
              { id: 2, description: 'Reduce churn rate to 8%', progress: 50, target: 8, current: 12 },
              { id: 3, description: 'Achieve NPS score of 70+', progress: 60, target: 70, current: 62 }
            ]
          },
          {
            id: 3,
            title: 'Expand Product Revenue',
            description: 'Grow product revenue by 40% through upselling and cross-selling',
            owner: 'Sales Team',
            progress: 85,
            status: 'on-track',
            targetValue: 8500000,
            currentValue: 7225000,
            metric: '$ revenue',
            keyResults: [
              { id: 1, description: 'Increase average order value by 25%', progress: 90, target: 25, current: 22.5 },
              { id: 2, description: 'Cross-sell to 40% of existing customers', progress: 82, target: 40, current: 33 },
              { id: 3, description: 'Launch 2 premium product tiers', progress: 100, target: 2, current: 2 }
            ]
          }
        ]
      },
      {
        id: 2,
        quarter: 'Q2 2025',
        period: 'Apr - Jun 2025',
        status: 'upcoming',
        objectives: [
          {
            id: 4,
            title: 'Launch International Expansion',
            description: 'Enter 3 new international markets with localized offerings',
            owner: 'Business Development',
            progress: 15,
            status: 'planning',
            targetValue: 3,
            currentValue: 0,
            metric: 'markets',
            keyResults: [
              { id: 1, description: 'Complete market research for 5 countries', progress: 60, target: 5, current: 3 },
              { id: 2, description: 'Establish partnerships in 3 markets', progress: 0, target: 3, current: 0 },
              { id: 3, description: 'Localize platform for 3 languages', progress: 0, target: 3, current: 0 }
            ]
          },
          {
            id: 5,
            title: 'Optimize Operational Efficiency',
            description: 'Reduce operational costs by 15% through automation',
            owner: 'Operations Team',
            progress: 8,
            status: 'planning',
            targetValue: 15,
            currentValue: 0,
            metric: '% reduction',
            keyResults: [
              { id: 1, description: 'Automate 50% of manual processes', progress: 10, target: 50, current: 5 },
              { id: 2, description: 'Reduce support ticket resolution time by 30%', progress: 5, target: 30, current: 1.5 },
              { id: 3, description: 'Implement AI-powered analytics', progress: 0, target: 1, current: 0 }
            ]
          }
        ]
      }
    ]
  });

  const [selectedQuarter, setSelectedQuarter] = useState(goals.quarters[0]);

  // Calculate KPIs
  const totalRecommended = initiatives.recommended.length;
  const totalLive = initiatives.live.length;
  const systemRecommended = initiatives.recommended.filter(i => i.type === 'system').length;
  const customRecommended = initiatives.recommended.filter(i => i.type === 'custom').length;
  const systemLive = initiatives.live.filter(i => i.type === 'system').length;
  const customLive = initiatives.live.filter(i => i.type === 'custom').length;
  
  const totalImpact = initiatives.live.reduce((sum, i) => sum + i.impact.value, 0);
  const avgUplift = initiatives.live.reduce((sum, i) => sum + i.impact.percentage, 0) / initiatives.live.length;
  
  const annualGoal = { current: 65.2, target: 70, metric: '% Activated Customers' };
  const goalProgress = (annualGoal.current / annualGoal.target) * 100;

  const handleAccept = (initiative) => {
    // Move from recommended to live
    setInitiatives(prev => ({
      recommended: prev.recommended.filter(i => i.id !== initiative.id),
      live: [
        ...prev.live,
        {
          ...initiative,
          status: 'running',
          progress: 0,
          startDate: new Date().toISOString().split('T')[0]
        }
      ]
    }));
    toast.success(`Initiative "${initiative.title}" activated successfully!`);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'acquisition': return { bg: '#dbeafe', text: '#1e40af', label: 'Acquisition' };
      case 'retention': return { bg: '#d1fae5', text: '#059669', label: 'Retention' };
      case 'engagement': return { bg: '#fef3c7', text: '#d97706', label: 'Engagement' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: category };
    }
  };

  const getTypeColor = (type) => {
    return type === 'system' 
      ? { bg: '#e0e7ff', text: '#4f46e5', icon: Sparkles }
      : { bg: '#fce7f3', text: '#9f1239', icon: UsersIcon };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {activeTab === 'strategic-kanban' ? 'Strategic Kanban' : 'Goals Management'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {activeTab === 'strategic-kanban' 
                ? 'Manage strategic initiatives and marketing projects'
                : 'Track and manage organizational goals and OKRs'}
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'strategic-kanban' ? 'New Initiative' : 'New Goal'}
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="professional-card p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('strategic-kanban')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'strategic-kanban'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              Strategic Kanban
            </button>
            <button
              onClick={() => setActiveTab('goals-management')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'goals-management'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Target className="w-4 h-4" />
              Goals Management
            </button>
          </div>
        </div>

        {/* Strategic Kanban Content */}
        {activeTab === 'strategic-kanban' && (
          <>
            {/* KPI Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Annual Goal */}
          <div className="professional-card p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-semibold text-gray-700">Annual Goal</p>
            </div>
            <div className="mb-2">
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                {annualGoal.current}/{annualGoal.target}
              </h2>
              <p className="text-xs text-gray-600 mt-1">{annualGoal.metric} • {goalProgress.toFixed(0)}% complete</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${goalProgress}%`,
                  background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)'
                }}
              />
            </div>
          </div>

          {/* Pending Recommendations */}
          <div className="professional-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Pending Recommendations</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {totalRecommended}
            </h2>
            <div className="flex gap-3 text-xs text-gray-600">
              <span>System: {systemRecommended}</span>
              <span>Custom: {customRecommended}</span>
            </div>
          </div>

          {/* Live Campaigns */}
          <div className="professional-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-gray-700">Live Campaigns</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {totalLive}
            </h2>
            <div className="flex gap-3 text-xs text-gray-600">
              <span>System: {systemLive}</span>
              <span>Custom: {customLive}</span>
            </div>
          </div>

          {/* Impact Delivered */}
          <div className="professional-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">Impact Delivered</p>
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              ${formatNumber(totalImpact / 1000)}K
            </h2>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-semibold">{avgUplift.toFixed(1)}% avg uplift</span>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommended Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                  RECOMMENDED
                </h3>
                <span className="text-sm text-gray-500">({totalRecommended})</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {initiatives.recommended.map((initiative) => {
                const categoryInfo = getCategoryColor(initiative.category);
                const typeInfo = getTypeColor(initiative.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <div key={initiative.id} className="professional-card p-5 hover:shadow-lg transition-shadow">
                    {/* Header */}
                    <div className="mb-3">
                      <h4 className="text-base font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                        {initiative.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {initiative.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{ background: typeInfo.bg, color: typeInfo.text }}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {initiative.type}
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: categoryInfo.bg, color: categoryInfo.text }}
                      >
                        {categoryInfo.label}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span className="font-semibold text-amber-600">{initiative.aiScore}% AI Score</span>
                      </div>
                    </div>

                    {/* Date & Budget */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(initiative.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {initiative.endDate && ` - ${new Date(initiative.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">${formatNumber(initiative.budget)}</span>
                      </div>
                    </div>

                    {/* Expected Impact */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700 font-semibold">Expected Impact</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-900">
                            ${formatNumber(initiative.impact.value / 1000)}K
                          </span>
                          <span className="text-xs text-green-700">• {initiative.impact.percentage}% uplift</span>
                        </div>
                      </div>
                    </div>

                    {/* Reasoning Section */}
                    {showReasoning === initiative.id && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-blue-900 mb-1">AI Reasoning:</p>
                            <p className="text-xs text-blue-800 leading-relaxed">{initiative.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Channels */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {initiative.channels.map((channel, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 flex items-center gap-1"
                        >
                          {channel === 'Email' && <Mail className="w-3 h-3" />}
                          {channel === 'Social Media' && <Share2 className="w-3 h-3" />}
                          {channel === 'Video' && <Video className="w-3 h-3" />}
                          {channel}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReasoning(showReasoning === initiative.id ? null : initiative.id)}
                        className="flex-1 text-gray-700 border-gray-300"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Reasoning
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(initiative)}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                  LIVE
                </h3>
                <span className="text-sm text-gray-500">({totalLive})</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {initiatives.live.map((initiative) => {
                const categoryInfo = getCategoryColor(initiative.category);
                const typeInfo = getTypeColor(initiative.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <div key={initiative.id} className="professional-card p-5 hover:shadow-lg transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900 flex-1" style={{ fontFamily: 'Space Grotesk' }}>
                        {initiative.title}
                      </h4>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{ background: typeInfo.bg, color: typeInfo.text }}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {initiative.type}
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: categoryInfo.bg, color: categoryInfo.text }}
                      >
                        {categoryInfo.label}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(initiative.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {initiative.endDate ? ` - ${new Date(initiative.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ' - None'}
                      </span>
                    </div>

                    {/* Impact */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700 font-semibold">Current Impact</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-900">
                            ${formatNumber(initiative.impact.value / 1000)}K
                          </span>
                          <span className="text-xs text-green-700">• {initiative.impact.percentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-semibold text-gray-900">{initiative.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${initiative.progress}%`,
                            background: initiative.progress >= 75 
                              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                              : initiative.progress >= 50
                              ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                              : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Channels */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {initiative.channels.map((channel, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 flex items-center gap-1"
                        >
                          {channel === 'Email' && <Mail className="w-3 h-3" />}
                          {channel === 'Push Notification' && <Zap className="w-3 h-3" />}
                          {channel === 'In-App' && <TagIcon className="w-3 h-3" />}
                          {channel}
                        </span>
                      ))}
                    </div>

                    {/* Timeline Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-gray-700 border-gray-300"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Timeline
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Goals Management Content */}
        {activeTab === 'goals-management' && (
          <>
            {/* Quarter Selector */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {goals.quarters.map((quarter) => (
                <button
                  key={quarter.id}
                  onClick={() => setSelectedQuarter(quarter)}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    selectedQuarter.id === quarter.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {quarter.quarter}
                  <span className="block text-xs mt-0.5 opacity-90">{quarter.period}</span>
                </button>
              ))}
            </div>

            {/* Goals Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="professional-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Total Objectives</p>
                </div>
                <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                  {selectedQuarter.objectives.length}
                </h2>
                <p className="text-xs text-gray-600 mt-1">{selectedQuarter.quarter}</p>
              </div>

              <div className="professional-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">On Track</p>
                </div>
                <h2 className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk' }}>
                  {selectedQuarter.objectives.filter(o => o.status === 'on-track').length}
                </h2>
                <p className="text-xs text-gray-600 mt-1">Meeting targets</p>
              </div>

              <div className="professional-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm font-semibold text-gray-700">At Risk</p>
                </div>
                <h2 className="text-3xl font-bold text-amber-600" style={{ fontFamily: 'Space Grotesk' }}>
                  {selectedQuarter.objectives.filter(o => o.status === 'at-risk').length}
                </h2>
                <p className="text-xs text-gray-600 mt-1">Needs attention</p>
              </div>

              <div className="professional-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-semibold text-gray-700">Avg Progress</p>
                </div>
                <h2 className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk' }}>
                  {Math.round(selectedQuarter.objectives.reduce((sum, o) => sum + o.progress, 0) / selectedQuarter.objectives.length)}%
                </h2>
                <p className="text-xs text-gray-600 mt-1">Overall completion</p>
              </div>
            </div>

            {/* Objectives List */}
            <div className="space-y-6">
              {selectedQuarter.objectives.map((objective) => {
                const statusColors = {
                  'on-track': { bg: '#d1fae5', text: '#059669', border: '#10b981' },
                  'at-risk': { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
                  'delayed': { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
                  'planning': { bg: '#e0e7ff', text: '#4f46e5', border: '#6366f1' }
                };
                const statusInfo = statusColors[objective.status];

                return (
                  <div 
                    key={objective.id} 
                    className="professional-card p-6 border-l-4"
                    style={{ borderLeftColor: statusInfo.border }}
                  >
                    {/* Objective Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                            {objective.title}
                          </h3>
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: statusInfo.bg, color: statusInfo.text }}
                          >
                            {objective.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{objective.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{objective.owner}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flag className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              {objective.currentValue} / {objective.targetValue} {objective.metric}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-gray-900">{objective.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${objective.progress}%`,
                            background: objective.progress >= 75 
                              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                              : objective.progress >= 50
                              ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                              : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Key Results */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Key Results ({objective.keyResults.length})
                      </h4>
                      <div className="space-y-3">
                        {objective.keyResults.map((kr) => (
                          <div key={kr.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm text-gray-900 flex-1">{kr.description}</p>
                              <span className="text-sm font-semibold text-gray-900 ml-4">{kr.progress}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${kr.progress}%`,
                                      background: kr.progress >= 75 
                                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                        : kr.progress >= 50
                                        ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                                        : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {kr.current} / {kr.target}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-300"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300"
                      >
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Kanban;
