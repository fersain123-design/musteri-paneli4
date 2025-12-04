import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import apiClient from '../utils/axios';
import { toast } from 'sonner';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      toast.error('Kullanıcılar yüklenirken hata: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: '#FEE2E2', text: '#DC2626' },
      vendor: { bg: '#FEF3C7', text: '#D97706' },
      customer: { bg: '#E8F5E9', text: '#0A5C36' }
    };
    const config = colors[role] || colors.customer;
    return (
      <Badge style={{ backgroundColor: config.bg, color: config.text }}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#0A5C36' }}></div>
            <p style={{ color: '#6B7280' }}>Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="users-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="users-title">
            Kullanıcılar
          </h1>
          <p style={{ color: '#6B7280' }} data-testid="users-subtitle">Tüm kullanıcıları görüntüle</p>
        </div>

        {/* Users Table */}
        <Card>
          {users.length === 0 ? (
            <div className="p-12 text-center" data-testid="users-empty">
              <p style={{ color: '#6B7280' }}>Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead style={{ backgroundColor: '#F8F4ED' }} className="border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Ad Soyad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50" data-testid={`user-row-${user.id}`}>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#1E1E1E' }}>
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Users;
