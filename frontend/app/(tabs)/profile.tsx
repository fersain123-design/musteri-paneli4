import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { showToast } from '../../src/components/Toast';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  show: boolean;
  badge?: string;
  color?: string;
}

export default function Profile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = getStyles(colors);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast({
              message: 'Başarıyla çıkış yapıldı',
              type: 'success',
            });
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const handleMenuPress = (id: string) => {
    switch (id) {
      case 'edit-profile':
        router.push('/edit-profile');
        break;
      case 'addresses':
        router.push('/my-addresses');
        break;
      case 'payment':
        showToast({
          message: 'Ödeme yöntemleri yakında eklenecek',
          type: 'info',
        });
        break;
      case 'favorites':
        showToast({
          message: 'Favoriler özelliği yakında eklenecek',
          type: 'info',
        });
        break;
      case 'notifications':
        // Already handled by switch
        break;
      case 'language':
        showToast({
          message: 'Dil ayarları yakında eklenecek',
          type: 'info',
        });
        break;
      case 'help':
        showToast({
          message: 'Yardım merkezi yakında eklenecek',
          type: 'info',
        });
        break;
      case 'about':
        Alert.alert(
          'Manavım',
          'Versiyon 1.0.0\n\nTaze meyve ve sebzeler kapınızda!\n\n© 2024 Manavım. Tüm hakları saklıdır.',
          [{ text: 'Tamam' }]
        );
        break;
      case 'privacy':
        showToast({
          message: 'Gizlilik politikası yakında eklenecek',
          type: 'info',
        });
        break;
      case 'terms':
        showToast({
          message: 'Kullanım koşulları yakında eklenecek',
          type: 'info',
        });
        break;
      default:
        break;
    }
  };

  const menuSections = [
    {
      title: 'Hesap',
      items: [
        {
          id: 'edit-profile',
          icon: 'person-outline',
          title: 'Profili Düzenle',
          subtitle: 'Ad, telefon ve diğer bilgiler',
          show: true,
          color: '#3b82f6',
        },
        {
          id: 'addresses',
          icon: 'location-outline',
          title: 'Adreslerim',
          subtitle: 'Teslimat adreslerini yönet',
          show: true,
          color: '#0B3E25',
        },
        {
          id: 'payment',
          icon: 'card-outline',
          title: 'Ödeme Yöntemleri',
          subtitle: 'Kart ve ödeme bilgileri',
          show: true,
          color: '#F4A51C',
        },
      ],
    },
    {
      title: 'Tercihler',
      items: [
        {
          id: 'favorites',
          icon: 'heart-outline',
          title: 'Favorilerim',
          subtitle: 'Beğendiğin ürünler',
          show: true,
          color: '#ef4444',
        },
        {
          id: 'notifications',
          icon: 'notifications-outline',
          title: 'Bildirimler',
          subtitle: 'Push bildirimleri yönet',
          show: true,
          color: '#8b5cf6',
        },
        {
          id: 'language',
          icon: 'language-outline',
          title: 'Dil',
          subtitle: 'Türkçe',
          show: true,
          color: '#06b6d4',
        },
      ],
    },
    {
      title: 'Destek',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          title: 'Yardım Merkezi',
          subtitle: 'SSS ve destek',
          show: true,
          color: '#0B3E25',
        },
        {
          id: 'about',
          icon: 'information-circle-outline',
          title: 'Hakkımızda',
          subtitle: 'Uygulama bilgileri',
          show: true,
          color: '#6b7280',
        },
      ],
    },
    {
      title: 'Yasal',
      items: [
        {
          id: 'privacy',
          icon: 'shield-checkmark-outline',
          title: 'Gizlilik Politikası',
          subtitle: 'Veri koruma ve gizlilik',
          show: true,
          color: '#3b82f6',
        },
        {
          id: 'terms',
          icon: 'document-text-outline',
          title: 'Kullanım Koşulları',
          subtitle: 'Şartlar ve koşullar',
          show: true,
          color: '#6b7280',
        },
      ],
    },
  ];

  const stats = [
    { label: 'Siparişler', value: '0', icon: 'receipt', color: '#0B3E25' },
    { label: 'Favoriler', value: '0', icon: 'heart', color: '#ef4444' },
    { label: 'Puanlar', value: '0', icon: 'star', color: '#F4A51C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0B3E25', '#0f3a1a', '#047857']}
            style={styles.headerGradient}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.userName}>{user?.full_name || 'Kullanıcı'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            
            {user?.phone && (
              <View style={styles.phoneContainer}>
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: `${stat.color}20` },
                    ]}
                  >
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Menu Sections */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items
                  .filter((item) => item.show)
                  .map((item, itemIndex) => (
                    <View key={item.id}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.menuIconContainer,
                            { backgroundColor: `${item.color}15` },
                          ]}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={22}
                            color={item.color}
                          />
                        </View>
                        
                        <View style={styles.menuTextContainer}>
                          <View style={styles.menuTitleRow}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            {item.badge && (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                        </View>

                        {item.id === 'notifications' ? (
                          <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#d1d5db', true: '#86efac' }}
                            thumbColor={notificationsEnabled ? '#0B3E25' : '#f3f4f6'}
                            ios_backgroundColor="#d1d5db"
                            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                          />
                        ) : (
                          <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                        )}
                      </TouchableOpacity>
                      
                      {itemIndex < section.items.filter((i) => i.show).length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  ))}
              </View>
            </View>
          ))}

          {/* App Settings Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
            <View style={styles.sectionContent}>
              <View style={styles.menuItem}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#3b82f615' },
                  ]}
                >
                  <Ionicons name="moon-outline" size={22} color="#3b82f6" />
                </View>
                
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Karanlık Mod</Text>
                  <Text style={styles.menuSubtitle}>Koyu tema kullan</Text>
                </View>

                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={isDark ? '#3b82f6' : '#f3f4f6'}
                  ios_backgroundColor="#d1d5db"
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.menuItem}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#0B3E2515' },
                  ]}
                >
                  <Ionicons name="location-outline" size={22} color="#0B3E25" />
                </View>
                
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Konum Servisleri</Text>
                  <Text style={styles.menuSubtitle}>Konumunu paylaş</Text>
                </View>

                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={locationEnabled ? '#0B3E25' : '#f3f4f6'}
                  ios_backgroundColor="#d1d5db"
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
              </View>
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </View>
          </TouchableOpacity>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Manavım v1.0.0</Text>
            <Text style={styles.appCopyright}>© 2024 Tüm hakları saklıdır</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { marginBottom: 20 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 32, paddingHorizontal: 24 },
  avatarContainer: { alignSelf: 'center', marginBottom: 16, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#0B3E25' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f3a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0B3E25' },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  userEmail: { fontSize: 15, color: '#fff', opacity: 0.9, textAlign: 'center', marginBottom: 8 },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 },
  userPhone: { fontSize: 14, color: '#fff', opacity: 0.9 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statItem: { alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#fff', opacity: 0.9 },
  menuContainer: { paddingHorizontal: 20 },
  menuSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  sectionContent: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTextContainer: { flex: 1 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  badge: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  menuSubtitle: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
  logoutButton: { backgroundColor: colors.surface, borderRadius: 16, marginTop: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#fee2e2' },
  logoutContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoutIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e215', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#dc2626', flex: 1 },
  appInfo: { alignItems: 'center', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border },
  appVersion: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  appCopyright: { fontSize: 11, color: colors.textSecondary },
});
