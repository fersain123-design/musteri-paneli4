import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../services/api.ts';
import { Order } from '../types/index.ts';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const response = await ordersAPI.getAll(params);
      setOrders(response.data.data.orders);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const response = await ordersAPI.getOne(orderId);
        setSelectedOrder(response.data.data.order);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Durum güncellenemedi');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'preparing':
        return 'bg-info/10 text-blue-800';
      case 'on_the_way':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'cancelled':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-text-primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'preparing':
        return 'Hazırlanıyor';
      case 'on_the_way':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  const getNextStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return ['preparing', 'cancelled'];
      case 'preparing':
        return ['on_the_way', 'cancelled'];
      case 'on_the_way':
        return ['delivered', 'cancelled'];
      case 'delivered':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Sipariş Yönetimi</h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Yenile</span>
        </button>
      </div>

      {error && (
        <div className="bg-error/5 border border-error rounded-lg p-4 text-error">{error}</div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-text-primary">Durum Filtresi:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-light rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="preparing">Hazırlanıyor</option>
            <option value="on_the_way">Yolda</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="cancelled">İptal</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Filtrele
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Sipariş No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Toplam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Ödeme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Tarih</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-background">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">{order.customer_info.name}</div>
                      <div className="text-xs text-text-secondary">{order.customer_info.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">₺{order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.payment_status === 'paid'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {order.payment_status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-info hover:text-blue-800"
                      >
                        📋 Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-text-secondary">
            <p className="text-lg">Sipariş bulunmuyor</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Sipariş Detayı</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-text-secondary hover:text-text-primary">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Sipariş No</p>
                  <p className="font-medium">{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tarih</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Müşteri Bilgileri</h3>
                <div className="bg-background rounded-lg p-4 space-y-2">
                  <p>
                    <span className="text-text-secondary">Ad:</span>{' '}
                    <span className="font-medium">{selectedOrder.customer_info.name}</span>
                  </p>
                  <p>
                    <span className="text-text-secondary">Telefon:</span>{' '}
                    <span className="font-medium">{selectedOrder.customer_info.phone}</span>
                  </p>
                  <p>
                    <span className="text-text-secondary">Adres:</span>{' '}
                    <span className="font-medium">{selectedOrder.customer_info.address}</span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Ürünler</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Ürün</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Miktar</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Birim Fiyat</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{item.name}</td>
                          <td className="px-4 py-3 text-sm">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">₺{item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            ₺{item.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ara Toplam</span>
                    <span className="font-medium">₺{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Teslimat Ücreti</span>
                    <span className="font-medium">₺{selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Genel Toplam</span>
                    <span className="text-primary">₺{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              {getNextStatuses(selectedOrder.status).length > 0 && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-3">Durum Güncelle</h3>
                  <div className="flex flex-wrap gap-2">
                    {getNextStatuses(selectedOrder.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
                      >
                        {getStatusText(status)} olarak işaretle
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-text-secondary">Bu sipariş tamamlanmıştır.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
