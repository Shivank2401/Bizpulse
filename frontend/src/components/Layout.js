import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Tag, Layers, FileText, LogOut, Sparkles, User } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Executive Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/customer-analysis', label: 'Customer Analysis', icon: <Users className="w-4 h-4" /> },
    { path: '/brand-analysis', label: 'Brand Analysis', icon: <Tag className="w-4 h-4" /> },
    { path: '/category-analysis', label: 'Category Analysis', icon: <Layers className="w-4 h-4" /> },
    { path: '/reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Horizontal Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          borderColor: '#1e3a8a'
        }}
      >
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                  ThriveBrands
                </h2>
                <p className="text-[10px] text-blue-200 leading-none">BIZ Pulse</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs ${
                    location.pathname === item.path
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{user?.split('@')[0]}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-6 py-6">
        {children}
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default Layout;