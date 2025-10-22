import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  FolderKanban, Calendar, Users, TrendingUp, CheckCircle, 
  Clock, AlertCircle, Target, Plus, Lightbulb, Play, Mail,
  Share2, Video, DollarSign, BarChart3, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Projects = () => {
  const [activeProjectTab, setActiveProjectTab] = useState('active');
  const [activePlannerTab, setActivePlannerTab] = useState('quarterly');
  const [activeCampaignTab, setActiveCampaignTab] = useState('recommended');

  // Top Projects Data
  const projects = {
    active: [
      {
        id: 1,
        name: 'Digital Transformation Initiative',
        description: 'Migrate legacy systems to cloud infrastructure',
        status: 'in-progress',
        priority: 'high',
        progress: 68,
        dueDate: '2025-12-15',
        assignee: 'Sarah Chen',
        team: 8,
        budget: '$450K',
        tasks: [
          { id: 1, name: 'Requirements Analysis', status: 'completed' },
          { id: 2, name: 'System Architecture Design', status: 'completed' },
          { id: 3, name: 'Data Migration Planning', status: 'in-progress' },
          { id: 4, name: 'Testing & QA', status: 'pending' }
        ],
        aiRecommendations: [
          'Allocate 2 additional developers for faster completion',
          'Schedule security audit before go-live',
          'Consider phased rollout approach'
        ]
      },
      {
        id: 2,
        name: 'Customer Experience Enhancement',
        description: 'Redesign customer portal and mobile app',
        status: 'in-progress',
        priority: 'high',
        progress: 82,
        dueDate: '2025-11-30',
        assignee: 'Michael Rodriguez',
        team: 6,
        budget: '$320K',
        tasks: [
          { id: 1, name: 'User Research', status: 'completed' },
          { id: 2, name: 'UI/UX Design', status: 'completed' },
          { id: 3, name: 'Frontend Development', status: 'in-progress' },
          { id: 4, name: 'User Testing', status: 'in-progress' }
        ],
        aiRecommendations: [
          'Schedule user testing sessions next week',
          'Implement A/B testing for key features',
          'On track for early completion'
        ]
      },
      {
        id: 3,
        name: 'Market Expansion - Asia Pacific',
        description: 'Launch operations in 5 new markets',
        status: 'planning',
        priority: 'medium',
        progress: 35,
        dueDate: '2026-03-31',
        assignee: 'Emily Watson',
        team: 12,
        budget: '$1.2M',
        tasks: [
          { id: 1, name: 'Market Research', status: 'completed' },
          { id: 2, name: 'Regulatory Compliance', status: 'in-progress' },
          { id: 3, name: 'Partner Identification', status: 'in-progress' },
          { id: 4, name: 'Launch Planning', status: 'pending' }
        ],
        aiRecommendations: [
          'Prioritize Japan and Singapore markets first',
          'Engage local consulting partners',
          'Budget additional 15% for compliance costs'
        ]
      }
    ],
    completed: [
      {
        id: 4,
        name: 'Q3 Sales Optimization',
        description: 'Implement new sales automation tools',
        status: 'completed',
        priority: 'high',
        progress: 100,
        dueDate: '2025-09-30',
        assignee: 'David Kim',
        team: 5,
        budget: '$180K',
        completedDate: '2025-09-28',
        outcome: '23% increase in sales efficiency'
      }
    ]
  };

  // Business Planner Data
  const businessPlanner = {
    quarterly: [
      {
        id: 1,
        quarter: 'Q4 2025',
        objectives: [
          {
            id: 1,
            title: 'Revenue Target: $28M',
            progress: 67,
            status: 'on-track',
            initiatives: ['New Product Launch', 'Channel Expansion', 'Price Optimization']
          },
          {
            id: 2,
            title: 'Customer Acquisition: 500 New Clients',
            progress: 74,
            status: 'ahead',
            initiatives: ['Marketing Campaign', 'Partnership Program', 'Referral System']
          },
          {
            id: 3,
            title: 'Operational Efficiency: 15% Cost Reduction',
            progress: 45,
            status: 'at-risk',
            initiatives: ['Process Automation', 'Vendor Renegotiation', 'Resource Optimization']
          }
        ],
        keyMetrics: {
          revenue: '$18.8M',
          growth: '+12.3%',
          customers: 370,
          satisfaction: '92%'
        }
      }
    ],
    annual: [
      {
        id: 1,
        year: '2025',
        themes: ['Digital Transformation', 'Market Expansion', 'Customer Excellence'],
        goals: [
          {
            id: 1,
            title: 'Achieve $100M ARR',
            progress: 68,
            target: '$100M',
            current: '$68M'
          },
          {
            id: 2,
            title: 'Enter 3 New Markets',
            progress: 33,
            target: '3 markets',
            current: '1 market'
          },
          {
            id: 3,
            title: 'Launch 5 New Products',
            progress: 80,
            target: '5 products',
            current: '4 products'
          }
        ]
      }
    ]
  };

  // Campaign Cockpit Data
  const campaigns = {
    recommended: [
      {
        id: 1,
        name: 'Holiday Season Mega Sale',
        description: 'Comprehensive holiday campaign with multi-channel approach',
        aiScore: 94,
        budget: '$250K',
        expectedROI: '520%',
        expectedRevenue: '$1.3M',
        duration: '45 days',
        channels: ['Email', 'Social Media', 'Video', 'Display Ads'],
        targetAudience: 'Existing customers + high-intent prospects',
        keyInsights: [
          'Historical data shows 3.5x higher conversion during holidays',
          'Video ads drive 2x engagement compared to static content',
          'Email campaigns have 42% open rate in this segment'
        ],
        aiRecommendation: 'HIGHLY RECOMMENDED - Launch immediately for maximum impact. Allocate 40% budget to video content.'
      },
      {
        id: 2,
        name: 'Product Launch - Enterprise Suite Pro',
        description: 'Targeted B2B campaign for new enterprise product line',
        aiScore: 89,
        budget: '$180K',
        expectedROI: '380%',
        expectedRevenue: '$684K',
        duration: '60 days',
        channels: ['LinkedIn', 'Webinars', 'Email', 'PR'],
        targetAudience: 'Enterprise decision makers, IT directors',
        keyInsights: [
          'Enterprise buyers prefer thought leadership content',
          'Webinars have 67% conversion rate to demo requests',
          'Case studies increase close rate by 45%'
        ],
        aiRecommendation: 'STRONG OPPORTUNITY - Coordinate with product team for beta testimonials.'
      },
      {
        id: 3,
        name: 'Customer Retention Program',
        description: 'Loyalty rewards and engagement campaign',
        aiScore: 86,
        budget: '$120K',
        expectedROI: '410%',
        expectedRevenue: '$492K',
        duration: '90 days',
        channels: ['Email', 'In-App', 'SMS'],
        targetAudience: 'Active customers at risk of churn',
        keyInsights: [
          'Identified 245 at-risk customers worth $2.1M ARR',
          'Personalized offers increase retention by 34%',
          'Early intervention reduces churn by 56%'
        ],
        aiRecommendation: 'CRITICAL PRIORITY - High-value customer retention opportunity.'
      }
    ],
    active: [
      {
        id: 4,
        name: 'Q4 Brand Awareness Drive',
        status: 'live',
        daysRemaining: 23,
        spent: '$67K',
        budget: '$150K',
        leads: 1847,
        conversions: 234,
        roi: '287%'
      }
    ]
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: CheckCircle },
      'in-progress': { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a', icon: Clock },
      'planning': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: Calendar },
      'pending': { bg: '#f3f4f6', border: '#9ca3af', text: '#374151', icon: Clock },
      'on-track': { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: TrendingUp },
      'ahead': { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a', icon: Zap },
      'at-risk': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: AlertCircle }
    };
    return colors[status] || colors['pending'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': { bg: '#fee2e2', text: '#991b1b' },
      'medium': { bg: '#fef3c7', text: '#92400e' },
      'low': { bg: '#d1fae5', text: '#065f46' }
    };
    return colors[priority] || colors['medium'];
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Hub</h1>
          <p className="text-gray-600">Strategic initiatives, business planning, and campaign management</p>
        </div>

        {/* Section 1: Top Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-blue-600" />
              Top Projects
            </h2>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Project Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'active', label: 'Active Projects', count: projects.active.length },
              { key: 'completed', label: 'Completed', count: projects.completed.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveProjectTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeProjectTab === tab.key
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Project Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects[activeProjectTab].map(project => {
              const statusInfo = getStatusColor(project.status);
              const StatusIcon = statusInfo.icon;
              const priorityInfo = getPriorityColor(project.priority);

              return (
                <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 rounded-full text-xs font-semibold" 
                         style={{ background: statusInfo.bg, color: statusInfo.text }}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {project.status.replace('-', ' ')}
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold" 
                         style={{ background: priorityInfo.bg, color: priorityInfo.text }}>
                      {project.priority} priority
                    </div>
                  </div>

                  {project.status !== 'completed' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-semibold text-gray-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${project.progress}%`,
                            background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Due Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(project.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Team</p>
                        <p className="text-sm font-medium text-gray-900">
                          {project.assignee} +{project.team}
                        </p>
                      </div>
                    </div>
                  </div>

                  {project.tasks && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Tasks ({project.tasks.filter(t => t.status === 'completed').length}/{project.tasks.length})
                      </p>
                      <div className="space-y-2">
                        {project.tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 text-xs">
                            <CheckCircle className={`w-4 h-4 ${
                              task.status === 'completed' ? 'text-green-600' :
                              task.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <span className={task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}>
                              {task.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.aiRecommendations && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-semibold text-amber-900">AI Recommendations</p>
                      </div>
                      <ul className="space-y-1">
                        {project.aiRecommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.outcome && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-900 mb-1">Project Outcome</p>
                      <p className="text-sm text-green-800">{project.outcome}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Business Planner */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-green-600" />
              Business Planner
            </h2>
          </div>

          {/* Planner Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'quarterly', label: 'Quarterly Goals' },
              { key: 'annual', label: 'Annual Strategy' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActivePlannerTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activePlannerTab === tab.key
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activePlannerTab === 'quarterly' && (
            <div className="space-y-4">
              {businessPlanner.quarterly.map(quarter => (
                <div key={quarter.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{quarter.quarter} Objectives</h3>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-bold text-gray-900">{quarter.keyMetrics.revenue}</p>
                        <p className="text-green-600 text-xs">{quarter.keyMetrics.growth}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Customers</p>
                        <p className="font-bold text-gray-900">{quarter.keyMetrics.customers}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Satisfaction</p>
                        <p className="font-bold text-gray-900">{quarter.keyMetrics.satisfaction}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {quarter.objectives.map(obj => {
                      const statusInfo = getStatusColor(obj.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div key={obj.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{obj.title}</h4>
                            <div className="px-3 py-1 rounded-full text-xs font-semibold"
                                 style={{ background: statusInfo.bg, color: statusInfo.text }}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {obj.status.replace('-', ' ')}
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Progress</span>
                              <span className="text-xs font-semibold text-gray-900">{obj.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${obj.progress}%`,
                                  background: obj.status === 'ahead' ? '#10b981' : 
                                             obj.status === 'at-risk' ? '#ef4444' : '#3b82f6'
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-2">Key Initiatives:</p>
                            <div className="flex flex-wrap gap-2">
                              {obj.initiatives.map((initiative, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {initiative}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePlannerTab === 'annual' && (
            <div className="space-y-4">
              {businessPlanner.annual.map(year => (
                <div key={year.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{year.year} Strategic Goals</h3>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Strategic Themes:</p>
                    <div className="flex gap-2">
                      {year.themes.map((theme, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-900 rounded-lg text-sm font-medium">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {year.goals.map(goal => (
                      <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{goal.current}</p>
                            <p className="text-xs text-gray-500">of {goal.target}</p>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Annual Progress</span>
                            <span className="text-xs font-semibold text-gray-900">{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Campaign Cockpit */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-orange-600" />
              Campaign Cockpit
            </h2>
          </div>

          {/* Campaign Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'recommended', label: 'AI Recommended', count: campaigns.recommended.length },
              { key: 'active', label: 'Active', count: campaigns.active.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveCampaignTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeCampaignTab === tab.key
                    ? 'bg-orange-100 text-orange-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Campaign Cards */}
          <div className="grid grid-cols-1 gap-4">
            {activeCampaignTab === 'recommended' && campaigns.recommended.map(campaign => (
              <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-orange-600">{campaign.aiScore}%</span>
                      <span className="text-xs text-gray-500">AI Score</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Budget</p>
                    <p className="font-semibold text-gray-900">{campaign.budget}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expected ROI</p>
                    <p className="font-semibold text-green-600">{campaign.expectedROI}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expected Revenue</p>
                    <p className="font-semibold text-gray-900">{campaign.expectedRevenue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">{campaign.duration}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Channels:</p>
                  <div className="flex items-center gap-2">
                    {campaign.channels.map((channel, idx) => {
                      const channelIcons = {
                        'Email': Mail,
                        'Social Media': Share2,
                        'Video': Video,
                        'Display Ads': Target,
                        'LinkedIn': Share2,
                        'Webinars': Video,
                        'PR': Share2,
                        'In-App': Target,
                        'SMS': Mail
                      };
                      const ChannelIcon = channelIcons[channel] || Target;
                      return (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                          <ChannelIcon className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">{channel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Key Insights:</p>
                  <ul className="space-y-1">
                    {campaign.keyInsights.map((insight, idx) => (
                      <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200 mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 mb-1">AI Recommendation:</p>
                      <p className="text-xs text-amber-800">{campaign.aiRecommendation}</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Activate Campaign
                </Button>
              </div>
            ))}

            {activeCampaignTab === 'active' && campaigns.active.map(campaign => (
              <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        LIVE
                      </span>
                      <span className="text-sm text-gray-600">{campaign.daysRemaining} days remaining</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{campaign.roi}</p>
                    <p className="text-xs text-gray-500">Current ROI</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Budget</p>
                    <p className="font-semibold text-gray-900">{campaign.budget}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Spent</p>
                    <p className="font-semibold text-orange-600">{campaign.spent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Leads</p>
                    <p className="font-semibold text-gray-900">{campaign.leads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Conversions</p>
                    <p className="font-semibold text-green-600">{campaign.conversions}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Budget Utilization</span>
                    <span className="text-xs font-semibold text-gray-900">44.7%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-orange-500" style={{ width: '44.7%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
