import React, { useState } from 'react';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Calendar, DollarSign, Play, Archive, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Cockpit = () => {
  const [activeTab, setActiveTab] = useState('recommended');
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: 'all', month: 'all', business: 'all', channel: 'all', brand: 'all', category: 'all'
  });

  const [campaigns, setCampaigns] = useState({
    recommended: [
      {
        id: 1,
        name: 'Household & Beauty Q1 Expansion',
        budget: 45000,
        expectedROI: 3.2,
        channels: ['Retail', 'Grocery'],
        startDate: '2025-01-15',
        endDate: '2025-03-31',
        aiScore: 95,
        description: 'Focus on expanding household products in retail channels during Q1 peak season'
      },
      {
        id: 2,
        name: 'Brand Kinetica Premium Push',
        budget: 32000,
        expectedROI: 2.8,
        channels: ['Retail', 'Wholesale'],
        startDate: '2025-02-01',
        endDate: '2025-04-30',
        aiScore: 88,
        description: 'Leverage Kinetica brand strength with premium product positioning'
      },
      {
        id: 3,
        name: 'Food Category Cross-Sell Initiative',
        budget: 28000,
        expectedROI: 2.5,
        channels: ['Grocery', 'Convenience'],
        startDate: '2025-01-20',
        endDate: '2025-03-15',
        aiScore: 82,
        description: 'Cross-sell food products across multiple channels to increase basket size'
      }
    ],
    active: [],
    archived: []
  });

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const activateCampaign = (campaign) => {
    setCampaigns(prev => ({
      ...prev,
      recommended: prev.recommended.filter(c => c.id !== campaign.id),
      active: [...prev.active, { ...campaign, activatedDate: new Date().toISOString() }]
    }));
    toast.success(`Campaign "${campaign.name}" activated!`);
  };

  const archiveCampaign = (campaign) => {
    setCampaigns(prev => ({
      ...prev,
      active: prev.active.filter(c => c.id !== campaign.id),
      archived: [...prev.archived, { ...campaign, archivedDate: new Date().toISOString() }]
    }));
    toast.success(`Campaign "${campaign.name}" archived!`);
  };

  const reactivateCampaign = (campaign) => {
    setCampaigns(prev => ({
      ...prev,
      archived: prev.archived.filter(c => c.id !== campaign.id),
      active: [...prev.active, { ...campaign, reactivatedDate: new Date().toISOString() }]
    }));
    toast.success(`Campaign "${campaign.name}" reactivated!`);
  };

  const deleteCampaign = (campaign, type) => {
    setCampaigns(prev => ({
      ...prev,
      [type]: prev[type].filter(c => c.id !== campaign.id)
    }));
    toast.success(`Campaign "${campaign.name}" deleted!`);
  };

  const CampaignCard = ({ campaign, type }) => (
    <div className=\"professional-card p-5 hover:shadow-lg transition\">\n      <div className=\"flex items-start justify-between mb-3\">\n        <div className=\"flex-1\">\n          <div className=\"flex items-center gap-2 mb-2\">\n            <h3 className=\"text-base font-semibold text-gray-900\" style={{ fontFamily: 'Space Grotesk' }}>\n              {campaign.name}\n            </h3>\n            {type === 'recommended' && (\n              <div className=\"px-2 py-1 rounded-full text-xs font-semibold\" style={{ background: '#fef3c7', color: '#d97706' }}>\n                AI Score: {campaign.aiScore}\n              </div>\n            )}\n          </div>\n          <p className=\"text-sm text-gray-600 mb-3\">{campaign.description}</p>\n        </div>\n      </div>\n\n      <div className=\"grid grid-cols-2 gap-3 mb-4\">\n        <div className=\"flex items-center gap-2\">\n          <div className=\"p-2 rounded-lg bg-blue-50\">\n            <DollarSign className=\"w-4 h-4 text-blue-600\" />\n          </div>\n          <div>\n            <p className=\"text-xs text-gray-600\">Budget</p>\n            <p className=\"text-sm font-semibold text-gray-900\">€{(campaign.budget / 1000).toFixed(1)}k</p>\n          </div>\n        </div>\n        <div className=\"flex items-center gap-2\">\n          <div className=\"p-2 rounded-lg bg-green-50\">\n            <TrendingUp className=\"w-4 h-4 text-green-600\" />\n          </div>\n          <div>\n            <p className=\"text-xs text-gray-600\">Expected ROI</p>\n            <p className=\"text-sm font-semibold text-gray-900\">{campaign.expectedROI}x</p>\n          </div>\n        </div>\n      </div>\n\n      <div className=\"flex items-center gap-2 mb-4\">\n        <Calendar className=\"w-4 h-4 text-gray-400\" />\n        <span className=\"text-xs text-gray-600\">\n          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}\n        </span>\n      </div>\n\n      <div className=\"flex flex-wrap gap-2 mb-4\">\n        {campaign.channels.map((channel, idx) => (\n          <span key={idx} className=\"px-2 py-1 bg-gray-100 rounded text-xs text-gray-700\">\n            {channel}\n          </span>\n        ))}\n      </div>\n\n      <div className=\"flex gap-2\">\n        {type === 'recommended' && (\n          <>\n            <Button\n              onClick={() => activateCampaign(campaign)}\n              size=\"sm\"\n              className=\"flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white\"\n            >\n              <Play className=\"w-4 h-4 mr-1\" />\n              Activate\n            </Button>\n            <Button\n              onClick={() => deleteCampaign(campaign, 'recommended')}\n              size=\"sm\"\n              variant=\"outline\"\n              className=\"border-red-300 text-red-600 hover:bg-red-50\"\n            >\n              <Trash2 className=\"w-4 h-4\" />\n            </Button>\n          </>\n        )}\n        {type === 'active' && (\n          <>\n            <Button\n              onClick={() => archiveCampaign(campaign)}\n              size=\"sm\"\n              className=\"flex-1 bg-gray-600 hover:bg-gray-700 text-white\"\n            >\n              <Archive className=\"w-4 h-4 mr-1\" />\n              Archive\n            </Button>\n          </>\n        )}\n        {type === 'archived' && (\n          <>\n            <Button\n              onClick={() => reactivateCampaign(campaign)}\n              size=\"sm\"\n              className=\"flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white\"\n            >\n              <RotateCcw className=\"w-4 h-4 mr-1\" />\n              Reactivate\n            </Button>\n            <Button\n              onClick={() => deleteCampaign(campaign, 'archived')}\n              size=\"sm\"\n              variant=\"outline\"\n              className=\"border-red-300 text-red-600 hover:bg-red-50\"\n            >\n              <Trash2 className=\"w-4 h-4\" />\n            </Button>\n          </>\n        )}\n      </div>\n    </div>\n  );\n\n  return (\n    <Layout>\n      <div className=\"space-y-5\">\n        <div>\n          <h1 className=\"text-2xl font-bold text-gray-900\" style={{ fontFamily: 'Space Grotesk' }}>\n            Campaign Cockpit\n          </h1>\n          <p className=\"text-gray-600 text-sm mt-1\">AI-powered campaign management and recommendations</p>\n        </div>\n\n        <FilterBar filters={filters} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />\n\n        {/* Tabs */}\n        <div className=\"flex gap-2 border-b border-gray-200\">\n          {[\n            { key: 'recommended', label: 'AI Recommended', count: campaigns.recommended.length },\n            { key: 'active', label: 'Active Campaigns', count: campaigns.active.length },\n            { key: 'archived', label: 'Archived', count: campaigns.archived.length }\n          ].map(tab => (\n            <button\n              key={tab.key}\n              onClick={() => setActiveTab(tab.key)}\n              className={`px-4 py-2 text-sm font-medium transition ${\n                activeTab === tab.key\n                  ? 'border-b-2 text-gray-900'\n                  : 'text-gray-600 hover:text-gray-900'\n              }`}\n              style={{\n                borderColor: activeTab === tab.key ? '#d97706' : 'transparent'\n              }}\n            >\n              {tab.label} ({tab.count})\n            </button>\n          ))}\n        </div>\n\n        {/* Campaign Grid */}\n        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5\">\n          {campaigns[activeTab].length === 0 ? (\n            <div className=\"col-span-full text-center py-12\">\n              <Target className=\"w-12 h-12 text-gray-400 mx-auto mb-3\" />\n              <p className=\"text-gray-600\">No campaigns in this category</p>\n            </div>\n          ) : (\n            campaigns[activeTab].map(campaign => (\n              <CampaignCard key={campaign.id} campaign={campaign} type={activeTab} />\n            ))\n          )}\n        </div>\n      </div>\n    </Layout>\n  );\n};\n\nexport default Cockpit;
