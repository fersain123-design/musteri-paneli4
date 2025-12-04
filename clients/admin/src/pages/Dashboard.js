import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import apiClient from '../utils/axios';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/api/admin/statistics');
      setStats(response.data);
    } catch (err) {
      toast.error('İstatistikler yüklenirken hata: ' + (err.response?.data?.detail || err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full" data-testid="dashboard-loading">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#0A5C36' }}></div>
            <p style={{ color: '#6B7280' }}>Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Toplam Kullanıcılar',
      value: stats?.total_users || 0,
      icon: Users,
      color: '#0A5C36',
      testId: 'stat-total-users'
    },
    {
      title: 'Müşteriler',
      value: stats?.customers || 0,
      icon: Users,
      color: '#68A47B',
      testId: 'stat-customers'
    },
    {
      title: 'Satıcılar',
      value: stats?.vendors || 0,
      icon: ShoppingCart,
      color: '#F5A623',
      testId: 'stat-vendors'
    },
    {
      title: 'Toplam Siparişler',
      value: stats?.total_orders || 0,
      icon: Package,
      color: '#10B981',
      testId: 'stat-total-orders'
    },
    {
      title: 'Toplam Gelir',
      value: `${(stats?.total_revenue || 0).toLocaleString('tr-TR')} ₺`,
      icon: TrendingUp,
      color: '#0A5C36',
      testId: 'stat-total-revenue'
    },
    {
      title: 'Toplam Ürünler',
      value: stats?.total_products || 0,
      icon: Package,
      color: '#68A47B',
      testId: 'stat-total-products'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="dashboard-content">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="dashboard-title">
            Dashboard
          </h1>
          <p style={{ color: '#6B7280' }} data-testid="dashboard-subtitle">MANAVIM Yönetim Paneli - Genel Bakış</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow" data-testid={stat.testId}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: stat.color }}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
                <h3 className="text-sm mb-1" style={{ color: '#6B7280' }}>{stat.title}</h3>
                <p className="text-2xl font-bold" style={{ color: '#1E1E1E' }}>{stat.value}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
