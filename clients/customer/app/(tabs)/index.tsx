import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  Easing,
  InteractionManager,
  LayoutAnimation,
  UIManager,
  PixelRatio,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import api from '../../src/services/api';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { showToast } from '../../src/components/Toast';
import { useTheme } from '../../src/contexts/ThemeContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Screen dimensions
const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;

// Header animation constants
const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 140;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Banner constants
const BANNER_HEIGHT = 200;
const BANNER_WIDTH = SCREEN_WIDTH - 40;

// Card dimensions
const VENDOR_CARD_WIDTH = SCREEN_WIDTH - 40;
const CATEGORY_CARD_SIZE = 90;
const SPECIAL_OFFER_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;
const FEATURED_PRODUCT_CARD_WIDTH = 160;

// Animation timing constants
const FAST_ANIMATION_DURATION = 300;
const NORMAL_ANIMATION_DURATION = 600;
const SLOW_ANIMATION_DURATION = 1000;
const SPRING_CONFIG = {
  tension: 50,
  friction: 7,
};

// Interfaces
interface Vendor {
  _id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance?: number;
  total_orders: number;
  working_hours: string;
  store_image?: string;
  delivery_time?: string;
  min_order?: number;
  delivery_fee?: number;
  is_featured?: boolean;
  rating_count?: number;
  tags?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  count?: number;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  unit: string;
  stock: number;
  is_available: boolean;
  discount_percentage: number;
  quality_grade?: string;
  vendor_id: string;
}

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  action?: () => void;
}

interface Tip {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

// Placeholder data for banners
const BANNER_DATA: BannerItem[] = [
  {
    id: '1',
    title: 'Taze Ürünler',
    subtitle: 'Her gün taze, her gün sağlıklı',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800',
  },
  {
    id: '2',
    title: 'Hızlı Teslimat',
    subtitle: '30 dakikada kapınızda',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
  },
  {
    id: '3',
    title: 'Organik Ürünler',
    subtitle: 'Doğal ve sağlıklı seçenekler',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
  },
];

// Tips data
const TIPS_DATA: Tip[] = [
  {
    id: '1',
    icon: 'leaf',
    title: 'Mevsim Ürünleri',
    description: 'Mevsiminde olan ürünler daha taze ve hesaplıdır',
    color: '#0B3E25',
  },
  {
    id: '2',
    icon: 'snow',
    title: 'Saklama İpuçları',
    description: 'Sebzeleri buzdolabında doğru şekilde saklayın',
    color: '#3b82f6',
  },
  {
    id: '3',
    icon: 'star',
    title: 'Kalite Kontrolü',
    description: 'Ürünlerimiz günlük kalite kontrolünden geçer',
    color: '#F4A51C',
  },
  {
    id: '4',
    icon: 'shield-checkmark',
    title: 'Güvenli Alışveriş',
    description: 'Hijyenik paketleme ve güvenli teslimat',
    color: '#8b5cf6',
  },
];

// Review data
const REVIEW_DATA: Review[] = [
  {
    id: '1',
    userName: 'Ayşe Y.',
    rating: 5,
    comment: 'Ürünler çok taze geldi, çok memnun kaldım!',
    date: '2 gün önce',
  },
  {
    id: '2',
    userName: 'Mehmet K.',
    rating: 5,
    comment: 'Hızlı teslimat, kaliteli ürünler. Teşekkürler!',
    date: '1 hafta önce',
  },
  {
    id: '3',
    userName: 'Zeynep A.',
    rating: 4,
    comment: 'Fiyatlar uygun, ürün çeşitliliği güzel',
    date: '2 hafta önce',
  },
];

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { cart, fetchCart, addToCart } = useCartStore();
  const { isDark, colors } = useTheme();
  
  // State management - Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [featuredVendors, setFeaturedVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRatedVendors, setTopRatedVendors] = useState<Vendor[]>([]);
  
  // State management - UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // State management - Location and filter states
  const [location, setLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [deliveryRadius, setDeliveryRadius] = useState(10);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'deliveryTime' | 'minOrder'>('distance');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  
  // State management - Feature toggle states
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [favoritedVendors, setFavoritedVendors] = useState<Set<string>>(new Set());
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showLocationButton, setShowLocationButton] = useState(true);
  
  // Animation refs - Scroll and fade animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bannerScrollX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Animation refs - Element-specific animations
  const headerOpacityAnim = useRef(new Animated.Value(1)).current;
  const searchBarScaleAnim = useRef(new Animated.Value(1)).current;
  const categoryScrollAnim = useRef(new Animated.Value(0)).current;
  const filterSlideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // Animation refs - Feature-specific animations
  const quickActionSlideAnim = useRef(new Animated.Value(0)).current;
  const notificationBadgeAnim = useRef(new Animated.Value(0)).current;
  const cartButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const refreshIconRotateAnim = useRef(new Animated.Value(0)).current;
  const locationPulseAnim = useRef(new Animated.Value(1)).current;
  const locationButtonOpacity = useRef(new Animated.Value(1)).current;
  
  // Refs for scrolling and interaction
  const flatListRef = useRef<FlatList>(null);
  const bannerRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const categoryScrollRef = useRef<FlatList>(null);
  const vendorListRef = useRef<FlatList>(null);
  
