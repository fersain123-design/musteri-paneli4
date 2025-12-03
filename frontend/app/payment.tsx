import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';
import { showToast } from '../src/components/Toast';
import { useTheme } from '../src/contexts/ThemeContext';
import api from '../src/services/api';
import * as Linking from 'expo-linking';

interface PaymentPackage {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
}

export default function Payment() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuthStore();
  const { cart } = useCartStore();

  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await api.get('/payment/packages');
      setPackages(response.data);
      setLoadingPackages(false);
    } catch (error) {
      console.error('Error loading packages:', error);
      showToast({
        message: 'Paketler yüklenemedi',
        type: 'error',
      });
      setLoadingPackages(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      showToast({
        message: 'Lütfen bir paket seçin',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      // Get origin URL for success/cancel redirects
      const originUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.replace('/api', '') || 'https://shopping-app-16.preview.emergentagent.com';

      const response = await api.post('/payment/create-session', {
        package_id: selectedPackage,
        origin_url: originUrl,
      });

      const { url } = response.data;

      // Open Stripe checkout in browser
      await Linking.openURL(url);

      showToast({
        message: 'Ödeme sayfasına yönlendiriliyorsunuz...',
        type: 'info',
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      showToast({
        message: error.response?.data?.detail || 'Ödeme başlatılamadı',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPackages) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B3E25" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödeme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Summary */}
        {cart && cart.items && cart.items.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Sepet Özeti</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ürünler</Text>
              <Text style={styles.summaryValue}>{cart.items.length} adet</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Toplam</Text>
              <Text style={styles.summaryTotal}>₺{cart.total_price?.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Payment Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Paketi Seçin</Text>
          <Text style={styles.sectionSubtitle}>
            Güvenli ödeme için bir paket seçin
          </Text>

          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.packageCard,
                selectedPackage === pkg.id && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage(pkg.id)}
              activeOpacity={0.7}
            >
              <View style={styles.packageHeader}>
                <View style={styles.packageIconContainer}>
                  <Ionicons
                    name="card-outline"
                    size={24}
                    color={selectedPackage === pkg.id ? '#0B3E25' : colors.textSecondary}
                  />
                </View>
                <View style={styles.packageInfo}>
                  <Text style={[
                    styles.packageName,
                    selectedPackage === pkg.id && styles.packageNameSelected,
                  ]}>
                    {pkg.name}
                  </Text>
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                </View>
                <View style={styles.packagePriceContainer}>
                  <Text style={[
                    styles.packageAmount,
                    selectedPackage === pkg.id && styles.packageAmountSelected,
                  ]}>
                    ₺{pkg.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.packageCurrency}>{pkg.currency.toUpperCase()}</Text>
                </View>
              </View>
              {selectedPackage === pkg.id && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#0B3E25" />
                  <Text style={styles.selectedText}>Seçildi</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Security Info */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Güvenli Ödeme</Text>
            <Text style={styles.infoText}>
              Tüm ödemeler Stripe tarafından güvence altındadır. Kart bilgileriniz şifrelenir ve saklanmaz.
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="card" size={24} color="#3b82f6" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>3D Secure</Text>
            <Text style={styles.infoText}>
              Tüm ödemeler 3D Secure ile korunmaktadır
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, !selectedPackage && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading || !selectedPackage}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!selectedPackage ? ['#9ca3af', '#6b7280'] : ['#0B3E25', '#0f3a1a']}
            style={styles.payButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Güvenli Ödeme Yap</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 10 : 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    summaryCard: {
      backgroundColor: colors.card,
      margin: 20,
      marginBottom: 8,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    summaryTotal: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#0B3E25',
    },
    section: {
      padding: 20,
      paddingTop: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    packageCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    packageCardSelected: {
      borderColor: '#0B3E25',
      backgroundColor: '#0B3E2510',
    },
    packageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    packageIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    packageInfo: {
      flex: 1,
    },
    packageName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    packageNameSelected: {
      color: '#0B3E25',
    },
    packageDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    packagePriceContainer: {
      alignItems: 'flex-end',
    },
    packageAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    packageAmountSelected: {
      color: '#0B3E25',
    },
    packageCurrency: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    selectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#0B3E2530',
      gap: 6,
    },
    selectedText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0B3E25',
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTextContainer: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    payButton: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    payButtonDisabled: {
      opacity: 0.6,
    },
    payButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    payButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });
