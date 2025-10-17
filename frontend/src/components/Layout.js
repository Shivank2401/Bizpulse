import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Tag, Layers, FileText, LogOut, Sparkles, User, ChevronLeft, ChevronRight, Target, FolderKanban } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Executive Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/customer-analysis', label: 'Customer Analysis', icon: <Users className="w-5 h-5" /> },
    { path: '/brand-analysis', label: 'Brand Analysis', icon: <Tag className="w-5 h-5" /> },
    { path: '/category-analysis', label: 'Category Analysis', icon: <Layers className="w-5 h-5" /> },
    { path: '/cockpit', label: 'Cockpit', icon: <Target className="w-5 h-5" /> },
    { path: '/projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
    { path: '/reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen" style={{ background: '#f8fafc' }}>
      {/* Vertical Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                    ThriveBrands
                  </h2>
                  <p className="text-xs text-amber-400">BIZ Pulse</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition group ${
                  location.pathname === item.path
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  background: location.pathname === item.path ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : 'transparent'
                }}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <div className={sidebarCollapsed ? 'mx-auto' : ''}>{item.icon}</div>
                {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Collapse Button */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              {!sidebarCollapsed && <span className="ml-2 text-sm">Collapse</span>}
            </button>
          </div>

          {/* User Section */}
          <div className="p-3 border-t border-white/10">
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{user?.split('@')[0]}</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5 text-xs"
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Top Header */}
        <header
          className="h-16 flex items-center justify-between px-6 border-b z-40"
          style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-white font-semibold text-lg" style={{ fontFamily: 'Space Grotesk' }}>
              ThriveBrands BIZ Pulse
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              <User className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{user?.split('@')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default Layout;