import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from '../utils/axios';

const VendorDetail = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchVendorData();
  }, [id]);

  const fetchVendorData = async () => {
    setLoading(true);
    try {
      const [vendorRes, healthRes, productsRes, ordersRes, balanceRes] = await Promise.all([
        axios.get('/admin/vendors/${id}'),
        axios.get('/admin/vendors/${id}/health'),
        axios.get('/admin/vendors/${id}/products'),
        axios.get('/admin/vendors/${id}/orders'),
        axios.get('/admin/vendors/${id}/balance')
      ]);

      setVendor(vendorRes.data);
      setHealth(healthRes.data);
      setProducts(productsRes.data.products);
      setOrders(ordersRes.data.orders);
      setBalance(balanceRes.data);
    } catch (err) {
      toast.error('Veri yüklenirken hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put('/admin/vendors/${id}/status', null, {
        params: { status: newStatus }
      });
      toast.success('Durum güncellendi');
      setVendor({ ...vendor, status: newStatus });
    } catch (err) {
      toast.error('Durum güncellenirken hata');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full" data-testid="vendor-detail-loading">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!vendor) {
    return (
      <AdminLayout>
        <div className="text-center py-12" data-testid="vendor-not-found">
          <p className="text-slate-600">Satıcı bulunamadı</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="vendor-detail">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#0A5C36' }} data-testid="vendor-name">
              {vendor.brand_name}
            </h1>
            <p style={{ color: '#6B7280' }} data-testid="vendor-email">{vendor.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={vendor.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48" data-testid="vendor-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Aktif</SelectItem>
                <SelectItem value="Suspended">Askıya Al</SelectItem>
                <SelectItem value="Rejected">Reddet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4" data-testid="vendor-stat-revenue">
            <p className="text-sm text-slate-600 mb-1">Toplam Ciro</p>
            <p className="text-2xl font-bold text-slate-800">{vendor.total_revenue.toLocaleString('tr-TR')} ₺</p>
          </Card>
          <Card className="p-4" data-testid="vendor-stat-orders">
            <p className="text-sm text-slate-600 mb-1">Aylık Sipariş</p>
            <p className="text-2xl font-bold text-slate-800">{vendor.monthly_orders}</p>
          </Card>
          <Card className="p-4" data-testid="vendor-stat-complaints">
            <p className="text-sm text-slate-600 mb-1">Şikayetler</p>
            <p className="text-2xl font-bold text-slate-800">{vendor.complaint_count}</p>
          </Card>
          <Card className="p-4" data-testid="vendor-stat-rating">
            <p className="text-sm text-slate-600 mb-1">Rating</p>
            <p className="text-2xl font-bold text-slate-800">{vendor.rating > 0 ? `${vendor.rating.toFixed(1)} ⭐` : '-'}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="vendor-tabs">
          <TabsList>
            <TabsTrigger value="general" data-testid="tab-general">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-health">Hesap Sağlığı</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Ürünler</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Siparişler</TabsTrigger>
            <TabsTrigger value="balance" data-testid="tab-balance">Bakiye</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" data-testid="tab-content-general">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Firma Adı</h3>
                  <p className="text-slate-600">{vendor.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Marka Adı</h3>
                  <p className="text-slate-600">{vendor.brand_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Firma Türü</h3>
                  <p className="text-slate-600">{vendor.company_type}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Telefon</h3>
                  <p className="text-slate-600">{vendor.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Email</h3>
                  <p className="text-slate-600">{vendor.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Kayıt Tarihi</h3>
                  <p className="text-slate-600">{new Date(vendor.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" data-testid="tab-content-health">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">Hesap Sağlık Skoru</h3>
                    <span className={`text-3xl font-bold ${
                      health.health_score >= 80 ? 'text-green-600' :
                      health.health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {health.health_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        health.health_score >= 80 ? 'bg-green-500' :
                        health.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${health.health_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Geç Kargo Oranı</p>
                    <p className="text-xl font-bold text-slate-800">{health.late_shipping_rate.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">İade Oranı</p>
                    <p className="text-xl font-bold text-slate-800">{health.return_rate.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Şikayet Oranı</p>
                    <p className="text-xl font-bold text-slate-800">{health.complaint_rate.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Policy İhlalleri</p>
                    <p className="text-xl font-bold text-slate-800">{health.policy_violations}</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" data-testid="tab-content-products">
            <Card>
              {products.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-600">Ürün bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ürün</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fiyat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stok</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{product.price} ₺</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{product.stock}</td>
                          <td className="px-6 py-4">
                            <Badge className={product.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              {product.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" data-testid="tab-content-orders">
            <Card>
              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-600">Sipariş bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tutar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-mono text-slate-600">{order.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{order.total_amount} ₺</td>
                          <td className="px-6 py-4">
                            <Badge>{order.status}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(order.created_at).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Balance Tab */}
          <TabsContent value="balance" data-testid="tab-content-balance">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Toplam Kazanç</p>
                  <p className="text-2xl font-bold text-green-800">{balance?.total_earnings?.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700 mb-1">Bekleyen Ödeme</p>
                  <p className="text-2xl font-bold text-yellow-800">{balance?.pending_payment?.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Toplam Komisyon</p>
                  <p className="text-2xl font-bold text-blue-800">{balance?.commission_total?.toLocaleString('tr-TR')} ₺</p>
                </div>
              </div>

              {balance?.payouts && balance.payouts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Ödeme Geçmişi</h3>
                  <div className="space-y-2">
                    {balance.payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{payout.amount.toLocaleString('tr-TR')} ₺</p>
                          <p className="text-sm text-slate-600">{new Date(payout.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <Badge className={payout.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default VendorDetail;