  // Refs for timing and intervals
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Computed values - Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0.9],
    extrapolate: 'clamp',
  });

  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0.85],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Computed values - Banner animations
  const bannerOpacity = bannerScrollX.interpolate({
    inputRange: [0, BANNER_WIDTH, BANNER_WIDTH * 2],
    outputRange: [1, 1, 1],
    extrapolate: 'clamp',
  });

  // Computed values - Rotation animations
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Memoized computed values
  const totalVendors = useMemo(() => vendors.length, [vendors]);
  const totalCategories = useMemo(() => categories.length, [categories]);
  const averageDeliveryTime = useMemo(() => {
    if (vendors.length === 0) return 0;
    const times = vendors
      .filter(v => v.delivery_time)
      .map(v => parseInt(v.delivery_time || '30'));
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [vendors]);

  const nearbyVendorsCount = useMemo(() => {
    return vendors.filter(v => v.distance && v.distance <= 5).length;
  }, [vendors]);

  // Utility function - Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return `${amount.toFixed(2)} TL`;
  }, []);

  // Utility function - Format distance
  const formatDistance = useCallback((distance?: number): string => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  }, []);

  // Utility function - Calculate delivery fee
  const calculateDeliveryFee = useCallback((distance?: number): number => {
    if (!distance) return 15;
    if (distance <= 3) return 10;
    if (distance <= 5) return 15;
    if (distance <= 10) return 20;
    return 25;
  }, []);

  // Utility function - Get rating color
  const getRatingColor = useCallback((rating: number): string => {
    if (rating >= 4.5) return '#0B3E25';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#F4A51C';
    return '#ef4444';
  }, []);

  // Utility function - Get delivery time estimate
  const getDeliveryTimeEstimate = useCallback((distance?: number): string => {
    if (!distance) return '30-40 dk';
    const baseTime = 20;
    const timePerKm = 5;
    const total = baseTime + (distance * timePerKm);
    return `${Math.round(total)}-${Math.round(total + 10)} dk`;
  }, []);

  // Utility function - Format working hours
  const formatWorkingHours = useCallback((hours: string): string => {
    // Simple formatting, can be enhanced
    return hours || '09:00 - 22:00';
  }, []);

  // Utility function - Check if vendor is open
  const isVendorOpen = useCallback((workingHours: string): boolean => {
    // Simplified check - assume all are open for now
    return true;
  }, []);

  // Utility function - Get vendor tags
  const getVendorTags = useCallback((vendor: Vendor): string[] => {
    const tags: string[] = [];
    
    if (vendor.is_featured) tags.push('Öne Çıkan');
    if (vendor.rating >= 4.5) tags.push('Yüksek Puan');
    if (vendor.total_orders > 100) tags.push('Popüler');
    if (vendor.delivery_fee === 0) tags.push('Ücretsiz Teslimat');
    if (vendor.distance && vendor.distance <= 2) tags.push('Çok Yakın');
    
    return tags.slice(0, 2); // Show max 2 tags
  }, []);

  // Effect - Initialize app on mount
  useEffect(() => {
    initializeApp();
    startAnimations();
    startBackgroundAnimations();
    
    return () => {
      cleanup();
    };
  }, []);

  // Effect - Handle banner auto-scroll
  useEffect(() => {
    startBannerAutoScroll();
    return () => {
      if (bannerTimerRef.current) {
        clearInterval(bannerTimerRef.current);
      }
    };
  }, [currentBanner]);

  // Effect - Filter vendors when search or category changes
  useEffect(() => {
    filterVendors();
  }, [searchQuery, selectedCategory, vendors, sortBy, priceFilter, ratingFilter]);

  // Effect - Handle search debouncing
  useEffect(() => {
    if (searchQuery.length > 0) {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      
      searchDebounceRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    }
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Effect - Update featured vendors
  useEffect(() => {
    updateFeaturedVendors();
  }, [vendors]);

  // Effect - Handle cart button animation
  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0) {
      animateCartButton();
    }
  }, [cart?.items?.length]);

  // Effect - Handle location pulse animation
  useEffect(() => {
    if (location) {
      startLocationPulse();
    }
  }, [location]);

  // Initialization function
  const initializeApp = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        loadData(),
        requestLocationPermission(),
        fetchCart(),
        loadSearchHistory(),
        loadFavorites(),
      ]);
      
      // Load additional data after initial render
      InteractionManager.runAfterInteractions(() => {
        loadFeaturedProducts();
        loadSpecialOffers();
        loadNewArrivals();
        loadTopRatedVendors();
      });
      
    } catch (error) {
      console.error('Initialization error:', error);
      handleError('Uygulama yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Animation functions - Initial animations
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: NORMAL_ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...SPRING_CONFIG,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...SPRING_CONFIG,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation functions - Background animations
  const startBackgroundAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  };

  // Animation functions - Banner auto-scroll
  const startBannerAutoScroll = () => {
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current);
    }
    
    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner((prev) => {
        const next = (prev + 1) % BANNER_DATA.length;
        bannerRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 4000);
  };

  // Animation functions - Cart button animation
  const animateCartButton = () => {
    Animated.sequence([
      Animated.timing(cartButtonScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cartButtonScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation functions - Location pulse
  const startLocationPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(locationPulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(locationPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Animation functions - Search bar focus
  const animateSearchBarFocus = () => {
    Animated.spring(searchBarScaleAnim, {
      toValue: 1.02,
      ...SPRING_CONFIG,
      useNativeDriver: true,
    }).start();
  };

  // Animation functions - Search bar blur
  const animateSearchBarBlur = () => {
    Animated.spring(searchBarScaleAnim, {
      toValue: 1,
      ...SPRING_CONFIG,
      useNativeDriver: true,
    }).start();
  };

  // Animation functions - Toggle filters
  const toggleFilters = () => {
    const toValue = showFilters ? -SCREEN_WIDTH : 0;
    
    Animated.spring(filterSlideAnim, {
      toValue,
      ...SPRING_CONFIG,
      useNativeDriver: true,
    }).start();
    
    setShowFilters(!showFilters);
  };

  // Animation functions - Location button hide/show on scroll
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        
        // Eğer aşağı scroll ediyorsa (currentScrollY > lastScrollY) butonu gizle
        // Yukarı scroll ediyorsa butonu göster
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down - hide button
          Animated.timing(locationButtonOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show button
          Animated.timing(locationButtonOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        setLastScrollY(currentScrollY);
      },
    }
  );

  // Animation functions - Quick action slide
  const toggleQuickActions = () => {
    const toValue = showQuickActions ? -100 : 0;
    
    Animated.spring(quickActionSlideAnim, {
      toValue,
      ...SPRING_CONFIG,
      useNativeDriver: true,
    }).start();
    
    setShowQuickActions(!showQuickActions);
  };

  // Data loading functions - Main data
  const loadData = async () => {
    try {
      const [vendorsRes, categoriesRes] = await Promise.all([
        api.get('/vendors/all'),
        api.get('/categories'),
      ]);
      
      setVendors(vendorsRes.data || []);
      setFilteredVendors(vendorsRes.data || []);
      setCategories(categoriesRes.data || []);
      
      showToast({
        message: `${vendorsRes.data?.length || 0} manav yüklendi`,
        type: 'success',
        duration: 1500,
      });
      
    } catch (error: any) {
      console.error('Failed to load data:', error);
      handleError('Veriler yüklenirken bir sorun oluştu');
    }
  };

  // Data loading functions - Location
  const requestLocationPermission = async () => {
    setLocationLoading(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setLocation(loc.coords);
        await loadNearbyVendors(loc.coords.latitude, loc.coords.longitude);
        await getAddressFromCoordinates(loc.coords.latitude, loc.coords.longitude);
        
        showToast({
          message: 'Konumunuz belirlendi',
          type: 'success',
          duration: 2000,
        });
      } else {
        Alert.alert(
          'Konum İzni',
          'Yakınındaki manavları görmek için konum iznine ihtiyacımız var',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Ayarlara Git',
              onPress: () => {
                showToast({
                  message: 'Lütfen ayarlardan konum iznini aktif edin',
                  type: 'info',
                });
              },
            },
          ]
        );
        await loadData();
      }
    } catch (error) {
      console.error('Location error:', error);
      handleError('Konum alınamadı');
      await loadData();
    } finally {
      setLocationLoading(false);
    }
  };

  // Data loading functions - Nearby vendors
  const loadNearbyVendors = async (lat: number, lon: number) => {
    try {
      const response = await api.get(
        `/vendors/nearby?latitude=${lat}&longitude=${lon}&radius=${deliveryRadius}`
      );
      
      const vendorsData = response.data || [];
      setVendors(vendorsData);
      setFilteredVendors(vendorsData);
      
      showToast({
        message: `${vendorsData.length} yakın manav bulundu`,
        type: 'info',
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Failed to load nearby vendors:', error);
      handleError('Yakındaki manavlar yüklenemedi');
    }
  };

  // Data loading functions - Address from coordinates
  const getAddressFromCoordinates = async (lat: number, lon: number) => {
    try {
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      
      if (address && address.length > 0) {
        const addr = address[0];
        const formattedAddress = `${addr.street || ''} ${addr.district || ''}, ${addr.city || ''}`.trim();
        setUserAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Failed to get address:', error);
    }
  };

  // Data loading functions - Featured products
  const loadFeaturedProducts = async () => {
    try {
      const response = await api.get('/products?featured=true&limit=10');
      setFeaturedProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    }
  };

  // Data loading functions - Special offers
  const loadSpecialOffers = async () => {
    try {
      const response = await api.get('/products?discount=true&limit=10');
      setSpecialOffers(response.data || []);
    } catch (error) {
      console.error('Failed to load special offers:', error);
    }
  };

  // Data loading functions - New arrivals
  const loadNewArrivals = async () => {
    try {
      const response = await api.get('/products?sort=newest&limit=10');
      setNewArrivals(response.data || []);
    } catch (error) {
      console.error('Failed to load new arrivals:', error);
    }
  };

  // Data loading functions - Top rated vendors
  const loadTopRatedVendors = async () => {
    try {
      const sortedVendors = [...vendors]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      setTopRatedVendors(sortedVendors);
    } catch (error) {
      console.error('Failed to load top rated vendors:', error);
    }
  };

  // Data loading functions - Search history
  const loadSearchHistory = async () => {
    try {
      // Load from AsyncStorage if implemented
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  // Data loading functions - Favorites
  const loadFavorites = async () => {
    try {
      // Load from AsyncStorage if implemented
      setFavoritedVendors(new Set());
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  // Data processing functions - Update featured vendors
  const updateFeaturedVendors = () => {
    const featured = vendors
      .filter(v => v.rating >= 4.5 || v.total_orders > 50)
      .slice(0, 5);
    setFeaturedVendors(featured);
  };

  // Data processing functions - Filter vendors
  const filterVendors = () => {
    let filtered = [...vendors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vendor) =>
          vendor.store_name.toLowerCase().includes(query) ||
          vendor.address.toLowerCase().includes(query) ||
          vendor.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      // This would filter by category if we had category data for vendors
      // For now, keep all vendors
    }

    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(v => v.rating >= ratingFilter);
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(v => {
        if (!v.min_order) return true;
        
        switch (priceFilter) {
          case 'low':
            return v.min_order < 50;
          case 'medium':
            return v.min_order >= 50 && v.min_order < 100;
          case 'high':
            return v.min_order >= 100;
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'distance':
        filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'deliveryTime':
        filtered.sort((a, b) => {
          const timeA = parseInt(a.delivery_time || '30');
          const timeB = parseInt(b.delivery_time || '30');
          return timeA - timeB;
        });
        break;
      case 'minOrder':
        filtered.sort((a, b) => (a.min_order || 0) - (b.min_order || 0));
        break;
    }

    setFilteredVendors(filtered);
    
    // Animate layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  // Data processing functions - Perform search
  const performSearch = (query: string) => {
    if (query.trim().length === 0) return;
    
    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(h => h !== query)].slice(0, 10);
      // Save to AsyncStorage if needed
      return newHistory;
    });
    
    // Trigger filter
    filterVendors();
  };

  // UI interaction functions - Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Rotate refresh icon
    Animated.timing(refreshIconRotateAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start(() => {
      refreshIconRotateAnim.setValue(0);
    });
    
    await initializeApp();
    setRefreshing(false);
    
    showToast({
      message: 'Sayfa yenilendi',
      type: 'success',
      duration: 1500,
    });
  }, []);

  // UI interaction functions - Handle vendor press
  const handleVendorPress = useCallback((vendor: Vendor) => {
    // Haptic feedback could be added here
    router.push(`/vendor/${vendor._id}` as any);
  }, [router]);

  // UI interaction functions - Handle category press
  const handleCategoryPress = useCallback((categoryId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
    
    // Scroll category into view
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex >= 0) {
      categoryScrollRef.current?.scrollToIndex({
        index: categoryIndex,
        animated: true,
      });
    }
  }, [selectedCategory, categories]);

  // UI interaction functions - Toggle view mode
  const toggleViewMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    
    showToast({
      message: viewMode === 'grid' ? 'Liste görünümü' : 'Izgara görünümü',
      type: 'info',
      duration: 1000,
    });
  }, [viewMode]);

  // UI interaction functions - Toggle favorite
  const toggleFavorite = useCallback((vendorId: string) => {
    setFavoritedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
        showToast({
          message: 'Favorilerden kaldırıldı',
          type: 'info',
          duration: 1500,
        });
      } else {
        newSet.add(vendorId);
        showToast({
          message: 'Favorilere eklendi',
          type: 'success',
          duration: 1500,
        });
      }
      // Save to AsyncStorage if needed
      return newSet;
    });
  }, []);

  // UI interaction functions - Handle product add to cart
  const handleAddToCart = useCallback(async (product: Product) => {
    try {
      await addToCart(product._id, 1);
      
      showToast({
        message: `${product.name} sepete eklendi`,
        type: 'success',
        duration: 2000,
      });
      
      animateCartButton();
    } catch (error: any) {
      handleError(error.message || 'Sepete eklenemedi');
    }
  }, [addToCart]);

  // UI interaction functions - Load more vendors
  const loadMoreVendors = useCallback(() => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    
    // Simulate loading more
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    loadMoreTimeoutRef.current = setTimeout(() => {
      setLoadingMore(false);
    }, 1000);
  }, [loadingMore]);

  // UI interaction functions - Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchSuggestions(false);
    searchInputRef.current?.blur();
    animateSearchBarBlur();
  }, []);

  // UI interaction functions - Select search suggestion
  const selectSearchSuggestion = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
    performSearch(suggestion);
  }, []);

  // Helper functions - Error handling
  const handleError = (message: string) => {
    Alert.alert('Hata', message, [
      { text: 'Tamam', style: 'default' },
      { text: 'Tekrar Dene', onPress: () => onRefresh() },
    ]);
  };

  // Helper functions - Cleanup
  const cleanup = () => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
  };

  // Helper functions - Apply filters
  const applyFilters = useCallback(() => {
    filterVendors();
    toggleFilters();
    
    showToast({
      message: 'Filtreler uygulandı',
      type: 'success',
      duration: 1500,
    });
  }, [filterVendors, toggleFilters]);

  // Helper functions - Reset filters
  const resetFilters = useCallback(() => {
    setSortBy('distance');
    setPriceFilter('all');
    setRatingFilter(0);
    setSelectedCategory(null);
    setDeliveryRadius(10);
    
    showToast({
      message: 'Filtreler sıfırlandı',
      type: 'info',
      duration: 1500,
    });
  }, []);

  // Render functions - Banner item
  const renderBannerItem = useCallback(({ item, index }: { item: BannerItem; index: number }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={item.action}
        style={styles.bannerItem}
      >
        <ImageBackground
          source={{ uri: item.image }}
          style={styles.bannerImage}
          imageStyle={styles.bannerImageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  }, []);

  // Render functions - Category item
  const renderCategoryItem = useCallback(({ item, index }: { item: Category; index: number }) => {
    const isSelected = selectedCategory === item.id;
    const isHidden = hiddenCategories.has(item.id);
    
    if (isHidden) return null;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
        ]}
        onPress={() => handleCategoryPress(item.id)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.categoryIconContainer,
            isSelected && styles.categoryIconContainerSelected,
            {
              transform: [
                {
                  scale: isSelected ? 1.1 : 1,
                },
              ],
            },
          ]}
        >
          <Text style={styles.categoryEmoji}>{item.icon}</Text>
        </Animated.View>
        <Text
          style={[
            styles.categoryName,
            isSelected && styles.categoryNameSelected,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.count && (
          <View style={styles.categoryCountBadge}>
            <Text style={styles.categoryCountText}>{item.count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedCategory, hiddenCategories, handleCategoryPress]);

  // Render functions - Vendor card (detailed version)
  const renderVendorCard = useCallback((vendor: Vendor, index: number) => {
    const isFavorited = favoritedVendors.has(vendor._id);
    const isExpanded = expandedVendorId === vendor._id;
    const tags = getVendorTags(vendor);
    const deliveryFee = calculateDeliveryFee(vendor.distance);
    const deliveryTime = getDeliveryTimeEstimate(vendor.distance);
    const isOpen = isVendorOpen(vendor.working_hours);
    
    return (
      <Animated.View
        key={vendor._id}
        style={[
          styles.vendorCard,
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
          onPress={() => handleVendorPress(vendor)}
        >
          {/* Vendor Image Section */}
          <View style={styles.vendorImageSection}>
            {vendor.store_image ? (
              <Image
                source={{ uri: vendor.store_image }}
                style={styles.vendorImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#0B3E25', '#082E1C', '#0B3E25']}
                style={styles.vendorImagePlaceholder}
              >
                <Ionicons name="storefront" size={48} color="#fff" />
              </LinearGradient>
            )}
            
            {/* Status Badge */}
            <View style={[styles.statusBadge, !isOpen && styles.statusBadgeClosed]}>
              <View style={[styles.statusDot, !isOpen && styles.statusDotClosed]} />
              <Text style={styles.statusText}>{isOpen ? 'Açık' : 'Kapalı'}</Text>
            </View>
            
            {/* Favorite Button */}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(vendor._id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorited ? '#ef4444' : '#fff'}
              />
            </TouchableOpacity>
            
            {/* Featured Badge */}
            {vendor.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={14} color="#fff" />
                <Text style={styles.featuredText}>Öne Çıkan</Text>
              </View>
            )}
          </View>
          
          {/* Vendor Info Section */}
          <View style={styles.vendorInfoSection}>
            {/* Header Row */}
            <View style={styles.vendorHeaderRow}>
              <View style={styles.vendorNameContainer}>
                <Text style={styles.vendorName} numberOfLines={1}>
                  {vendor.store_name}
                </Text>
                {vendor.rating > 0 && (
                  <View style={[styles.ratingBadge, { backgroundColor: `${getRatingColor(vendor.rating)}15` }]}>
                    <Ionicons name="star" size={14} color={getRatingColor(vendor.rating)} />
                    <Text style={[styles.ratingText, { color: getRatingColor(vendor.rating) }]}>
                      {vendor.rating.toFixed(1)}
                    </Text>
                    {vendor.rating_count && (
                      <Text style={styles.ratingCount}>({vendor.rating_count})</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            
            {/* Address Row */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {vendor.address}
              </Text>
            </View>
            
            {/* Distance and Time Row */}
            <View style={styles.detailsRow}>
              {vendor.distance && (
                <View style={styles.detailItem}>
                  <Ionicons name="navigate-outline" size={14} color="#0B3E25" />
                  <Text style={styles.detailText}>{formatDistance(vendor.distance)}</Text>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color="#3b82f6" />
                <Text style={styles.detailText}>{deliveryTime}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="bicycle-outline" size={14} color="#F4A51C" />
                <Text style={styles.detailText}>
                  {deliveryFee === 0 ? 'Ücretsiz' : `${deliveryFee} TL`}
                </Text>
              </View>
            </View>
            
            {/* Tags Row */}
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="receipt-outline" size={16} color="#6b7280" />
                <Text style={styles.statText}>{vendor.total_orders}+ sipariş</Text>
              </View>
              
              {vendor.min_order && (
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={16} color="#6b7280" />
                  <Text style={styles.statText}>Min. {vendor.min_order} TL</Text>
                </View>
              )}
            </View>
            
            {/* Action Button */}
            <TouchableOpacity
              style={styles.vendorActionButton}
              onPress={() => handleVendorPress(vendor)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0B3E25', '#082E1C']}
                style={styles.vendorActionGradient}
              >
                <Text style={styles.vendorActionText}>Mağazayı Gör</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [
    favoritedVendors,
    expandedVendorId,
    fadeAnim,
    handleVendorPress,
    toggleFavorite,
    getVendorTags,
    calculateDeliveryFee,
    getDeliveryTimeEstimate,
    isVendorOpen,
    getRatingColor,
    formatDistance,
  ]);

  // Render functions - Product card (for featured/special offers sections)
  const renderProductCard = useCallback(({ item }: { item: Product }) => {
    const hasDiscount = item.discount_percentage > 0;
    const discountedPrice = item.price;
    const originalPrice = hasDiscount
      ? item.price / (1 - item.discount_percentage / 100)
      : item.price;
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.9}
      >
        <View style={styles.productImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#d1d5db" />
            </View>
          )}
          
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>%{item.discount_percentage}</Text>
            </View>
          )}
          
          {item.quality_grade && (
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{item.quality_grade}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>
              {formatCurrency(discountedPrice)}
            </Text>
            {hasDiscount && (
              <Text style={styles.productOriginalPrice}>
                {formatCurrency(originalPrice)}
              </Text>
            )}
          </View>
          
          <Text style={styles.productUnit}>/{item.unit}</Text>
          
          <TouchableOpacity
            style={styles.productAddButton}
            onPress={() => handleAddToCart(item)}
            disabled={!item.is_available || item.stock === 0}
          >
            <LinearGradient
              colors={
                item.is_available && item.stock > 0
                  ? ['#0B3E25', '#082E1C']
                  : ['#9ca3af', '#6b7280']
              }
              style={styles.productAddGradient}
            >
              <Ionicons
                name={item.is_available && item.stock > 0 ? 'add' : 'close'}
                size={16}
                color="#fff"
              />
              <Text style={styles.productAddText}>
                {item.is_available && item.stock > 0 ? 'Ekle' : 'Tükendi'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [formatCurrency, handleAddToCart]);

  // Render functions - Tip card
  const renderTipCard = useCallback(({ item }: { item: Tip }) => {
    return (
      <View style={[styles.tipCard, { borderLeftColor: item.color }]}>
        <View style={[styles.tipIconContainer, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon as any} size={24} color={item.color} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{item.title}</Text>
          <Text style={styles.tipDescription}>{item.description}</Text>
        </View>
      </View>
    );
  }, []);

  // Render functions - Review card
  const renderReviewCard = useCallback(({ item }: { item: Review }) => {
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>
              {item.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.reviewUserInfo}>
            <Text style={styles.reviewUserName}>{item.userName}</Text>
            <View style={styles.reviewRatingRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < item.rating ? 'star' : 'star-outline'}
                  size={12}
                  color="#fbbf24"
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    );
  }, []);

  // Render functions - Stats section
  const renderStatsSection = () => {
    return (
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Ionicons name="storefront" size={32} color="#0B3E25" />
          <Text style={styles.statValue}>{totalVendors}</Text>
          <Text style={styles.statLabel}>Manav</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="grid" size={32} color="#3b82f6" />
          <Text style={styles.statValue}>{totalCategories}</Text>
          <Text style={styles.statLabel}>Kategori</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time" size={32} color="#F4A51C" />
          <Text style={styles.statValue}>{averageDeliveryTime}</Text>
          <Text style={styles.statLabel}>dk ort.</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="location" size={32} color="#ef4444" />
          <Text style={styles.statValue}>{nearbyVendorsCount}</Text>
          <Text style={styles.statLabel}>Yakın</Text>
        </View>
      </View>
    );
  };

  // Render functions - Quick actions
  const renderQuickActions = () => {
    return (
      <Animated.View
        style={[
          styles.quickActionsContainer,
          { transform: [{ translateY: quickActionSlideAnim }] },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsList}
        >
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#0B3E2515' }]}>
              <Ionicons name="flash" size={24} color="#0B3E25" />
            </View>
            <Text style={styles.quickActionText}>Hızlı</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="flame" size={24} color="#ef4444" />
            </View>
            <Text style={styles.quickActionText}>Popüler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F4A51C15' }]}>
              <Ionicons name="pricetag" size={24} color="#F4A51C" />
            </View>
            <Text style={styles.quickActionText}>İndirim</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="star" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.quickActionText}>Yeni</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#8b5cf615' }]}>
              <Ionicons name="leaf" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionText}>Organik</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  };

  // Render functions - Filter panel
  const renderFilterPanel = () => {
    return (
      <>
        <Animated.View
          style={[
            styles.filterPanel,
            { transform: [{ translateX: filterSlideAnim }] },
          ]}
        >
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtreler</Text>
            <TouchableOpacity onPress={toggleFilters}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sıralama</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'distance', label: 'Mesafe', icon: 'navigate' },
                  { value: 'rating', label: 'Puan', icon: 'star' },
                  { value: 'deliveryTime', label: 'Süre', icon: 'time' },
                  { value: 'minOrder', label: 'Min. Tutar', icon: 'cash' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      sortBy === option.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setSortBy(option.value as any)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={sortBy === option.value ? '#fff' : '#6b7280'}
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        sortBy === option.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Price Filter Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Fiyat Aralığı</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'all', label: 'Tümü' },
                  { value: 'low', label: '50 TL altı' },
                  { value: 'medium', label: '50-100 TL' },
                  { value: 'high', label: '100 TL üstü' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      priceFilter === option.value && styles.filterOptionActive,
                    ]}
                    onPress={() => setPriceFilter(option.value as any)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        priceFilter === option.value && styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Rating Filter Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Puan</Text>
              <View style={styles.ratingFilterRow}>
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingFilterButton,
                      ratingFilter === rating && styles.ratingFilterButtonActive,
                    ]}
                    onPress={() => setRatingFilter(rating)}
                  >
                    <Ionicons
                      name="star"
                      size={16}
                      color={ratingFilter === rating ? '#fff' : '#fbbf24'}
                    />
                    <Text
                      style={[
                        styles.ratingFilterText,
                        ratingFilter === rating && styles.ratingFilterTextActive,
                      ]}
                    >
                      {rating === 0 ? 'Tümü' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Delivery Radius Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Teslimat Mesafesi</Text>
              <View style={styles.radiusSliderContainer}>
                <Text style={styles.radiusValue}>{deliveryRadius} km</Text>
                <View style={styles.radiusButtons}>
                  <TouchableOpacity
                    style={styles.radiusButton}
                    onPress={() => setDeliveryRadius(Math.max(1, deliveryRadius - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#0B3E25" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radiusButton}
                    onPress={() => setDeliveryRadius(Math.min(50, deliveryRadius + 1))}
                  >
                    <Ionicons name="add" size={20} color="#0B3E25" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.filterResetButton}
              onPress={resetFilters}
            >
              <Text style={styles.filterResetText}>Sıfırla</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filterApplyButton}
              onPress={applyFilters}
            >
              <LinearGradient
                colors={['#0B3E25', '#082E1C']}
                style={styles.filterApplyGradient}
              >
                <Text style={styles.filterApplyText}>Uygula</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {showFilters && (
          <TouchableOpacity
            style={styles.filterOverlay}
            activeOpacity={1}
            onPress={toggleFilters}
          />
        )}
      </>
    );
  };

  // Main render - Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }, { scale: pulseAnim }],
          }}
        >
          <LinearGradient
            colors={['#0B3E25', '#082E1C']}
            style={styles.loadingIconContainer}
          >
            <Ionicons name="storefront" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
        <Text style={styles.loadingSubtext}>Lütfen bekleyin</Text>
      </View>
    );
  }

  // Main render - Main content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header with Glassmorphism */}
      <View style={styles.header}>
        <ImageBackground
          source={{ uri: 'https://customer-assets.emergentagent.com/job_manavim-groceries/artifacts/o9pqg92u_ChatGPT%20Image%2021%20Kas%202025%2020_14_41.png' }}
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
          resizeMode="cover"
          blurRadius={3}
        >
          <View style={styles.headerContent}>
            {/* Top Row with Glassmorphism */}
            <View style={styles.headerTopRow}>
              <Animated.View style={{ transform: [{ scale: headerTitleScale }] }}>
                <Text style={styles.greeting}>Merhaba,</Text>
                <Text style={styles.userName}>{user?.full_name || 'Kullanıcı'}</Text>
              </Animated.View>

              <View style={styles.headerActions}>
                <Animated.View style={{ opacity: locationButtonOpacity }}>
                  <TouchableOpacity
                    style={styles.locationIconButton}
                    onPress={requestLocationPermission}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Animated.View style={{ transform: [{ scale: locationPulseAnim }] }}>
                        <Ionicons name="location" size={22} color="#fff" />
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  style={styles.notificationButton}
                  onPress={() => setShowNotifications(!showNotifications)}
                >
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>3</Text>
                  </View>
                </TouchableOpacity>
                
                <Animated.View style={{ transform: [{ scale: cartButtonScaleAnim }] }}>
                  <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => router.push('/(tabs)/cart')}
                  >
                    {cart && cart.items && cart.items.length > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cart.items.length}</Text>
                      </View>
                    )}
                    <Ionicons name="cart-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Search Bar with Glassmorphism */}
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  transform: [
                    { scale: searchBarScaleAnim },
                    { translateY: searchBarTranslateY },
                  ],
                },
              ]}
            >
              <Ionicons name="search" size={20} color="#0B3E25" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Manav veya ürün ara..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={animateSearchBarFocus}
                onBlur={animateSearchBarBlur}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={toggleFilters}>
                  <Ionicons name="options" size={20} color="#0B3E25" />
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </ImageBackground>
      </View>

      {/* Main Content - Scrollable */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0B3E25"
            colors={['#0B3E25']}
          />
        }
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 10 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Banner Section */}
          <View style={styles.bannerSection}>
            <FlatList
              ref={bannerRef}
              data={BANNER_DATA}
              renderItem={renderBannerItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: bannerScrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / BANNER_WIDTH);
                setCurrentBanner(index);
              }}
            />
            <View style={styles.bannerIndicators}>
              {BANNER_DATA.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.bannerIndicator,
                    index === currentBanner && styles.bannerIndicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Stats Section */}
          {renderStatsSection()}

          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Kategoriler</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {categories.length} kategori
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={styles.sectionLink}>Tümü</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              ref={categoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Featured Vendors Section */}
          {featuredVendors.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="star" size={20} color="#fbbf24" />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Öne Çıkan Manavlar
                    </Text>
                  </View>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    En çok tercih edilen
                  </Text>
                </View>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featuredVendors}
                renderItem={({ item, index }) => renderVendorCard(item, index)}
                keyExtractor={(item) => `featured-${item._id}`}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )}

          {/* Special Offers Section */}
          {specialOffers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="pricetag" size={20} color="#ef4444" />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Özel Fırsatlar
                    </Text>
                  </View>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    İndirimli ürünler
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.sectionLink}>Tümü</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={specialOffers}
                renderItem={renderProductCard}
                keyExtractor={(item) => `offer-${item._id}`}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )}

          {/* All Vendors Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {location ? 'Yakınındaki Manavlar' : 'Tüm Manavlar'}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {filteredVendors.length} manav bulundu
                </Text>
              </View>
              <View style={styles.viewModeButtons}>
                <TouchableOpacity
                  onPress={toggleViewMode}
                  style={[styles.viewModeButton, { backgroundColor: colors.surface }]}
                >
                  <Ionicons
                    name={viewMode === 'grid' ? 'list' : 'grid'}
                    size={22}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {filteredVendors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['#f3f4f6', '#e5e7eb']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="storefront-outline" size={64} color="#9ca3af" />
                  </LinearGradient>
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Manav bulunamadı
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'Farklı bir arama terimi deneyin'
                    : 'Yakınınızda henüz kayıtlı manav yok'}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                  <LinearGradient
                    colors={['#0B3E25', '#082E1C']}
                    style={styles.retryButtonGradient}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Yenile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.vendorsList}>
                {filteredVendors.map((vendor, index) => renderVendorCard(vendor, index))}
                
                {loadingMore && (
                  <View style={styles.loadMoreIndicator}>
                    <ActivityIndicator size="small" color="#0B3E25" />
                    <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                      Daha fazla yükleniyor...
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="bulb" size={20} color="#F4A51C" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    İpuçları
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Alışveriş önerileri
                </Text>
              </View>
            </View>
            <FlatList
              data={TIPS_DATA}
              renderItem={renderTipCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="chatbubbles" size={20} color="#8b5cf6" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Müşteri Yorumları
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Kullanıcılarımız ne diyor
                </Text>
              </View>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={REVIEW_DATA}
              renderItem={renderReviewCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* Flash Sales Countdown Section */}
          <View style={styles.flashSalesSection}>
            <LinearGradient
              colors={['#ef4444', '#dc2626', '#b91c1c']}
              style={styles.flashSalesGradient}
            >
              <View style={styles.flashSalesHeader}>
                <View style={styles.flashSalesIconContainer}>
                  <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <Ionicons name="flash" size={32} color="#fff" />
                  </Animated.View>
                </View>
                <View style={styles.flashSalesTitleContainer}>
                  <Text style={styles.flashSalesTitle}>Şimşek İndirim!</Text>
                  <Text style={styles.flashSalesSubtitle}>Sınırlı süre için özel fiyatlar</Text>
                </View>
              </View>
              
              <View style={styles.countdownContainer}>
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownValue}>02</Text>
                  <Text style={styles.countdownLabel}>Saat</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownValue}>34</Text>
                  <Text style={styles.countdownLabel}>Dakika</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownValue}>56</Text>
                  <Text style={styles.countdownLabel}>Saniye</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.flashSalesButton}>
                <Text style={styles.flashSalesButtonText}>Hemen İncele</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Seasonal Products Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="sunny" size={20} color="#F4A51C" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Mevsimin Ürünleri
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Bu mevsime özel taze ürünler
                </Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Tümü</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.seasonalGrid}>
              {['Portakal', 'Mandalina', 'Elma', 'Kivi'].map((item, index) => (
                <TouchableOpacity key={index} style={styles.seasonalCard}>
                  <LinearGradient
                    colors={['#fef3c7', '#fde68a']}
                    style={styles.seasonalCardGradient}
                  >
                    <View style={styles.seasonalBadge}>
                      <Text style={styles.seasonalBadgeText}>%{15 + index * 5}</Text>
                    </View>
                    <Text style={styles.seasonalEmoji}>🍊</Text>
                    <Text style={styles.seasonalName}>{item}</Text>
                    <Text style={styles.seasonalPrice}>{(8 + index * 2).toFixed(2)} TL/kg</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Social Proof Section */}
          <View style={styles.socialProofSection}>
            <View style={styles.socialProofCard}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.socialProofIconContainer}>
                  <Ionicons name="people" size={24} color="#0B3E25" />
                </View>
              </Animated.View>
              <View style={styles.socialProofContent}>
                <Text style={[styles.socialProofTitle, { color: colors.text }]}>
                  <Text style={styles.socialProofNumber}>234</Text> kişi şu anda alışveriş yapıyor
                </Text>
                <Text style={[styles.socialProofSubtitle, { color: colors.textSecondary }]}>
                  Son 1 saatte 156 sipariş verildi
                </Text>
              </View>
            </View>
          </View>

          {/* Loyalty Points Section */}
          <View style={styles.loyaltySection}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
              style={styles.loyaltyGradient}
            >
              <View style={styles.loyaltyHeader}>
                <View style={styles.loyaltyIconContainer}>
                  <Ionicons name="trophy" size={28} color="#fff" />
                </View>
                <View style={styles.loyaltyContent}>
                  <Text style={styles.loyaltyTitle}>Puan Kazan</Text>
                  <Text style={styles.loyaltySubtitle}>Her alışverişte puan biriktir</Text>
                </View>
              </View>
              
              <View style={styles.loyaltyPoints}>
                <Text style={styles.loyaltyPointsValue}>850</Text>
                <Text style={styles.loyaltyPointsLabel}>Toplam Puanınız</Text>
              </View>
              
              <View style={styles.loyaltyProgress}>
                <View style={styles.loyaltyProgressBar}>
                  <LinearGradient
                    colors={['#fbbf24', '#F4A51C']}
                    style={[styles.loyaltyProgressFill, { width: '65%' }]}
                  />
                </View>
                <Text style={styles.loyaltyProgressText}>
                  Bir sonraki hediye için 150 puan daha!
                </Text>
              </View>
              
              <TouchableOpacity style={styles.loyaltyButton}>
                <Text style={styles.loyaltyButtonText}>Hediye Kataloğu</Text>
                <Ionicons name="gift" size={18} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Bundle Deals Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="albums" size={20} color="#ec4899" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Paket Teklifleri
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Kombine alın, tasarruf edin
                </Text>
              </View>
            </View>
            
            <View style={styles.bundlesList}>
              {[
                { name: 'Kahvaltılık Paketi', price: 89.90, discount: 25, items: 5 },
                { name: 'Salata Seti', price: 54.90, discount: 20, items: 4 },
                { name: 'Meyve Karışımı', price: 74.90, discount: 30, items: 6 },
              ].map((bundle, index) => (
                <TouchableOpacity key={index} style={styles.bundleCard}>
                  <LinearGradient
                    colors={['#fdf2f8', '#fce7f3']}
                    style={styles.bundleCardGradient}
                  >
                    <View style={styles.bundleHeader}>
                      <Text style={styles.bundleName}>{bundle.name}</Text>
                      <View style={styles.bundleDiscountBadge}>
                        <Text style={styles.bundleDiscountText}>%{bundle.discount}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.bundleInfo}>
                      <View style={styles.bundleInfoItem}>
                        <Ionicons name="cube-outline" size={16} color="#6b7280" />
                        <Text style={styles.bundleInfoText}>{bundle.items} ürün</Text>
                      </View>
                      <View style={styles.bundleInfoItem}>
                        <Ionicons name="pricetag-outline" size={16} color="#0B3E25" />
                        <Text style={styles.bundlePrice}>{bundle.price.toFixed(2)} TL</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity style={styles.bundleButton}>
                      <LinearGradient
                        colors={['#ec4899', '#db2777']}
                        style={styles.bundleButtonGradient}
                      >
                        <Text style={styles.bundleButtonText}>Paketi İncele</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trending Now Section */}
          <View style={styles.trendingSection}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="trending-up" size={20} color="#ef4444" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Şu Anda Trend
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  En çok aranan ürünler
                </Text>
              </View>
            </View>
            
            <View style={styles.trendingGrid}>
              {['Domates', 'Salatalık', 'Biber', 'Patlıcan', 'Soğan', 'Sarımsak'].map((item, index) => (
                <TouchableOpacity key={index} style={styles.trendingItem}>
                  <View style={styles.trendingRank}>
                    <Text style={styles.trendingRankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.trendingEmoji}>🍅</Text>
                  <Text style={styles.trendingName}>{item}</Text>
                  <View style={styles.trendingStats}>
                    <Ionicons name="arrow-up" size={12} color="#0B3E25" />
                    <Text style={styles.trendingPercentage}>+{12 + index * 3}%</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recipe Suggestions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="restaurant" size={20} color="#f97316" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Tarif Önerileri
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Bu ürünlerle neler yapabilirsin?
                </Text>
              </View>
            </View>
            
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                { id: '1', name: 'Sebze Sote', time: '15 dk', difficulty: 'Kolay', image: '🥗' },
                { id: '2', name: 'Çorba', time: '30 dk', difficulty: 'Orta', image: '🍲' },
                { id: '3', name: 'Salata', time: '10 dk', difficulty: 'Çok Kolay', image: '🥙' },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recipeCard}>
                  <View style={styles.recipeImageContainer}>
                    <Text style={styles.recipeEmoji}>{item.image}</Text>
                    <View style={styles.recipeDifficultyBadge}>
                      <Text style={styles.recipeDifficultyText}>{item.difficulty}</Text>
                    </View>
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{item.name}</Text>
                    <View style={styles.recipeStats}>
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text style={styles.recipeTime}>{item.time}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
            />
          </View>

          {/* Nutritional Tips Section */}
          <View style={styles.nutritionSection}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="fitness" size={20} color="#0B3E25" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Sağlıklı Yaşam İpuçları
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Beslenme önerileri
                </Text>
              </View>
            </View>
            
            <View style={styles.nutritionCards}>
              {[
                {
                  icon: 'water',
                  title: 'Günde 2L Su',
                  description: 'Taze sebzeler de su içeriği yüksektir',
                  color: '#3b82f6',
                },
                {
                  icon: 'leaf',
                  title: '5 Porsiyon Sebze',
                  description: 'Günlük vitamin ihtiyacınızı karşılayın',
                  color: '#0B3E25',
                },
                {
                  icon: 'color-palette',
                  title: 'Renkli Beslenin',
                  description: 'Farklı renklerde sebze tüketin',
                  color: '#F4A51C',
                },
              ].map((tip, index) => (
                <View key={index} style={styles.nutritionCard}>
                  <View style={[styles.nutritionIcon, { backgroundColor: `${tip.color}15` }]}>
                    <Ionicons name={tip.icon as any} size={24} color={tip.color} />
                  </View>
                  <View style={styles.nutritionContent}>
                    <Text style={[styles.nutritionTitle, { color: colors.text }]}>
                      {tip.title}
                    </Text>
                    <Text style={[styles.nutritionDescription, { color: colors.textSecondary }]}>
                      {tip.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Live Activity Feed Section */}
          <View style={styles.activityFeedSection}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pulse" size={20} color="#06b6d4" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Canlı Aktivite
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Platform genelinde ne oluyor?
                </Text>
              </View>
            </View>
            
            <View style={styles.activityList}>
              {[
                { icon: 'cart', text: 'Ayşe Y. az önce sipariş verdi', time: '2 dk önce', color: '#0B3E25' },
                { icon: 'star', text: 'Yeni manav Sarıyer\'de açıldı', time: '15 dk önce', color: '#fbbf24' },
                { icon: 'pricetag', text: '%30 indirim başladı!', time: '1 saat önce', color: '#ef4444' },
              ].map((activity, index) => (
                <Animated.View 
                  key={index} 
                  style={[
                    styles.activityItem,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                    <Ionicons name={activity.icon as any} size={18} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, { color: colors.text }]}>
                      {activity.text}
                    </Text>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                      {activity.time}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Download App Section */}
          <View style={styles.downloadSection}>
            <LinearGradient
              colors={['#6366f1', '#4f46e5', '#4338ca']}
              style={styles.downloadGradient}
            >
              <View style={styles.downloadContent}>
                <View style={styles.downloadIconContainer}>
                  <Ionicons name="phone-portrait" size={48} color="#fff" />
                </View>
                <View style={styles.downloadTextContainer}>
                  <Text style={styles.downloadTitle}>Mobil Uygulamayı İndir</Text>
                  <Text style={styles.downloadSubtitle}>
                    Daha hızlı sipariş, daha fazla özellik
                  </Text>
                </View>
              </View>
              
              <View style={styles.downloadButtons}>
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                  <View style={styles.downloadButtonText}>
                    <Text style={styles.downloadButtonLabel}>App Store</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="logo-google-playstore" size={24} color="#fff" />
                  <View style={styles.downloadButtonText}>
                    <Text style={styles.downloadButtonLabel}>Play Store</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.paymentSection}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="card" size={20} color="#082E1C" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ödeme Seçenekleri
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Güvenli ve hızlı ödeme
                </Text>
              </View>
            </View>
            
            <View style={styles.paymentMethods}>
              {['card', 'cash', 'wallet', 'logo-paypal'].map((method, index) => (
                <View key={index} style={styles.paymentMethodItem}>
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name={method as any} size={28} color="#0B3E25" />
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.paymentFeatures}>
              {[
                { icon: 'shield-checkmark', text: '256-bit SSL Güvenlik' },
                { icon: 'lock-closed', text: '3D Secure Koruması' },
                { icon: 'checkmark-circle', text: 'Anında Onay' },
              ].map((feature, index) => (
                <View key={index} style={styles.paymentFeature}>
                  <Ionicons name={feature.icon as any} size={16} color="#0B3E25" />
                  <Text style={[styles.paymentFeatureText, { color: colors.textSecondary }]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.socialSection}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="share-social" size={20} color="#8b5cf6" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Bizi Takip Edin
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Kampanyalardan ilk siz haberdar olun
                </Text>
              </View>
            </View>
            
            <View style={styles.socialButtons}>
              {[
                { icon: 'logo-instagram', color: '#e4405f', label: 'Instagram' },
                { icon: 'logo-facebook', color: '#1877f2', label: 'Facebook' },
                { icon: 'logo-twitter', color: '#1da1f2', label: 'Twitter' },
                { icon: 'logo-youtube', color: '#ff0000', label: 'YouTube' },
              ].map((social, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.socialButton, { backgroundColor: `${social.color}15` }]}
                >
                  <Ionicons name={social.icon as any} size={24} color={social.color} />
                  <Text style={[styles.socialLabel, { color: social.color }]}>
                    {social.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Newsletter Section */}
          <View style={styles.newsletterSection}>
            <LinearGradient
              colors={['#f0fdf4', '#dcfce7']}
              style={styles.newsletterGradient}
            >
              <View style={styles.newsletterHeader}>
                <Ionicons name="mail" size={32} color="#0B3E25" />
                <Text style={styles.newsletterTitle}>Bülten Aboneliği</Text>
                <Text style={styles.newsletterSubtitle}>
                  Özel kampanyalar ve yeni ürünlerden haberdar olun
                </Text>
              </View>
              
              <View style={styles.newsletterForm}>
                <TextInput
                  style={styles.newsletterInput}
                  placeholder="E-posta adresiniz"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                />
                <TouchableOpacity style={styles.newsletterButton}>
                  <LinearGradient
                    colors={['#0B3E25', '#082E1C']}
                    style={styles.newsletterButtonGradient}
                  >
                    <Text style={styles.newsletterButtonText}>Abone Ol</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <View style={styles.newsletterBenefits}>
                {['İlk alışverişte %10 indirim', 'Haftalık kampanya bilgilendirmesi', 'Özel fırsatlar'].map((benefit, index) => (
                  <View key={index} style={styles.newsletterBenefit}>
                    <Ionicons name="checkmark-circle" size={16} color="#0B3E25" />
                    <Text style={styles.newsletterBenefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* FAQ Quick Access Section */}
          <View style={styles.faqSection}>
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="help-circle" size={20} color="#F4A51C" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Sıkça Sorulan Sorular
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.faqList}>
              {[
                'Teslimat süresi ne kadar?',
                'Minimum sipariş tutarı var mı?',
                'İade politikası nedir?',
                'Hangi bölgelere teslimat yapılıyor?',
              ].map((question, index) => (
                <TouchableOpacity key={index} style={styles.faqItem}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>
                    {question}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Live Chat Button */}
          <TouchableOpacity style={styles.liveChatButton}>
            <LinearGradient
              colors={['#0B3E25', '#082E1C']}
              style={styles.liveChatGradient}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="chatbubbles" size={24} color="#fff" />
              </Animated.View>
              <Text style={styles.liveChatText}>Canlı Destek</Text>
              <View style={styles.liveChatBadge}>
                <View style={styles.liveChatDot} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Trust Badges Section */}
          <View style={styles.trustSection}>
            <Text style={[styles.trustTitle, { color: colors.text }]}>
              Güvenli Alışverişin Adresi
            </Text>
            <View style={styles.trustBadges}>
              {[
                { icon: 'shield-checkmark', text: 'SSL Sertifikalı' },
                { icon: 'card', text: 'Güvenli Ödeme' },
                { icon: 'refresh', text: 'Kolay İade' },
                { icon: 'time', text: '7/24 Destek' },
              ].map((badge, index) => (
                <View key={index} style={styles.trustBadge}>
                  <View style={styles.trustBadgeIcon}>
                    <Ionicons name={badge.icon as any} size={24} color="#0B3E25" />
                  </View>
                  <Text style={[styles.trustBadgeText, { color: colors.textSecondary }]}>
                    {badge.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Manavım ile taze ürünler kapınızda
            </Text>
            <Text style={[styles.footerVersion, { color: colors.textSecondary }]}>
              v1.0.0 • Made with ❤️ in Turkey
            </Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Hakkımızda</Text>
              </TouchableOpacity>
              <Text style={styles.footerDivider}>•</Text>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Gizlilik</Text>
              </TouchableOpacity>
              <Text style={styles.footerDivider}>•</Text>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Şartlar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Filter Panel */}
      {renderFilterPanel()}
    </SafeAreaView>
  );
}

// Styles - Main container styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Header styles with Glassmorphism
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerBackground: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerBackgroundImage: {
    opacity: 1,
  },
  headerContent: {
    gap: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  locationAddress: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  
  // Scroll view styles
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  
  // Banner styles
  bannerSection: {
    marginTop: 0,
    marginBottom: 20,
  },
  bannerItem: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerImageStyle: {
    borderRadius: 16,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerTextContainer: {
    gap: 4,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  bannerIndicatorActive: {
    backgroundColor: '#0B3E25',
    width: 24,
  },
  
  // Quick actions styles
  quickActionsContainer: {
    marginBottom: 16,
  },
  quickActionsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  
  // Stats section styles
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Section styles
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionLink: {
    fontSize: 14,
    color: '#0B3E25',
    fontWeight: '600',
  },
  viewModeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Category styles
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    position: 'relative',
  },
  categoryCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: CATEGORY_CARD_SIZE,
    height: CATEGORY_CARD_SIZE,
    borderRadius: CATEGORY_CARD_SIZE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconContainerSelected: {
    borderColor: '#0B3E25',
    backgroundColor: '#f0fdf4',
  },
  categoryEmoji: {
    fontSize: 36,
  },
  categoryName: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#0B3E25',
    fontWeight: 'bold',
  },
  categoryCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Vendor card styles
  vendorsList: {
    paddingHorizontal: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vendorImageSection: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  vendorImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(107, 114, 128, 0.95)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  statusDotClosed: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  vendorInfoSection: {
    padding: 16,
  },
  vendorHeaderRow: {
    marginBottom: 12,
  },
  vendorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vendorName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  ratingCount: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#082E1C',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  vendorActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  vendorActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  vendorActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Product card styles
  productCard: {
    width: FEATURED_PRODUCT_CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    height: 36,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#082E1C',
  },
  productOriginalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  productUnit: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  productAddButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  productAddGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  productAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Tip card styles
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  
  // Review card styles
  reviewCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B3E25',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  reviewComment: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  
  // Filter panel styles
  filterPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    gap: 10,
  },
  filterOptionActive: {
    backgroundColor: '#0B3E25',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  ratingFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  ratingFilterButtonActive: {
    backgroundColor: '#0B3E25',
  },
  ratingFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  ratingFilterTextActive: {
    color: '#fff',
  },
  radiusSliderContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  radiusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  radiusButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterResetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterApplyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterApplyGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterApplyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Footer styles
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  footerLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#0B3E25',
    fontWeight: '500',
  },
  footerDivider: {
    fontSize: 12,
    color: '#d1d5db',
  },
  
  // Flash Sales Section Styles
  flashSalesSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  flashSalesGradient: {
    padding: 20,
  },
  flashSalesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  flashSalesIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashSalesTitleContainer: {
    flex: 1,
  },
  flashSalesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  flashSalesSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  countdownItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  countdownValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  countdownLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.7,
  },
  flashSalesButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flashSalesButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  
  // Seasonal Products Styles
  seasonalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  seasonalCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seasonalCardGradient: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  seasonalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seasonalBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  seasonalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  seasonalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  seasonalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F4A51C',
  },
  
  // Social Proof Styles
  socialProofSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  socialProofCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0B3E25',
  },
  socialProofIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialProofContent: {
    flex: 1,
  },
  socialProofTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  socialProofNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B3E25',
  },
  socialProofSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Loyalty Section Styles
  loyaltySection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  loyaltyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyaltyContent: {
    flex: 1,
  },
  loyaltyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  loyaltySubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  loyaltyPoints: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  loyaltyPointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  loyaltyPointsLabel: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  loyaltyProgress: {
    marginBottom: 20,
  },
  loyaltyProgressBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loyaltyProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  loyaltyProgressText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
  },
  loyaltyButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loyaltyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  
  // Bundle Deals Styles
  bundlesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bundleCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  bundleCardGradient: {
    padding: 16,
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bundleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  bundleDiscountBadge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bundleDiscountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  bundleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bundleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bundleInfoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  bundlePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B3E25',
  },
  bundleButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  bundleButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  bundleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Trending Section Styles
  trendingSection: {
    marginBottom: 24,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  trendingItem: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  trendingRank: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  trendingRankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  trendingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  trendingName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingPercentage: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B3E25',
  },
  
  // Recipe Card Styles
  recipeCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImageContainer: {
    height: 120,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  recipeEmoji: {
    fontSize: 56,
  },
  recipeDifficultyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recipeDifficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  recipeInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipeTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Nutrition Section Styles
  nutritionSection: {
    marginBottom: 24,
  },
  nutritionCards: {
    paddingHorizontal: 20,
    gap: 12,
  },
  nutritionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionContent: {
    flex: 1,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  nutritionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  
  // Activity Feed Styles
  activityFeedSection: {
    marginBottom: 24,
  },
  activityList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // Download Section Styles
  downloadSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  downloadGradient: {
    padding: 24,
  },
  downloadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  downloadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadTextContainer: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  downloadSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  downloadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  downloadButtonText: {
    flex: 1,
  },
  downloadButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Payment Section Styles
  paymentSection: {
    marginBottom: 24,
  },
  paymentMethods: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  paymentMethodItem: {
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentFeatures: {
    paddingHorizontal: 20,
    gap: 12,
  },
  paymentFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentFeatureText: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Social Section Styles
  socialSection: {
    marginBottom: 24,
  },
  socialButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Newsletter Section Styles
  newsletterSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  newsletterGradient: {
    padding: 24,
  },
  newsletterHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  newsletterTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  newsletterSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  newsletterForm: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#0B3E25',
  },
  newsletterButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newsletterButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsletterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  newsletterBenefits: {
    gap: 10,
  },
  newsletterBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsletterBenefitText: {
    fontSize: 13,
    color: '#082E1C',
    flex: 1,
  },
  
  // FAQ Section Styles
  faqSection: {
    marginBottom: 24,
  },
  faqList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  
  // Live Chat Button Styles
  liveChatButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  liveChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  liveChatText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  liveChatBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveChatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0B3E25',
  },
  
  // Trust Section Styles
  trustSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  trustBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  trustBadge: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 64) / 2,
  },
  trustBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
});
