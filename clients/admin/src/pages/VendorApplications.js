import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from '../utils/axios';
import { toast } from 'sonner';


const VendorApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await axios.get(`/admin/vendor-applications`, { params });
      setApplications(response.data.applications);
      setTotalPages(response.data.pages);
    } catch (err) {
      toast.error('Başvurular yüklenirken hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      Pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-700', label: 'Beklemede' },
      Approved: { icon: CheckCircle, className: 'bg-green-100 text-green-700', label: 'Onaylandı' },
      Rejected: { icon: XCircle, className: 'bg-red-100 text-red-700', label: 'Reddedildi' },
      DocumentsRequested: { icon: Clock, className: 'bg-orange-100 text-orange-700', label: 'Belge İstendi' }
    };
    const statusConfig = config[status] || config.Pending;
    const Icon = statusConfig.icon;

    return (
      <Badge className={statusConfig.className}>
        <Icon size={14} className="mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="vendor-applications">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="applications-title">
              Satıcı Başvuruları
            </h1>
            <p style={{ color: '#6B7280' }} data-testid="applications-subtitle">Satıcı başvurularını incele ve onayla</p>
          </div>

          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger className="w-48" data-testid="status-filter">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="Pending">Beklemede</SelectItem>
              <SelectItem value="Approved">Onaylandı</SelectItem>
              <SelectItem value="Rejected">Reddedildi</SelectItem>
              <SelectItem value="DocumentsRequested">Belge İstendi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        <Card>
          {loading ? (
            <div className="p-12 text-center" data-testid="applications-loading">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Yükleniyor...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center" data-testid="applications-empty">
              <p className="text-slate-600">Başvuru bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="applications-table">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Başvuru ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Satıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Firma Türü</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Başvuru Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50" data-testid={`application-row-${app.id}`}>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {app.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{app.brand_name}</div>
                          <div className="text-sm text-slate-500">{app.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{app.company_type}</td>
                      <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(app.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/vendor-applications/${app.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`view-application-${app.id}`}>
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
            <div className="px-6 py-4 border-t flex items-center justify-between" data-testid="applications-pagination">
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

export default VendorApplications;
