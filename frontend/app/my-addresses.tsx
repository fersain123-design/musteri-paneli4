import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '../src/components/Toast';
import { useTheme } from '../src/contexts/ThemeContext';

interface Address {
  id: string;
  title: string;
  fullAddress: string;
  isDefault: boolean;
}

// Mock data
const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    title: 'Ev',
    fullAddress: 'Güzelyalı Mah. Atatürk Cad. No:123 Daire:5 Çukurova/Adana',
    isDefault: true,
  },
  {
    id: '2',
    title: 'İş',
    fullAddress: 'Seyhan Mah. İnönü Bulvarı No:45 Kat:3 Seyhan/Adana',
    isDefault: false,
  },
];

export default function MyAddresses() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);

  const handleSetDefault = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
    showToast({
      message: 'Varsayılan adres güncellendi',
      type: 'success',
    });
  };

  const handleDelete = (id: string) => {
    const address = addresses.find(a => a.id === id);
    
    Alert.alert(
      'Adresi Sil',
      `${address?.title} adresini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setAddresses(prev => prev.filter(a => a.id !== id));
            showToast({
              message: 'Adres silindi',
              type: 'success',
            });
          },
        },
      ]
    );
  };

  const handleEdit = (id: string) => {
    showToast({
      message: 'Düzenleme özelliği yakında eklenecek',
      type: 'info',
    });
  };

  const handleAddNew = () => {
    router.push('/add-address');
  };

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
        <Text style={styles.headerTitle}>Adreslerim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Address List */}
        {addresses.map((address, index) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressTitleRow}>
                <View style={styles.addressIconContainer}>
                  <Ionicons
                    name={address.title === 'Ev' ? 'home' : 'briefcase'}
                    size={20}
                    color="#0B3E25"
                  />
                </View>
                <Text style={styles.addressTitle}>{address.title}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Varsayılan</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleEdit(address.id)}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.addressText}>{address.fullAddress}</Text>

            {/* Actions */}
            <View style={styles.addressActions}>
              {!address.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(address.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#0B3E25" />
                  <Text style={styles.actionButtonText}>Varsayılan Yap</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(address.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.actionButtonText, styles.deleteText]}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Empty State */}
        {addresses.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz adres eklemediniz</Text>
            <Text style={styles.emptySubtitle}>
              İlk adresinizi ekleyerek hızlı teslimat alın
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Adresleriniz güvenli bir şekilde saklanır ve sadece teslimat için kullanılır
          </Text>
        </View>
      </ScrollView>

      {/* Add New Address Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNew}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0B3E25', '#0f3a1a']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Yeni Adres Ekle</Text>
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
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    addressCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    addressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addressTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    addressIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#0B3E2515',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    addressTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginRight: 8,
    },
    defaultBadge: {
      backgroundColor: '#0B3E25',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    defaultText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#fff',
    },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addressText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    addressActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#0B3E2510',
      flex: 1,
      justifyContent: 'center',
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#0B3E25',
    },
    deleteButton: {
      backgroundColor: '#fee2e2',
    },
    deleteText: {
      color: '#ef4444',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#dbeafe',
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: '#1e40af',
      lineHeight: 18,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addButton: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    addButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });
