import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import axios from '../utils/axios';
import { toast } from 'sonner';


const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [documentMessage, setDocumentMessage] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/vendor-applications/${id}`);
      setApplication(response.data);
    } catch (err) {
      toast.error('Başvuru yüklenirken hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/admin/vendor-applications/${id}/approve`);
      toast.success('Başvuru onaylandı!');
      navigate('/admin/vendor-applications');
    } catch (err) {
      toast.error('Onaylama sırasında hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Lütfen red sebebi girin');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`/admin/vendor-applications/${id}/reject`, null, {
        params: { reason: rejectReason }
      });
      toast.success('Başvuru reddedildi');
      setRejectDialogOpen(false);
      navigate('/admin/vendor-applications');
    } catch (err) {
      toast.error('Reddetme sırasında hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDocuments = async () => {
    if (!documentMessage.trim()) {
      toast.error('Lütfen mesaj girin');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`/admin/vendor-applications/${id}/request-documents`, null, {
        params: { message: documentMessage }
      });
      toast.success('Belge talebi gönderildi');
      setDocumentsDialogOpen(false);
      fetchApplication();
    } catch (err) {
      toast.error('Belge talebi gönderilirken hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full" data-testid="application-detail-loading">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!application) {
    return (
      <AdminLayout>
        <div className="text-center py-12" data-testid="application-not-found">
          <p className="text-slate-600">Başvuru bulunamadı</p>
        </div>
      </AdminLayout>
    );
  }

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
      <div className="space-y-6" data-testid="application-detail">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="application-brand-name">
              {application.brand_name}
            </h1>
            <p style={{ color: '#6B7280' }} data-testid="application-email">{application.email}</p>
          </div>
          {getStatusBadge(application.status)}
        </div>

        {/* Application Info */}
        <Card className="p-6" data-testid="application-info">
          <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Başvuru Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Firma Adı</h4>
              <p className="text-slate-600">{application.vendor_name}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Marka Adı</h4>
              <p className="text-slate-600">{application.brand_name}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Firma Türü</h4>
              <p className="text-slate-600">{application.company_type}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Telefon</h4>
              <p className="text-slate-600">{application.phone}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Email</h4>
              <p className="text-slate-600">{application.email}</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-1">Başvuru Tarihi</h4>
              <p className="text-slate-600">{new Date(application.created_at).toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-slate-800 mb-1">Adres</h4>
              <p className="text-slate-600">{application.address}</p>
            </div>
            {application.tax_number && (
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Vergi Numarası</h4>
                <p className="text-slate-600">{application.tax_number}</p>
              </div>
            )}
            {application.bank_iban && (
              <div>
                <h4 className="font-medium text-slate-800 mb-1">IBAN</h4>
                <p className="text-slate-600 font-mono">{application.bank_iban}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Documents */}
        {application.documents && application.documents.length > 0 && (
          <Card className="p-6" data-testid="application-documents">
            <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Belgeler
            </h3>
            <div className="space-y-2">
              {application.documents.map((doc, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <FileText size={20} className="text-blue-600" />
                  <span className="text-slate-700">{doc}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timeline */}
        {application.notes && application.notes.length > 0 && (
          <Card className="p-6" data-testid="application-timeline">
            <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              İşlem Geçmişi
            </h3>
            <div className="space-y-3">
              {application.notes.map((note, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800">{note.action}</span>
                      <span className="text-sm text-slate-500">
                        {new Date(note.timestamp).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {note.by && <p className="text-sm text-slate-600">Tarafından: {note.by}</p>}
                    {note.reason && <p className="text-sm text-slate-600 mt-1">Sebep: {note.reason}</p>}
                    {note.message && <p className="text-sm text-slate-600 mt-1">Mesaj: {note.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        {application.status === 'Pending' && (
          <Card className="p-6" data-testid="application-actions">
            <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              İşlemler
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                style={{ backgroundColor: '#10B981' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                data-testid="approve-btn"
              >
                <CheckCircle size={18} className="mr-2" />
                Başvuruyu Onayla
              </Button>
              <Button
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
                variant="destructive"
                data-testid="reject-btn"
              >
                <XCircle size={18} className="mr-2" />
                Başvuruyu Reddet
              </Button>
              <Button
                onClick={() => setDocumentsDialogOpen(true)}
                disabled={actionLoading}
                variant="outline"
                data-testid="request-documents-btn"
              >
                <FileText size={18} className="mr-2" />
                Ek Belge İste
              </Button>
            </div>
          </Card>
        )}

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent data-testid="reject-dialog">
            <DialogHeader>
              <DialogTitle>Başvuruyu Reddet</DialogTitle>
              <DialogDescription>
                Lütfen reddetme sebebini belirtin. Bu bilgi satıcıya iletilecektir.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Red sebebi..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              data-testid="reject-reason-input"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} data-testid="reject-cancel-btn">
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                data-testid="reject-confirm-btn"
              >
                Reddet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Documents Request Dialog */}
        <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
          <DialogContent data-testid="documents-dialog">
            <DialogHeader>
              <DialogTitle>Ek Belge Talebi</DialogTitle>
              <DialogDescription>
                Satıcıdan hangi belgeleri talep etmek istiyorsunuz?
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Talep edilen belgeler ve açıklama..."
              value={documentMessage}
              onChange={(e) => setDocumentMessage(e.target.value)}
              rows={4}
              data-testid="document-message-input"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocumentsDialogOpen(false)} data-testid="documents-cancel-btn">
                İptal
              </Button>
              <Button
                onClick={handleRequestDocuments}
                disabled={actionLoading || !documentMessage.trim()}
                data-testid="documents-send-btn"
              >
                Talep Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ApplicationDetail;
