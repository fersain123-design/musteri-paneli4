import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import api from '../../src/services/api';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '../../src/components/Toast';

const { width, height } = Dimensions.get('window');

interface Order {
  _id: string;
  user_id: string;
  vendor_id: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  phone: string;
  status: OrderStatus;
  delivery_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'Bekliyor', color: '#92400e', bgColor: '#fef3c7', icon: 'time' },
  accepted: { label: 'Kabul Edildi', color: '#1e40af', bgColor: '#dbeafe', icon: 'checkmark-circle' },
  preparing: { label: 'Hazırlanıyor', color: '#3730a3', bgColor: '#e0e7ff', icon: 'restaurant' },
  ready: { label: 'Hazır', color: '#065f46', bgColor: '#d1fae5', icon: 'checkmark-done' },
  delivering: { label: 'Yolda', color: '#5b21b6', bgColor: '#e9d5ff', icon: 'bicycle' },
  completed: { label: 'Tamamlandı', color: '#047857', bgColor: '#d1fae5', icon: 'checkmark-done-circle' },
  cancelled: { label: 'İptal Edildi', color: '#991b1b', bgColor: '#fee2e2', icon: 'close-circle' },
};

export default function Orders() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    loadOrders();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      showToast({
        message: 'Siparişler yüklenemedi',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeOrderDetails = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedOrder(null);
    });
  };

  const getFilteredOrders = () => {
    switch (filter) {
      case 'active':
        return orders.filter(
          (o) => !['completed', 'cancelled'].includes(o.status)
        );
      case 'completed':
        return orders.filter((o) =>
          ['completed', 'cancelled'].includes(o.status)
        );
      default:
        return orders;
    }
  };

  const getStatusProgress = (status: OrderStatus): number => {
    const progressMap: Record<OrderStatus, number> = {
      pending: 0.2,
      accepted: 0.4,
      preparing: 0.6,
      ready: 0.8,
      delivering: 0.9,
      completed: 1,
      cancelled: 0,
    };
    return progressMap[status] || 0;
  };

  const renderOrderCard = ({ item, index }: { item: Order; index: number }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const orderDate = new Date(item.created_at);
    const progress = getStatusProgress(item.status);

    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openOrderDetails(item)}
        >
          {/* Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.orderDate}>
                {format(orderDate, 'dd MMM yyyy, HH:mm')}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <Ionicons
                name={statusConfig.icon as any}
                size={14}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {!['completed', 'cancelled'].includes(item.status) && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#0B3E25', '#0f3a1a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </View>
          )}

          {/* Items Summary */}
          <View style={styles.itemsSummary}>
            <View style={styles.itemsRow}>
              <Ionicons name="cube-outline" size={16} color="#6b7280" />
              <Text style={styles.itemsText}>
                {item.items.length} ürün ({item.items.reduce((sum, i) => sum + i.quantity, 0)} adet)
              </Text>
            </View>
            <View style={styles.itemsRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.delivery_address}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.orderFooter}>
            <View style={styles.deliveryBadge}>
              <Ionicons
                name={item.delivery_type === 'self' ? 'storefront' : 'bicycle'}
                size={14}
                color="#0B3E25"
              />
              <Text style={styles.deliveryText}>
                {item.delivery_type === 'self' ? 'Manav Teslim' : 'Kurye'}
              </Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Toplam:</Text>
              <Text style={styles.totalAmount}>{item.total.toFixed(2)} TL</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => openOrderDetails(item)}
          >
            <Text style={styles.detailsButtonText}>Detayları Gör</Text>
            <Ionicons name="chevron-forward" size={18} color="#0B3E25" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const statusConfig = STATUS_CONFIG[selectedOrder.status];
    const orderDate = new Date(selectedOrder.created_at);

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeOrderDetails}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: modalSlideAnim }] },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Sipariş #{selectedOrder._id.slice(-6).toUpperCase()}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeOrderDetails}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Status Section */}
              <View style={styles.modalSection}>
                <View
                  style={[
                    styles.modalStatusBadge,
                    { backgroundColor: statusConfig.bgColor },
                  ]}
                >
                  <Ionicons
                    name={statusConfig.icon as any}
                    size={24}
                    color={statusConfig.color}
                  />
                  <Text
                    style={[
                      styles.modalStatusText,
                      { color: statusConfig.color },
                    ]}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
                <Text style={styles.modalDate}>
                  {format(orderDate, 'dd MMMM yyyy, HH:mm')}
                </Text>
              </View>

              {/* Items Section */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Ürünler</Text>
                {selectedOrder.items.map((item, index) => (
                  <View key={index} style={styles.modalItem}>
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemName}>{item.product_name}</Text>
                      <Text style={styles.modalItemQuantity}>
                        {item.quantity} x {item.price.toFixed(2)} TL
                      </Text>
                    </View>
                    <Text style={styles.modalItemTotal}>
                      {item.total.toFixed(2)} TL
                    </Text>
                  </View>
                ))}
              </View>

              {/* Delivery Info */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Teslimat Bilgileri</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#6b7280" />
                  <Text style={styles.infoText}>{selectedOrder.delivery_address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={20} color="#6b7280" />
                  <Text style={styles.infoText}>{selectedOrder.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name={selectedOrder.delivery_type === 'self' ? 'storefront' : 'bicycle'}
                    size={20}
                    color="#6b7280"
                  />
                  <Text style={styles.infoText}>
                    {selectedOrder.delivery_type === 'self'
                      ? 'Manav Götürecek'
                      : 'Platform Kuryesi'}
                  </Text>
                </View>
                {selectedOrder.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Not:</Text>
                    <Text style={styles.notesText}>{selectedOrder.notes}</Text>
                  </View>
                )}
              </View>

              {/* Payment Summary */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Ödeme Özeti</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ara Toplam</Text>
                  <Text style={styles.summaryValue}>
                    {selectedOrder.subtotal.toFixed(2)} TL
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Teslimat Ücreti</Text>
                  <Text style={styles.summaryValue}>
                    {selectedOrder.delivery_fee === 0
                      ? 'ÜCRETSİZ'
                      : `${selectedOrder.delivery_fee.toFixed(2)} TL`}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabelModal}>Toplam</Text>
                  <Text style={styles.totalAmountModal}>
                    {selectedOrder.total.toFixed(2)} TL
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            {!['completed', 'cancelled'].includes(selectedOrder.status) && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={() => {
                    showToast({
                      message: 'Destek özelliği yakında eklenecek',
                      type: 'info',
                    });
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6b7280" />
                  <Text style={styles.supportButtonText}>Destek</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => {
                    showToast({
                      message: 'Takip özelliği yakında eklenecek',
                      type: 'info',
                    });
                  }}
                >
                  <LinearGradient
                    colors={['#0B3E25', '#0f3a1a']}
                    style={styles.trackButtonGradient}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.trackButtonText}>Siparişi Takip Et</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B3E25" />
        <Text style={styles.loadingText}>Siparişler yükleniyor...</Text>
      </View>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Siparişlerim</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            Tümü ({orders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'active' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('active')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'active' && styles.filterTabTextActive,
            ]}
          >
            Aktif (
            {orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length}
            )
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Geçmiş (
            {orders.filter((o) => ['completed', 'cancelled'].includes(o.status)).length}
            )
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0B3E25"
            />
          }
        >
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={['#f3f4f6', '#e5e7eb']}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="receipt-outline" size={80} color="#9ca3af" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyText}>Henüz sipariş yok</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'active'
              ? 'Aktif siparişiniz bulunmuyor'
              : filter === 'completed'
              ? 'Geçmiş siparişiniz bulunmuyor'
              : 'Sipariş vermek için alışverişe başlayın'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0B3E25"
              colors={['#0B3E25']}
            />
          }
        />
      )}

      {/* Order Details Modal */}
      {renderOrderDetails()}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 24, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  filterTabs: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  filterTabActive: { backgroundColor: '#f0fdf4' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: '#0f3a1a' },
  listContent: { padding: 20 },
  orderCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderHeaderLeft: { flex: 1 },
  orderId: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  orderDate: { fontSize: 13, color: colors.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressContainer: { marginBottom: 16 },
  progressBar: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  itemsSummary: { gap: 8, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemsText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  addressText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  deliveryText: { fontSize: 12, fontWeight: '600', color: '#0f3a1a' },
  totalContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#0f3a1a' },
  detailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0fdf4', gap: 6 },
  detailsButtonText: { fontSize: 14, fontWeight: '600', color: '#0B3E25' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { marginBottom: 24 },
  emptyIconGradient: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20 },
  modalScroll: { flex: 1 },
  modalSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalStatusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 12, marginBottom: 12 },
  modalStatusText: { fontSize: 18, fontWeight: 'bold' },
  modalDate: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalItemInfo: { flex: 1 },
  modalItemName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  modalItemQuantity: { fontSize: 13, color: colors.textSecondary },
  modalItemTotal: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  infoText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  notesContainer: { backgroundColor: colors.background, padding: 12, borderRadius: 8, marginTop: 8 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  totalLabelModal: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  totalAmountModal: { fontSize: 24, fontWeight: 'bold', color: '#0f3a1a' },
  modalActions: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  supportButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: colors.card, gap: 8 },
  supportButtonText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  trackButton: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  trackButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  trackButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
