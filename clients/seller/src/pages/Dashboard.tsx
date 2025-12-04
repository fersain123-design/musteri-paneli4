import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api.ts';
import { DashboardStats } from '../types/index.ts';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/5 border border-error rounded-lg p-4 text-error">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const StatCard: React.FC<{ title: string; value: number | string; icon: string; color: string; subtitle?: string }> = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Yenile</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bugünkü Siparişler"
          value={stats.today?.orders || 0}
          icon="📦"
          color="border-blue-500"
          subtitle={`₺${(stats.today?.revenue || 0).toFixed(2)} gelir`}
        />
        <StatCard
          title="Bekleyen Siparişler"
          value={stats.pending?.orders || 0}
          icon="⏳"
          color="border-yellow-500"
        />
        <StatCard
          title="Toplam Ürünler"
          value={stats.products?.total || 0}
          icon="🏪"
          color="border-primary"
          subtitle={`${stats.products?.active || 0} aktif`}
        />
        <StatCard
          title="Düşük Stok"
          value={stats.products?.low_stock || 0}
          icon="⚠️"
          color="border-red-500"
        />
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Haftalık Özet</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Toplam Sipariş</span>
              <span className="font-semibold text-text-primary">{stats.week?.orders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Toplam Gelir</span>
              <span className="font-semibold text-primary">₺{(stats.week?.revenue || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Aylık Özet</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Toplam Sipariş</span>
              <span className="font-semibold text-text-primary">{stats.month?.orders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Toplam Gelir</span>
              <span className="font-semibold text-primary">₺{(stats.month?.revenue || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {stats.chart_data && stats.chart_data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Sipariş Trendi (Son 7 Gün)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#0A5C36" name="Siparişler" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Gelir Trendi (Son 7 Gün)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#0A5C36" name="Gelir (₺)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {stats.recent_orders && stats.recent_orders.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-text-primary">Son Siparişler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Sipariş No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Toplam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recent_orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-background">
                    <td className="px-6 py-4 text-sm text-text-primary">{order.order_number || order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{order.customer_info.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">₺{order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-success/10 text-success'
                            : order.status === 'cancelled'
                            ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {order.status === 'pending' && 'Beklemede'}
                        {order.status === 'preparing' && 'Hazırlanıyor'}
                        {order.status === 'on_the_way' && 'Yolda'}
                        {order.status === 'delivered' && 'Teslim Edildi'}
                        {order.status === 'cancelled' && 'İptal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.recent_orders?.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-text-secondary">Henüz sipariş bulunmuyor</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
