import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
  ImageBackground,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'location',
    title: 'Yakınındaki Manavlar',
    description: 'GPS ile konumunuza en yakın taze ürün satıcılarını keşfedin',
    color: '#10b981',
  },
  {
    icon: 'time',
    title: 'Hızlı Teslimat',
    description: 'Siparişiniz 30 dakika içinde kapınızda',
    color: '#3b82f6',
  },
  {
    icon: 'leaf',
    title: 'Taze Ürünler',
    description: 'Her gün yenilenen, organik ve kaliteli meyveler',
    color: '#059669',
  },
  {
    icon: 'shield-checkmark',
    title: 'Güvenli Ödeme',
    description: 'Kredi kartı, kapıda ödeme ve çok daha fazlası',
    color: '#8b5cf6',
  },
  {
    icon: 'star',
    title: 'Kalite Garantisi',
    description: 'A, B, C kalite seçenekleri ile her bütçeye uygun',
    color: '#f59e0b',
  },
  {
    icon: 'cart',
    title: 'Kolay Alışveriş',
    description: 'Sezgisel arayüz ile saniyeler içinde sipariş',
    color: '#ef4444',
  },
];

const STATS = [
  { number: '10K+', label: 'Mutlu Müşteri' },
  { number: '500+', label: 'Manav' },
  { number: '50K+', label: 'Sipariş' },
  { number: '4.8', label: 'Ortalama Puan' },
];

export default function Welcome() {
  const router = useRouter();
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const featureAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    startFeatureRotation();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  };

  const startFeatureRotation = () => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % FEATURES.length);
      animateFeatureTransition();
    }, 4000);

    return () => clearInterval(interval);
  };

  const animateFeatureTransition = () => {
    Animated.sequence([
      Animated.timing(featureAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(featureAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGetStarted = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/(auth)/register');
    });
  };

  const handleLogin = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/(auth)/login');
    });
  };

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzYzNjU3Mzg4fDA&ixlib=rb-4.1.0&q=85',
        }}
        style={styles.backgroundImage}
        blurRadius={2}
      >
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.95)', 'rgba(5, 150, 105, 0.95)', 'rgba(4, 120, 87, 0.95)']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <Animated.View
                  style={[
                    styles.logoContainer,
                    { transform: [{ rotate: spin }] },
                  ]}
                >
                  <LinearGradient
                    colors={['#fff', '#f0fdf4']}
                    style={styles.logoGradient}
                  >
                    <Ionicons name="basket" size={60} color="#10b981" />
                  </LinearGradient>
                </Animated.View>
                
                <Text style={styles.appName}>Manavım</Text>
                <Text style={styles.tagline}>
                  Taze meyve ve sebzeler kapınızda!
                </Text>
                
                {/* Version badge */}
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>v1.0</Text>
                </View>
              </View>

              {/* Stats Section */}
              <View style={styles.statsContainer}>
                {STATS.map((stat, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.statItem,
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
                    <Text style={styles.statNumber}>{stat.number}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </Animated.View>
                ))}
              </View>

              {/* Current Feature Highlight */}
              <Animated.View
                style={[
                  styles.featureHighlight,
                  {
                    opacity: featureAnim,
                    transform: [
                      {
                        translateX: featureAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: FEATURES[currentFeature].color },
                  ]}
                >
                  <Ionicons
                    name={FEATURES[currentFeature].icon as any}
                    size={28}
                    color="#fff"
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>
                    {FEATURES[currentFeature].title}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {FEATURES[currentFeature].description}
                  </Text>
                </View>
              </Animated.View>

              {/* Feature dots */}
              <View style={styles.dotsContainer}>
                {FEATURES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentFeature === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Features Grid */}
              <View style={styles.featuresGrid}>
                {FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureCard}>
                    <View
                      style={[
                        styles.featureCardIcon,
                        { backgroundColor: `${feature.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={feature.icon as any}
                        size={24}
                        color={feature.color}
                      />
                    </View>
                    <Text style={styles.featureCardTitle}>{feature.title}</Text>
                  </View>
                ))}
              </View>

              {/* Buttons Section */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGetStarted}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#fff', '#f9fafb']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Başlayın</Text>
                    <Ionicons name="arrow-forward" size={20} color="#059669" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Giriş Yap</Text>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Hesap oluşturarak{' '}
                  <Text style={styles.footerLink}>Kullanım Koşulları</Text> ve{' '}
                  <Text style={styles.footerLink}>Gizlilik Politikası</Text>'nı kabul
                  etmiş olursunuz
                </Text>
              </View>

              {/* Decorative elements */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
              <View style={styles.decorativeCircle3} />
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  versionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  featureHighlight: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featureCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  primaryButtonText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  footerLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 300,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
});
