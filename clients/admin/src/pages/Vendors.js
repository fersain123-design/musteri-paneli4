import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import apiClient from '../utils/axios';
import { toast } from 'sonner';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/vendors');
      setVendors(response.data);
    } catch (err) {
      toast.error('Satıcılar yüklenirken hata: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-6" data-testid="vendors-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="vendors-title">
            Satıcılar
          </h1>
          <p style={{ color: '#6B7280' }} data-testid="vendors-subtitle">Tüm satıcıları görüntüle</p>
        </div>

        {/* Vendors Table */}
        <Card>
          {vendors.length === 0 ? (
            <div className="p-12 text-center" data-testid="vendors-empty">
              <p style={{ color: '#6B7280' }}>Satıcı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="vendors-table">
                <thead style={{ backgroundColor: '#F8F4ED' }} className="border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Ad Soyad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Telefon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50" data-testid={`vendor-row-${vendor.id}`}>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#1E1E1E' }}>
                        {vendor.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {vendor.email}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {vendor.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6B7280' }}>
                        {new Date(vendor.created_at).toLocaleDateString('tr-TR')}
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

export default Vendors;
