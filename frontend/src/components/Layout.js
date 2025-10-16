import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Tag, Layers, FileText, LogOut, Menu, Sparkles, User } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Executive Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/customer-analysis', label: 'Customer Analysis', icon: <Users className="w-5 h-5" /> },
    { path: '/brand-analysis', label: 'Brand Analysis', icon: <Tag className="w-5 h-5" /> },
    { path: '/category-analysis', label: 'Category Analysis', icon: <Layers className="w-5 h-5" /> },
    { path: '/reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> }
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
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                  ThriveBrands
                </h2>
                <p className="text-xs text-blue-200">BIZ Pulse Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    location.pathname === item.path
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{user?.split('@')[0]}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="hidden md:flex text-white hover:bg-white/10"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden pb-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    location.pathname === item.path
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10 mt-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default Layout;