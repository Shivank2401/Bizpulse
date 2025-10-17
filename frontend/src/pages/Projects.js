import React, { useState } from 'react';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus, CheckCircle2, Clock, AlertCircle, Sparkles, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

const Projects = () => {
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: 'all', month: 'all', business: 'all', channel: 'all', brand: 'all', category: 'all'
  });

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Q1 2025 Product Launch - Kinetica Premium Line',
      description: 'Launch new premium product line for Kinetica brand across retail channels',
      status: 'in-progress',
      priority: 'high',
      progress: 65,
      dueDate: '2025-03-15',
      assignee: 'Marketing Team',
      tasks: [
        { id: 1, name: 'Market Research', status: 'completed', dueDate: '2025-01-10' },
        { id: 2, name: 'Product Development', status: 'in-progress', dueDate: '2025-02-15' },
        { id: 3, name: 'Marketing Campaign', status: 'pending', dueDate: '2025-03-01' },
        { id: 4, name: 'Channel Distribution Setup', status: 'pending', dueDate: '2025-03-10' }
      ],
      aiRecommendations: [
        'Focus on retail and grocery channels based on 2024 performance data',
        'Allocate 35% of budget to digital marketing for better ROI',
        'Consider partnering with key customers BWG and Musgrave for initial launch'
      ]
    },
    {
      id: 2,
      name: 'Household & Beauty Category Expansion',
      description: 'Expand product portfolio in household and beauty categories',
      status: 'planning',
      priority: 'medium',
      progress: 25,
      dueDate: '2025-06-30',
      assignee: 'Product Team',
      tasks: [
        { id: 1, name: 'Category Analysis', status: 'in-progress', dueDate: '2025-01-25' },
        { id: 2, name: 'SKU Selection', status: 'pending', dueDate: '2025-02-20' },
        { id: 3, name: 'Supplier Negotiations', status: 'pending', dueDate: '2025-03-30' },
        { id: 4, name: 'Launch Planning', status: 'pending', dueDate: '2025-05-15' }
      ],
      aiRecommendations: [
        'Household & Beauty represents 78% of current revenue - high potential',
        'Target sub-categories: Beauty and Cotton Pad showing strong growth',
        'Leverage existing channel relationships for faster market entry'
      ]
    },
    {
      id: 3,
      name: 'Customer Retention Program - Top 10 Accounts',
      description: 'Build retention program for top 10 customers to increase loyalty',
      status: 'completed',
      priority: 'high',
      progress: 100,
      dueDate: '2024-12-31',
      assignee: 'Sales Team',
      tasks: [
        { id: 1, name: 'Customer Analysis', status: 'completed', dueDate: '2024-11-15' },
        { id: 2, name: 'Program Design', status: 'completed', dueDate: '2024-12-05' },
        { id: 3, name: 'Implementation', status: 'completed', dueDate: '2024-12-20' },
        { id: 4, name: 'Rollout', status: 'completed', dueDate: '2024-12-31' }
      ],
      aiRecommendations: [
        'Top 10 customers account for 62% of revenue - critical to retain',
        'Focus on personalized offers and exclusive product access',
        'Implement quarterly business reviews with key accounts'
      ]
    }
  ]);

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', text: '#059669', icon: CheckCircle2 };
      case 'in-progress': return { bg: '#dbeafe', text: '#2563eb', icon: Clock };
      case 'planning': return { bg: '#fef3c7', text: '#d97706', icon: AlertCircle };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: Clock };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', text: '#dc2626' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706' };
      case 'low': return { bg: '#dbeafe', text: '#2563eb' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const ProjectCard = ({ project }) => {
    const statusInfo = getStatusColor(project.status);
    const StatusIcon = statusInfo.icon;
    const priorityInfo = getPriorityColor(project.priority);

    return (
      <div className="professional-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: statusInfo.bg, color: statusInfo.text }}>
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {project.status.replace('-', ' ')}
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: priorityInfo.bg, color: priorityInfo.text }}>
            {project.priority} priority
          </div>
        </div>

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
                background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Due Date</p>
              <p className="text-sm font-medium text-gray-900">{new Date(project.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Assignee</p>
              <p className="text-sm font-medium text-gray-900">{project.assignee}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Tasks ({project.tasks.filter(t => t.status === 'completed').length}/{project.tasks.length})</p>
          <div className="space-y-2">
            {project.tasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={`w-4 h-4 ${
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

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
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
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
              Project Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">Track and manage strategic initiatives</p>
          </div>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <FilterBar filters={filters} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
