import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { LayoutDashboard, Users, FileText, LogOut, Menu, X } from 'lucide-react';
import axios from '../utils/axios';
import { toast } from 'sonner';

const AdminLayout = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const adminUser = localStorage.getItem('admin_user');
      if (adminUser) {
        setAdmin(JSON.parse(adminUser));
      } else {
        navigate('/admin/login');
      }
    } catch (err) {
      navigate('/admin/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin_user');
    toast.success('Çıkış başarılı');
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', testId: 'nav-dashboard' },
    { path: '/admin/users', icon: Users, label: 'Kullanıcılar', testId: 'nav-users' },
    { path: '/admin/vendors', icon: Users, label: 'Satıcılar', testId: 'nav-vendors' }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } text-white transition-all duration-300 flex flex-col`}
        style={{ backgroundColor: '#0A5C36' }}
        data-testid="sidebar"
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_omnibazaar/artifacts/makpikt7_A6D4272F-6A83-4722-B047-D52ECA1A41A5.png" 
                alt="MANAVIM"
                className="h-8"
              />
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }} data-testid="sidebar-title">
                MANAVIM
              </h1>
            </div>
          ) : (
            <img 
              src="https://customer-assets.emergentagent.com/job_omnibazaar/artifacts/makpikt7_A6D4272F-6A83-4722-B047-D52ECA1A41A5.png" 
              alt="M"
              className="h-8"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#064628'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={item.testId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white hover:text-white'
                }`}
                style={{ 
                  backgroundColor: isActive ? '#F5A623' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#064628';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {admin && (
          <div className="p-4 border-t" style={{ borderColor: '#064628' }}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar data-testid="admin-avatar">
                <AvatarFallback style={{ backgroundColor: '#F5A623', color: '#1E1E1E' }}>
                  {admin.full_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="admin-name">{admin.full_name}</p>
                  <p className="text-xs text-slate-400 truncate" data-testid="admin-role">{admin.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#064628'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                data-testid="logout-btn"
              >
                <LogOut size={16} className="mr-2" />
                Çıkış Yap
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
