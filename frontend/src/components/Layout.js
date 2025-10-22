import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { 
  LayoutDashboard, 
  Users, 
  Tag, 
  Layers, 
  FileText, 
  Target, 
  FolderKanban,
  Lightbulb,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const menuItems = [
    { path: '/', icon: Target, label: 'Cockpit', color: '#f59e0b' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/compass', icon: LayoutDashboard, label: 'Business Compass' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/brands', icon: Tag, label: 'Brands' },
    { path: '/categories', icon: Layers, label: 'Categories' },
    { path: '/sales-analysis', icon: TrendingUp, label: 'Sales Analysis' },
    { path: '/root-cause-analysis', icon: AlertCircle, label: 'RCA' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f59e0b' }}>
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                BeaconIQ
              </h1>
              <p className="text-xs text-gray-500">by Vector AI Studio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside 
          className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {/* Navigation Title */}
            {!sidebarCollapsed && (
              <div className="px-4 py-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Navigation
                </h3>
              </div>
            )}

            {/* Menu Items */}
            <nav className="flex-1 px-3 py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg transition-all ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={isActive ? { borderLeft: '3px solid #f59e0b' } : {}}
                  >
                    <Icon 
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-600' : 'text-gray-500'}`} 
                    />
                    {!sidebarCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            {!sidebarCollapsed && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">BeaconIQ by Vector AI Studio</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <div className="p-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;