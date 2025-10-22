import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChartComponent from '@/components/ChartComponent';
import InsightModal from '@/components/InsightModal';
import { formatNumber } from '@/utils/formatters';
import staticData from '@/data/staticData';
import { Button } from '@/components/ui/button';
import { 
  FolderKanban, Plus, CheckCircle2, Clock, AlertCircle, AlertTriangle,
  Sparkles, Calendar, Users, Target, TrendingUp, DollarSign, Package,
  BarChart3, Lightbulb, Zap, Activity, ArrowUpRight
} from 'lucide-react';

const ProjectsNew = () => {
  const [activeSection, setActiveSection] = useState('top-projects');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightModal, setInsightModal] = useState({ isOpen: false, chartTitle: '' });

  useEffect(() => {
    // Load static data
    setData(staticData.projectsData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', text: '#059669', icon: CheckCircle2 };
      case 'on-track': return { bg: '#dbeafe', text: '#2563eb', icon: Clock };
      case 'at-risk': return { bg: '#fef3c7', text: '#d97706', icon: AlertCircle };
      case 'delayed': return { bg: '#fee2e2', text: '#dc2626', icon: AlertTriangle };
      case 'active': return { bg: '#d1fae5', text: '#059669', icon: Activity };
      case 'planning': return { bg: '#e0e7ff', text: '#4f46e5', icon: Lightbulb };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: Clock };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return { bg: '#fee2e2', text: '#dc2626' };
      case 'high': return { bg: '#fed7aa', text: '#ea580c' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706' };
      case 'low': return { bg: '#dbeafe', text: '#2563eb' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  // ============ TOP PROJECTS SECTION ============
  const TopProjectsSection = () => {
    const projects = data.topProjects || [];
    
    // Prepare chart data
    const projectBudgetData = projects.slice(0, 6).map(p => ({
      name: p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name,
      Budget: p.budget / 1000,
      Spent: p.spent / 1000,
      Remaining: (p.budget - p.spent) / 1000
    }));

    const projectROIData = projects.filter(p => p.expectedROI).slice(0, 6).map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      'Expected ROI': p.expectedROI,
      'Actual ROI': p.actualROI || 0
    }));

    const projectProgressData = projects.slice(0, 6).map(p => ({
      name: p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name,
      Progress: p.progress
    }));

    const statusDistribution = projects.reduce((acc, p) => {
      const status = p.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.keys(statusDistribution).map(status => ({
      status: status.replace('-', ' ').toUpperCase(),
      count: statusDistribution[status]
    }));

    // Summary metrics
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length;
    const onTrackProjects = projects.filter(p => p.status === 'on-track' || p.status === 'completed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return (
      <div className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderKanban className="w-5 h-5 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Projects</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {projects.length}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{completedProjects} completed</p>
          </div>

          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Budget</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              ${formatNumber(totalBudget / 1000000)}M
            </h3>
            <p className="text-xs text-gray-500 mt-1">${formatNumber(totalSpent / 1000000)}M spent</p>
          </div>

          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Progress</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {avgProgress.toFixed(1)}%
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${avgProgress}%`,
                  background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)'
                }}
              />
            </div>
          </div>

          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">On Track</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {onTrackProjects}/{projects.length}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{((onTrackProjects / projects.length) * 100).toFixed(1)}% success rate</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Overview Chart */}
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Budget Overview (K$)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'Budget Overview' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="bar"
              data={{
                labels: projectBudgetData.map(d => d.name),
                datasets: [
                  {
                    label: 'Budget',
                    data: projectBudgetData.map(d => d.Budget),
                    backgroundColor: '#3b82f6'
                  },
                  {
                    label: 'Spent',
                    data: projectBudgetData.map(d => d.Spent),
                    backgroundColor: '#10b981'
                  },
                  {
                    label: 'Remaining',
                    data: projectBudgetData.map(d => d.Remaining),
                    backgroundColor: '#f59e0b'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'bottom' }
                }
              }}
              height={300}
            />
          </div>

          {/* Project Status Distribution */}
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Project Status Distribution
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'Project Status' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="doughnut"
              data={{
                labels: statusChartData.map(d => d.status),
                datasets: [{
                  data: statusChartData.map(d => d.count),
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'bottom' }
                }
              }}
              height={300}
            />
          </div>

          {/* ROI Comparison */}
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                ROI Analysis
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'ROI Analysis' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="bar"
              data={{
                labels: projectROIData.map(d => d.name),
                datasets: [
                  {
                    label: 'Expected ROI',
                    data: projectROIData.map(d => d['Expected ROI']),
                    backgroundColor: '#10b981'
                  },
                  {
                    label: 'Actual ROI',
                    data: projectROIData.map(d => d['Actual ROI']),
                    backgroundColor: '#3b82f6'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'bottom' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
              height={300}
            />
          </div>

          {/* Progress Tracker */}
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Project Progress (%)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'Progress Tracker' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="line"
              data={{
                labels: projectProgressData.map(d => d.name),
                datasets: [{
                  label: 'Progress',
                  data: projectProgressData.map(d => d.Progress),
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  tension: 0.4,
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true, max: 100 }
                }
              }}
              height={300}
            />
          </div>
        </div>

        {/* Project Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Active Projects
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============ BUSINESS PLANNER SECTION ============
  const BusinessPlannerSection = () => {
    const plans = data.businessPlans || [];
    
    if (plans.length === 0) return null;

    return (
      <div className="space-y-6">
        {plans.map(plan => (
          <div key={plan.id} className="professional-card p-6">
            {/* Plan Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  {plan.planName}
                </h3>
                <p className="text-sm text-gray-600">Period: {plan.period}</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600">
                <p className="text-xs text-white font-semibold">Expected Revenue</p>
                <p className="text-lg font-bold text-white">${formatNumber(plan.expectedRevenue / 1000000)}M</p>
              </div>
            </div>

            {/* Budget Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">Total Budget</p>
                <p className="text-xl font-bold text-blue-900">${formatNumber(plan.totalBudget / 1000000)}M</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-green-600 font-semibold mb-1">Allocated Budget</p>
                <p className="text-xl font-bold text-green-900">${formatNumber(plan.allocatedBudget / 1000000)}M</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600 font-semibold mb-1">Remaining Budget</p>
                <p className="text-xl font-bold text-amber-900">${formatNumber((plan.totalBudget - plan.allocatedBudget) / 1000000)}M</p>
              </div>
            </div>

            {/* Initiatives */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Strategic Initiatives</h4>
              <div className="space-y-3">
                {plan.initiatives.map((initiative, idx) => {
                  const priorityInfo = getPriorityColor(initiative.priority);
                  const statusInfo = getStatusColor(initiative.status);
                  
                  return (
                    <div key={idx} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-semibold text-gray-900">{initiative.name}</h5>
                        <div className="flex gap-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ background: priorityInfo.bg, color: priorityInfo.text }}
                          >
                            {initiative.priority}
                          </span>
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ background: statusInfo.bg, color: statusInfo.text }}
                          >
                            {initiative.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Budget: </span>
                          <span className="font-semibold text-gray-900">${formatNumber(initiative.budget / 1000)}K</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expected Revenue: </span>
                          <span className="font-semibold text-gray-900">${formatNumber(initiative.revenue / 1000)}K</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones Timeline */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Milestones</h4>
              <div className="space-y-3">
                {plan.milestones.map((milestone, idx) => {
                  const statusInfo = getStatusColor(milestone.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: statusInfo.bg }}
                        >
                          <StatusIcon className="w-5 h-5" style={{ color: statusInfo.text }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-sm font-semibold text-gray-900">{milestone.name}</h5>
                          <span className="text-xs text-gray-600">{milestone.date}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${milestone.progress}%`,
                              background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-semibold text-amber-900">AI Strategic Insights</h4>
              </div>
              <ul className="space-y-2">
                {plan.aiInsights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============ CAMPAIGN COCKPIT SECTION ============
  const CampaignCockpitSection = () => {
    const campaigns = data.campaigns || [];
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    
    // Summary metrics
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const avgROI = campaigns.filter(c => c.roi > 0).reduce((sum, c) => sum + c.roi, 0) / campaigns.filter(c => c.roi > 0).length;
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    // Chart data
    const campaignPerformanceData = campaigns.slice(0, 6).map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      Budget: c.budget / 1000,
      Revenue: c.revenue / 1000,
      ROI: c.roi
    }));

    const campaignROIData = campaigns.filter(c => c.roi > 0).slice(0, 6).map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      ROI: c.roi
    }));

    const conversionRateData = campaigns.filter(c => c.conversionRate > 0).slice(0, 6).map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      'Conversion Rate': c.conversionRate
    }));

    return (
      <div className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {activeCampaigns.length}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{campaigns.length} total campaigns</p>
          </div>

          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              ${formatNumber(totalRevenue / 1000000)}M
            </h3>
            <p className="text-xs text-gray-500 mt-1">${formatNumber(totalSpent / 1000)}K spent</p>
          </div>

          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg ROI</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {avgROI.toFixed(1)}x
            </h3>
            <p className="text-xs text-gray-500 mt-1">Return on investment</p>
          </div>

          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Leads</p>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              {formatNumber(totalLeads)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{formatNumber(totalConversions)} conversions</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Performance */}
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Campaign Performance (K$)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'Campaign Performance' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="bar"
              data={{
                labels: campaignPerformanceData.map(d => d.name),
                datasets: [
                  {
                    label: 'Budget',
                    data: campaignPerformanceData.map(d => d.Budget),
                    backgroundColor: '#3b82f6'
                  },
                  {
                    label: 'Revenue',
                    data: campaignPerformanceData.map(d => d.Revenue),
                    backgroundColor: '#10b981'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'bottom' }
                }
              }}
              height={300}
            />
          </div>

          {/* ROI by Campaign */}
          <div className="professional-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                ROI by Campaign
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'Campaign ROI' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="bar"
              data={{
                labels: campaignROIData.map(d => d.name),
                datasets: [{
                  label: 'ROI',
                  data: campaignROIData.map(d => d.ROI),
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
              height={300}
            />
          </div>

          {/* Conversion Rates */}
          <div className="professional-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                Conversion Rate Analysis (%)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInsightModal({ isOpen: true, chartTitle: 'Conversion Rate' })}
                className="text-amber-600 hover:text-amber-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Insights
              </Button>
            </div>
            <ChartComponent
              type="line"
              data={{
                labels: conversionRateData.map(d => d.name),
                datasets: [{
                  label: 'Conversion Rate (%)',
                  data: conversionRateData.map(d => d['Conversion Rate']),
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  tension: 0.4,
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
              height={300}
            />
          </div>
        </div>

        {/* Campaign Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Campaign Details
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {campaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} getStatusColor={getStatusColor} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              Projects & Planning
            </h1>
            <p className="text-gray-600 text-sm mt-1">Manage projects, strategic plans, and campaigns</p>
          </div>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Section Navigation */}
        <div className="professional-card p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSection('top-projects')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'top-projects'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FolderKanban className="w-4 h-4 inline mr-2" />
              Top Projects
            </button>
            <button
              onClick={() => setActiveSection('business-planner')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'business-planner'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Business Planner
            </button>
            <button
              onClick={() => setActiveSection('campaign-cockpit')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'campaign-cockpit'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Campaign Cockpit
            </button>
          </div>
        </div>

        {/* Active Section Content */}
        {activeSection === 'top-projects' && <TopProjectsSection />}
        {activeSection === 'business-planner' && <BusinessPlannerSection />}
        {activeSection === 'campaign-cockpit' && <CampaignCockpitSection />}

        {/* Insight Modal */}
        {insightModal.isOpen && (
          <InsightModal
            isOpen={insightModal.isOpen}
            onClose={() => setInsightModal({ isOpen: false, chartTitle: '' })}
            chartTitle={insightModal.chartTitle}
          />
        )}
      </div>
    </Layout>
  );
};

// ============ PROJECT CARD COMPONENT ============
const ProjectCard = ({ project, getStatusColor, getPriorityColor }) => {
  const statusInfo = getStatusColor(project.status);
  const StatusIcon = statusInfo.icon;
  const priorityInfo = getPriorityColor(project.priority);
  const budgetUtilization = (project.spent / project.budget) * 100;

  return (
    <div className="professional-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
            {project.name}
          </h4>
          <p className="text-xs text-gray-600">{project.category}</p>
        </div>
        <div className="flex gap-2">
          <div 
            className="px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            style={{ background: statusInfo.bg, color: statusInfo.text }}
          >
            <StatusIcon className="w-3 h-3" />
            {project.status.replace('-', ' ')}
          </div>
          <div 
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: priorityInfo.bg, color: priorityInfo.text }}
          >
            {project.priority}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-600 mb-0.5">Budget</p>
          <p className="text-sm font-semibold text-gray-900">${formatNumber(project.budget / 1000)}K</p>
          <p className="text-xs text-gray-500">${formatNumber(project.spent / 1000)}K spent</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-600 mb-0.5">Expected ROI</p>
          <p className="text-sm font-semibold text-gray-900">{project.expectedROI}x</p>
          {project.actualROI && (
            <p className="text-xs text-green-600">Actual: {project.actualROI}x</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-semibold text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${project.progress}%`,
              background: project.progress >= 75 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 
                         project.progress >= 50 ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' :
                         'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <p className="text-gray-600">Team</p>
          <p className="font-semibold text-gray-900">{project.teamSize}</p>
        </div>
        <div>
          <p className="text-gray-600">Milestones</p>
          <p className="font-semibold text-gray-900">{project.completedMilestones}/{project.milestones}</p>
        </div>
        <div>
          <p className="text-gray-600">End Date</p>
          <p className="font-semibold text-gray-900">{new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {Object.keys(project.keyMetrics).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">Key Impact Metrics</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(project.keyMetrics).map(([key, value]) => (
              <div key={key}>
                <p className="text-blue-600">{key.replace(/_/g, ' ')}</p>
                <p className="font-semibold text-blue-900">{typeof value === 'number' && value > 1000 ? formatNumber(value) : value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ CAMPAIGN CARD COMPONENT ============
const CampaignCard = ({ campaign, getStatusColor }) => {
  const statusInfo = getStatusColor(campaign.status);
  const StatusIcon = statusInfo.icon;
  const budgetUtilization = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

  return (
    <div className="professional-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
            {campaign.name}
          </h4>
          <p className="text-xs text-gray-600">{campaign.type}</p>
        </div>
        <div 
          className="px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
          style={{ background: statusInfo.bg, color: statusInfo.text }}
        >
          <StatusIcon className="w-3 h-3" />
          {campaign.status}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <p className="text-xs text-blue-600 mb-0.5">Budget</p>
          <p className="text-sm font-semibold text-blue-900">${formatNumber(campaign.budget / 1000)}K</p>
        </div>
        <div className="p-2 rounded-lg bg-green-50">
          <p className="text-xs text-green-600 mb-0.5">Revenue</p>
          <p className="text-sm font-semibold text-green-900">${formatNumber(campaign.revenue / 1000)}K</p>
        </div>
        <div className="p-2 rounded-lg bg-amber-50">
          <p className="text-xs text-amber-600 mb-0.5">ROI</p>
          <p className="text-sm font-semibold text-amber-900">{campaign.roi}x</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <p className="text-gray-600 mb-0.5">Leads</p>
          <p className="font-semibold text-gray-900">{formatNumber(campaign.leads)}</p>
        </div>
        <div>
          <p className="text-gray-600 mb-0.5">Conversions</p>
          <p className="font-semibold text-gray-900">{formatNumber(campaign.conversions)}</p>
        </div>
        <div>
          <p className="text-gray-600 mb-0.5">Conversion Rate</p>
          <p className="font-semibold text-gray-900">{campaign.conversionRate}%</p>
        </div>
        <div>
          <p className="text-gray-600 mb-0.5">Engagement Rate</p>
          <p className="font-semibold text-gray-900">{campaign.engagementRate}%</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-1">Budget Utilization: {budgetUtilization.toFixed(1)}%</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(budgetUtilization, 100)}%`,
              background: budgetUtilization > 90 ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' :
                         budgetUtilization > 70 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' :
                         'linear-gradient(90deg, #10b981 0%, #059669 100%)'
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {campaign.channels.slice(0, 3).map((channel, idx) => (
          <span key={idx} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
            {channel}
          </span>
        ))}
        {campaign.channels.length > 3 && (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
            +{campaign.channels.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectsNew;
