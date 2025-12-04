import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  RefreshControl,
  Share,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../src/store/cartStore';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '../../src/components/Toast';
import { useTheme } from '../../src/contexts/ThemeContext';
import { CartCouponModal } from '../../src/components/CartCouponModal';
import { CartGiftWrapModal } from '../../src/components/CartGiftWrapModal';
import { CartSwipeableItem } from '../../src/components/CartSwipeableItem';

const { width, height } = Dimensions.get('window');

interface ProductDetails {
  [key: string]: any;
}

interface CouponData {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
}

// Mock coupons for demo
const MOCK_COUPONS: { [key: string]: CouponData } = {
  'YENI50': { code: 'YENI50', discount: 50, type: 'fixed' },
  'INDIRIM20': { code: 'INDIRIM20', discount: 20, type: 'percentage' },
  'HOSGELDIN': { code: 'HOSGELDIN', discount: 10, type: 'fixed' },
};

export default function CartNew() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { cart, isLoading, fetchCart, updateCartItem, removeFromCart, clearCart } = useCartStore();
  
  // Product details state
  const [products, setProducts] = useState<ProductDetails>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced features state
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());
  const [selectedGiftWrap, setSelectedGiftWrap] = useState<any | null>(null);
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  
  // Modal visibility states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showGiftWrapModal, setShowGiftWrapModal] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const summarySlideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Lifecycle effects
  useEffect(() => {
    fetchCart();
    startAnimations();
    loadFavorites();
  }, []);

  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0) {
      loadProductDetails();
    }
  }, [cart]);

  // Load favorites from storage (mock implementation)
  const loadFavorites = async () => {
    // In real app, load from AsyncStorage
    // const favs = await AsyncStorage.getItem('favoriteItems');
    // if (favs) setFavoriteItems(new Set(JSON.parse(favs)));
  };

  // Animation functions
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
      Animated.spring(summarySlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const headerPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(headerScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Data loading functions
  const loadProductDetails = async () => {
    if (!cart || !cart.items) return;
    
    setLoadingProducts(true);
    try {
      const productDetails: ProductDetails = {};
      for (const item of cart.items) {
        try {
          const response = await api.get(`/products/${item.product_id}`);
          productDetails[item.product_id] = response.data;
        } catch (error) {
          console.error(`Failed to load product ${item.product_id}:`, error);
        }
      }
      setProducts(productDetails);
    } catch (error) {
      console.error('Failed to load product details:', error);
      showToast({
        message: 'Ürün bilgileri yüklenemedi',
        type: 'error',
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCart();
      await loadProductDetails();
      showToast({
        message: 'Sepet güncellendi',
        type: 'success',
        duration: 1500,
      });
    } catch (error) {
      showToast({
        message: 'Güncelleme başarısız',
        type: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Cart manipulation functions
  const handleUpdateQuantity = async (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    // Check stock
    const product = products[productId];
    if (product && newQuantity > product.stock) {
      Vibration.vibrate(100);
      showToast({
        message: `Stokta sadece ${product.stock} adet var`,
        type: 'warning',
      });
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(productId));
    
    try {
      await updateCartItem(productId, newQuantity);
      pulseAnimation();
      headerPulseAnimation();
      showToast({
        message: 'Miktar güncellendi',
        type: 'success',
        duration: 1500,
      });
    } catch (error: any) {
      Vibration.vibrate(200);
      showToast({
        message: error.message || 'Güncelleme başarısız',
        type: 'error',
      });
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const product = products[productId];
    const productName = product?.name || 'Ürün';

    Alert.alert(
      'Ürünü Kaldır',
      `${productName} sepetten kaldırılsın mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            setRemovingItems(prev => new Set(prev).add(productId));
            Vibration.vibrate(50);
            try {
              await removeFromCart(productId);
              headerPulseAnimation();
              showToast({
                message: `${productName} sepetten kaldırıldı`,
                type: 'success',
              });
            } catch (error: any) {
              showToast({
                message: error.message || 'Kaldırma başarısız',
                type: 'error',
              });
            } finally {
              setRemovingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Sepeti Temizle',
      'Tüm ürünleri sepetten kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
              Vibration.vibrate(100);
              // Clear all additional selections
              setAppliedCoupon(null);
              setSelectedGiftWrap(null);
              setGiftMessage('');
              showToast({
                message: 'Sepet temizlendi',
                type: 'success',
              });
            } catch (error) {
              showToast({
                message: 'Sepet temizlenemedi',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  // Enhanced features handlers
  const handleToggleFavorite = (productId: string) => {
    setFavoriteItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        showToast({
          message: 'Favorilerden çıkarıldı',
          type: 'info',
          duration: 1500,
        });
      } else {
        newSet.add(productId);
        showToast({
          message: 'Favorilere eklendi',
          type: 'success',
          duration: 1500,
        });
      }
      // In real app: AsyncStorage.setItem('favoriteItems', JSON.stringify([...newSet]));
      return newSet;
    });
    Vibration.vibrate(50);
  };

  const handleApplyCoupon = async (code: string): Promise<boolean> => {
    // Mock coupon validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const coupon = MOCK_COUPONS[code];
    if (coupon) {
      setAppliedCoupon(coupon);
      Vibration.vibrate([50, 100, 50]);
      showToast({
        message: `${code} kuponu uygulandı!`,
        type: 'success',
      });
      return true;
    }
    return false;
  };

  const handleRemoveCoupon = () => {
    Alert.alert(
      'Kuponu Kaldır',
      'Uygulanan kuponu kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          onPress: () => {
            setAppliedCoupon(null);
            showToast({
              message: 'Kupon kaldırıldı',
              type: 'info',
            });
          },
        },
      ]
    );
  };

  const handleSelectGiftWrap = (option: any | null, message?: string) => {
    setSelectedGiftWrap(option);
    if (message) setGiftMessage(message);
    if (option && option.id !== 'none') {
      showToast({
        message: `${option.name} seçildi`,
        type: 'success',
      });
    }
  };

  const handleShareCart = async () => {
    try {
      if (!cart || cart.items.length === 0) return;
      
      const productList = cart.items
        .map((item, index) => {
          const product = products[item.product_id];
          return `${index + 1}. ${product?.name || 'Ürün'} x${item.quantity}`;
        })
        .join('\n');
      
      const message = `MANAVIM Sepetim 🛒\n\n${productList}\n\nToplam: ${getTotalWithAllExtras().toFixed(2)} TL`;
      
      await Share.share({
        message,
        title: 'MANAVIM Sepetim',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;

    // Check stock availability
    let hasStockIssue = false;
    for (const item of cart.items) {
      const product = products[item.product_id];
      if (!product || !product.is_available) {
        showToast({
          message: `${product?.name || 'Bir ürün'} artık mevcut değil`,
          type: 'error',
        });
        hasStockIssue = true;
        break;
      }
      if (product.stock < item.quantity) {
        showToast({
          message: `${product.name} için yetersiz stok`,
          type: 'error',
        });
        hasStockIssue = true;
        break;
      }
    }

    if (hasStockIssue) return;

    // Calculate final details
    const finalTotal = getTotalWithAllExtras();
    const orderDetails = {
      items: cart.items.length,
      total: finalTotal,
      giftWrap: selectedGiftWrap,
      coupon: appliedCoupon,
    };

    Alert.alert(
      'Sipariş Onayı',
      `${orderDetails.items} ürün\nToplam: ${finalTotal.toFixed(2)} TL\n\nÖdeme sayfasına yönlendiriliyorsunuz`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam Et',
          onPress: () => {
            Vibration.vibrate([100, 50, 100]);
            router.push('/payment');
          },
        },
      ]
    );
  };

  // Calculation functions
  const calculateSavings = useMemo(() => {
    if (!cart || !cart.items) return 0;
    
    let savings = 0;
    cart.items.forEach(item => {
      const product = products[item.product_id];
      if (product && product.discount_percentage > 0) {
        const originalPrice = product.price / (1 - product.discount_percentage / 100);
        savings += (originalPrice - product.price) * item.quantity;
      }
    });
    
    return savings;
  }, [cart, products]);

  const getCouponDiscount = useMemo(() => {
    if (!appliedCoupon || !cart) return 0;
    
    if (appliedCoupon.type === 'percentage') {
      return (cart.total * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  }, [appliedCoupon, cart]);

  const getDeliveryFee = useMemo(() => {
    if (!cart) return 15;
    const total = cart.total - getCouponDiscount;
    
    if (total < 100) return 15;
    if (total < 200) return 10;
    return 0; // Free delivery
  }, [cart, getCouponDiscount]);

  const getGiftWrapFee = useMemo(() => {
    return selectedGiftWrap?.price || 0;
  }, [selectedGiftWrap]);

  const getTotalWithAllExtras = useCallback(() => {
    if (!cart) return 0;
    return cart.total - getCouponDiscount + getDeliveryFee + getGiftWrapFee;
  }, [cart, getCouponDiscount, getDeliveryFee, getGiftWrapFee]);

  // Render functions
  const renderCartItem = ({ item, index }: { item: any; index: number }) => {
    const product = products[item.product_id];
    const isUpdating = updatingItems.has(item.product_id);
    const isRemoving = removingItems.has(item.product_id);
    const isFavorite = favoriteItems.has(item.product_id);
    const itemTotal = item.quantity * item.price;
    const hasDiscount = product?.discount_percentage > 0;

    return (
      <CartSwipeableItem
        onDelete={() => handleRemoveItem(item.product_id)}
        onFavorite={() => handleToggleFavorite(item.product_id)}
        isFavorite={isFavorite}
      >
        <Animated.View
          style={[
            styles.cartItem,
            {
              opacity: isRemoving ? 0.5 : fadeAnim,
              transform: [
                {
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <View style={styles.cartItemRow}>
            {/* Product Image */}
            <View style={styles.productImageContainer}>
              {product?.image || (product?.images && product.images.length > 0) ? (
                <Image
                  source={{ uri: product.image || product.images[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="leaf" size={48} color="#0B3E25" />
                </View>
              )}
              
              {/* Discount Badge */}
              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>%{product.discount_percentage}</Text>
                </View>
              )}
              
              {/* Favorite Badge */}
              {isFavorite && (
                <View style={styles.favoriteBadge}>
                  <Ionicons name="heart" size={16} color="#ef4444" />
                </View>
              )}
              
              {/* Unavailable Overlay */}
              {!product?.is_available && (
                <View style={styles.unavailableOverlay}>
                  <Text style={styles.unavailableText}>Mevcut değil</Text>
                </View>
              )}
            </View>
            
            {/* Product Details */}
            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {product?.name || 'Yükleniyor...'}
                </Text>
                {product?.quality_grade && (
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityText}>{product.quality_grade}</Text>
                  </View>
                )}
              </View>
              
              {product?.category && (
                <Text style={styles.itemCategory}>{product.category}</Text>
              )}
              
              {/* Price Row */}
              <View style={styles.priceRow}>
                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>
                    {item.price.toFixed(2)} TL/{product?.unit || 'adet'}
                  </Text>
                  {hasDiscount && (
                    <Text style={styles.originalPrice}>
                      {(item.price / (1 - product.discount_percentage / 100)).toFixed(2)} TL
                    </Text>
                  )}
                </View>
                <Text style={styles.itemTotal}>{itemTotal.toFixed(2)} TL</Text>
              </View>

              {/* Actions Row */}
              <View style={styles.actionsRow}>
                {/* Quantity Controls */}
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      (isUpdating || item.quantity <= 1) && styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleUpdateQuantity(item.product_id, item.quantity, -1)}
                    disabled={isUpdating || item.quantity <= 1}
                  >
                    {isUpdating && item.quantity === 1 ? (
                      <ActivityIndicator size="small" color="#0B3E25" />
                    ) : (
                      <Ionicons
                        name="remove"
                        size={18}
                        color={item.quantity <= 1 ? '#d1d5db' : '#0B3E25'}
                      />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.quantityDisplay}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#0B3E25" />
                    ) : (
                      <Text style={styles.quantity}>{item.quantity}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      (isUpdating || (product && item.quantity >= product.stock)) &&
                        styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleUpdateQuantity(item.product_id, item.quantity, 1)}
                    disabled={isUpdating || (product && item.quantity >= product.stock)}
                  >
                    {isUpdating && item.quantity > 1 ? (
                      <ActivityIndicator size="small" color="#0B3E25" />
                    ) : (
                      <Ionicons
                        name="add"
                        size={18}
                        color={product && item.quantity >= product.stock ? '#d1d5db' : '#0B3E25'}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Stock Info */}
                {product && product.stock > 0 && product.stock <= 5 && (
                  <View style={styles.lowStockBadge}>
                    <Ionicons name="warning" size={12} color="#F4A51C" />
                    <Text style={styles.lowStockText}>{product.stock} kaldı</Text>
                  </View>
                )}
              </View>

              {/* Stock Warning */}
              {product && item.quantity > product.stock && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={14} color="#F4A51C" />
                  <Text style={styles.warningText}>
                    Stokta sadece {product.stock} adet var
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </CartSwipeableItem>
    );
  };

  const renderEnhancedOptions = () => (
    <View style={styles.enhancedOptionsContainer}>
      {/* Gift Wrap */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => setShowGiftWrapModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.optionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="gift-outline" size={20} color="#92400e" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Hediye Paketi</Text>
            <Text style={styles.optionValue}>
              {selectedGiftWrap && selectedGiftWrap.id !== 'none'
                ? selectedGiftWrap.name
                : 'Yok'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Coupon */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => setShowCouponModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.optionIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="pricetag" size={20} color="#065f46" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Kupon Kodu</Text>
            <Text style={styles.optionValue}>
              {appliedCoupon ? appliedCoupon.code : 'Ekle'}
            </Text>
          </View>
        </View>
        {appliedCoupon ? (
          <TouchableOpacity onPress={handleRemoveCoupon}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => {
    const savings = calculateSavings;
    const couponDiscount = getCouponDiscount;
    const deliveryFee = getDeliveryFee;
    const giftWrapFee = getGiftWrapFee;
    const totalWithAllExtras = getTotalWithAllExtras();

    return (
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: summarySlideAnim }],
          },
        ]}
      >
        <View style={styles.summaryContainer}>
          {/* Subtotal */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ara Toplam</Text>
            <Text style={styles.summaryValue}>{cart?.total.toFixed(2)} TL</Text>
          </View>

          {/* Product Savings */}
          {savings > 0 && (
            <View style={[styles.summaryRow, styles.savingsRow]}>
              <View style={styles.savingsLabel}>
                <Ionicons name="pricetag" size={16} color="#0B3E25" />
                <Text style={styles.summaryLabelGreen}>Ürün İndirimi</Text>
              </View>
              <Text style={styles.summaryValueGreen}>-{savings.toFixed(2)} TL</Text>
            </View>
          )}

          {/* Coupon Discount */}
          {couponDiscount > 0 && (
            <View style={[styles.summaryRow, styles.savingsRow]}>
              <View style={styles.savingsLabel}>
                <Ionicons name="ticket" size={16} color="#0B3E25" />
                <Text style={styles.summaryLabelGreen}>Kupon ({appliedCoupon?.code})</Text>
              </View>
              <Text style={styles.summaryValueGreen}>-{couponDiscount.toFixed(2)} TL</Text>
            </View>
          )}

          {/* Delivery */}
          <View style={styles.summaryRow}>
            <View style={styles.deliveryLabel}>
              <Ionicons name="bicycle-outline" size={16} color="#6b7280" />
              <Text style={styles.summaryLabel}>
                Teslimat
              </Text>
            </View>
            {deliveryFee === 0 ? (
              <Text style={styles.summaryValueGreen}>ÜCRETSİZ</Text>
            ) : (
              <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)} TL</Text>
            )}
          </View>

          {/* Free Delivery Hint */}
          {deliveryFee > 0 && cart && cart.total < 200 && (
            <View style={styles.freeDeliveryHint}>
              <Ionicons name="information-circle" size={16} color="#3b82f6" />
              <Text style={styles.freeDeliveryText}>
                {(200 - cart.total).toFixed(2)} TL daha alışveriş yapın, teslimat ücretsiz!
              </Text>
            </View>
          )}

          {/* Gift Wrap */}
          {giftWrapFee > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.deliveryLabel}>
                <Ionicons name="gift" size={16} color="#6b7280" />
                <Text style={styles.summaryLabel}>Hediye Paketi</Text>
              </View>
              <Text style={styles.summaryValue}>{giftWrapFee.toFixed(2)} TL</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalAmount}>{totalWithAllExtras.toFixed(2)} TL</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareCart}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color="#0B3E25" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#0B3E25', '#0f3a1a']} style={styles.checkoutGradient}>
              <View style={styles.checkoutContent}>
                <View>
                  <Text style={styles.checkoutButtonText}>Siparişi Tamamla</Text>
                  <Text style={styles.checkoutSubtext}>
                    {cart?.items.length} ürün • {totalWithAllExtras.toFixed(2)} TL
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Loading state
  if (isLoading || loadingProducts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B3E25" />
        <Text style={styles.loadingText}>Sepetiniz yükleniyor...</Text>
      </View>
    );
  }

  // Empty cart state
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <Text style={styles.title}>Sepetim</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B3E25']} />
          }
        >
          <Animated.View
            style={[
              styles.emptyContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.emptyIconGradient}>
                <Ionicons name="cart-outline" size={80} color="#9ca3af" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyText}>Sepetiniz boş</Text>
            <Text style={styles.emptySubtext}>Ürün eklemek için alışverişe başlayın</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#0B3E25', '#0f3a1a']} style={styles.shopButtonGradient}>
                <Ionicons name="basket" size={20} color="#fff" />
                <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main cart view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={{ transform: [{ scale: headerScale }] }}>
            <Text style={styles.title}>Sepetim</Text>
          </Animated.View>
          <Text style={styles.itemCount}>{cart.items.length} ürün</Text>
        </View>
        <View style={styles.headerActions}>
          {cart.items.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.product_id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={renderEnhancedOptions}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B3E25']} />
        }
      />

      {/* Summary Footer */}
      {renderSummary()}

      {/* Modals */}
      <CartCouponModal
        visible={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onApply={handleApplyCoupon}
        appliedCoupon={appliedCoupon?.code}
      />

      <CartGiftWrapModal
        visible={showGiftWrapModal}
        onClose={() => setShowGiftWrapModal(false)}
        onSelect={handleSelectGiftWrap}
        selectedOption={selectedGiftWrap}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 16 : 24,
      paddingBottom: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    itemCount: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#fee2e2',
    },
    clearButtonText: {
      fontSize: 14,
      color: '#ef4444',
      fontWeight: '600',
    },
    listContent: {
      padding: 20,
      paddingBottom: 520,
    },
    separator: {
      height: 16,
    },
    enhancedOptionsContainer: {
      marginBottom: 20,
      gap: 12,
    },
    optionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    optionInfo: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    optionValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    cartItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    cartItemRow: {
      flexDirection: 'row',
    },
    productImageContainer: {
      width: 100,
      height: 100,
      borderRadius: 12,
      overflow: 'hidden',
      marginRight: 12,
      position: 'relative',
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    productImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    discountBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: '#ef4444',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    discountText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#fff',
    },
    favoriteBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: '#fff',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    unavailableOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    unavailableText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#fff',
    },
    itemInfo: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    qualityBadge: {
      backgroundColor: '#dbeafe',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    qualityText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#1e40af',
    },
    itemCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0f3a1a',
    },
    originalPrice: {
      fontSize: 12,
      color: '#9ca3af',
      textDecorationLine: 'line-through',
    },
    itemTotal: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
    },
    quantityButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    quantityButtonDisabled: {
      opacity: 0.5,
    },
    quantityDisplay: {
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantity: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    lowStockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#fef3c7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    lowStockText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#92400e',
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      backgroundColor: '#fef3c7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    warningText: {
      fontSize: 11,
      color: '#92400e',
      fontWeight: '500',
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyContent: {
      alignItems: 'center',
      width: '100%',
    },
    emptyIconContainer: {
      marginBottom: 24,
    },
    emptyIconGradient: {
      width: 160,
      height: 160,
      borderRadius: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
    },
    shopButton: {
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    shopButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 32,
      gap: 12,
    },
    shopButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    summaryContainer: {
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    savingsRow: {
      backgroundColor: '#d1fae5',
      marginHorizontal: -12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    savingsLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    summaryLabelGreen: {
      fontSize: 14,
      color: '#065f46',
      fontWeight: '600',
    },
    summaryValueGreen: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0f3a1a',
    },
    deliveryLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    freeDeliveryHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#dbeafe',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 4,
    },
    freeDeliveryText: {
      flex: 1,
      fontSize: 12,
      color: '#1e40af',
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: '#e5e7eb',
      marginVertical: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    totalAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#0f3a1a',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    shareButton: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    checkoutButton: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    checkoutGradient: {
      paddingVertical: 18,
      paddingHorizontal: 24,
    },
    checkoutContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    checkoutButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    checkoutSubtext: {
      fontSize: 12,
      color: '#fff',
      opacity: 0.9,
      marginTop: 2,
    },
  });
