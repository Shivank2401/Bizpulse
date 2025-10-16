import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const { token } = useAuth();
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API}/filters/options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilters(response.data);
    } catch (error) {
      toast.error('Failed to load filter options');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    toast.success('Report generation feature coming soon!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading reports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="reports-page">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Reports
          </h1>
          <p className="text-gray-400 mt-1">Generate and download custom reports</p>
        </div>

        {/* Report Generator */}
        <div
          className="glass-effect rounded-xl p-8 shadow-custom"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Space Grotesk' }}>
              Report Generator
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Year Filter */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Year</label>
              <Select onValueChange={(value) => setSelectedFilters({ ...selectedFilters, year: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {(filters?.years || []).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Filter */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Business</label>
              <Select onValueChange={(value) => setSelectedFilters({ ...selectedFilters, business: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Business" />
                </SelectTrigger>
                <SelectContent>
                  {(filters?.businesses || []).map((business) => (
                    <SelectItem key={business} value={business}>
                      {business}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Brand</label>
              <Select onValueChange={(value) => setSelectedFilters({ ...selectedFilters, brand: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  {(filters?.brands || []).map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channel Filter */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Channel</label>
              <Select onValueChange={(value) => setSelectedFilters({ ...selectedFilters, channel: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Channel" />
                </SelectTrigger>
                <SelectContent>
                  {(filters?.channels || []).map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Category</label>
              <Select onValueChange={(value) => setSelectedFilters({ ...selectedFilters, category: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {(filters?.categories || []).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            className="w-full md:w-auto"
            style={{
              background: 'linear-gradient(135deg, #538EB7 0%, #0091A7 100%)',
              color: '#fff'
            }}
            data-testid="generate-report-button"
          >
            <Download className="mr-2 w-5 h-5" />
            Generate Report
          </Button>
        </div>

        {/* Pre-defined Reports */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Pre-defined Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Executive Summary Report',
              'Customer Performance Report',
              'Brand Analysis Report',
              'Category Insights Report',
              'YoY Comparison Report',
              'Monthly Trends Report'
            ].map((report) => (
              <div
                key={report}
                className="glass-effect rounded-xl p-6 shadow-custom cursor-pointer hover:bg-white/10 transition"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={() => toast.info(`${report} will be available soon`)}
              >
                <FileText className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold">{report}</h3>
                <p className="text-gray-400 text-sm mt-2">Download pre-configured report</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;