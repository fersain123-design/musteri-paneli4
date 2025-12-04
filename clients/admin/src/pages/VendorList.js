import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Search, Eye } from 'lucide-react';
import axios from '../utils/axios';
import { toast } from 'sonner';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVendors();
  }, [statusFilter, page]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (search) {
        params.search = search;
      }

      const response = await axios.get('/admin/vendors', { params });
      setVendors(response.data.vendors);
      setTotalPages(response.data.pages);
    } catch (err) {
      toast.error('Satıcılar yüklenirken hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchVendors();
  };

  const getStatusBadge = (status) => {
    const variants = {
      Active: { variant: 'default', className: 'bg-green-100 text-green-700', label: 'Aktif' },
      Pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700', label: 'Beklemede' },
      Suspended: { variant: 'destructive', className: 'bg-red-100 text-red-700', label: 'Askıda' },
      Rejected: { variant: 'outline', className: 'bg-gray-100 text-gray-700', label: 'Reddedildi' }
    };
    const config = variants[status] || variants.Pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="vendor-list">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="vendor-list-title">
            Satıcı Yönetimi
          </h1>
          <p style={{ color: '#6B7280' }} data-testid="vendor-list-subtitle">Tüm satıcıları görüntüle ve yönet</p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Satıcı ara (isim, email, marka)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="vendor-search-input"
              />
              <Button onClick={handleSearch} data-testid="vendor-search-btn">
                <Search size={18} />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="Active">Aktif</SelectItem>
                <SelectItem value="Pending">Beklemede</SelectItem>
                <SelectItem value="Suspended">Askıda</SelectItem>
                <SelectItem value="Rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Vendors Table */}
        <Card>
          {loading ? (
            <div className="p-12 text-center" data-testid="vendor-list-loading">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Yükleniyor...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="p-12 text-center" data-testid="vendor-list-empty">
              <p className="text-slate-600">Satıcı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="vendor-table">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Satıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Firma Türü</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ciro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Siparişler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Şikayetler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50" data-testid={`vendor-row-${vendor.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{vendor.brand_name}</div>
                          <div className="text-sm text-slate-500">{vendor.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{vendor.company_type}</td>
                      <td className="px-6 py-4">{getStatusBadge(vendor.status)}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {vendor.total_revenue.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{vendor.monthly_orders}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{vendor.complaint_count}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {vendor.rating > 0 ? `${vendor.rating.toFixed(1)} ⭐` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/vendors/${vendor.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`view-vendor-${vendor.id}`}>
                            <Eye size={16} className="mr-1" />
                            Detay
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between" data-testid="vendor-pagination">
              <div className="text-sm text-slate-600">
                Sayfa {page} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="prev-page-btn"
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="next-page-btn"
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default VendorList;
