import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../src/store/cartStore';
import { showToast } from '../../src/components/Toast';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  is_available: boolean;
  discount_percentage: number;
  quality_grade?: string;
  vendor_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'discount';
type ViewMode = 'grid' | 'list';

export default function Search() {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedQuality, setSelectedQuality] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const filterSlideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    loadCategories();
    startAnimations();
  }, []);

  useEffect(() => {
    if (searchQuery || selectedCategory) {
      searchProducts();
    } else {
      setProducts([]);
      setFilteredProducts([]);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, sortBy, priceRange, selectedQuality, onlyAvailable, onlyDiscount]);

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

  const toggleFilters = () => {
    const toValue = showFilters ? -300 : 0;
    Animated.spring(filterSlideAnim, {
      toValue,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setShowFilters(!showFilters);
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      let url = '/products?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      
      const response = await api.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      showToast({
        message: 'Arama sırasında hata oluştu',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max
    );

    // Quality filter
    if (selectedQuality.length > 0) {
      filtered = filtered.filter((p) =>
        selectedQuality.includes(p.quality_grade || 'A')
      );
    }

    // Availability filter
    if (onlyAvailable) {
      filtered = filtered.filter((p) => p.is_available && p.stock > 0);
    }

    // Discount filter
    if (onlyDiscount) {
      filtered = filtered.filter((p) => p.discount_percentage > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'discount':
        filtered.sort((a, b) => b.discount_percentage - a.discount_percentage);
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product._id, 1);
      showToast({
        message: `${product.name} sepete eklendi`,
        type: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      showToast({
        message: error.message || 'Sepete eklenemedi',
        type: 'error',
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSortBy('default');
    setPriceRange({ min: 0, max: 1000 });
    setSelectedQuality([]);
    setOnlyAvailable(true);
    setOnlyDiscount(false);
    showToast({
      message: 'Filtreler temizlendi',
      type: 'info',
      duration: 1500,
    });
  };

  const toggleQuality = (quality: string) => {
    setSelectedQuality((prev) =>
      prev.includes(quality)
        ? prev.filter((q) => q !== quality)
        : [...prev, quality]
    );
  };

  const renderProductCard = ({ item, index }: { item: Product; index: number }) => {
    const hasDiscount = item.discount_percentage > 0;
    const discountedPrice = item.price;
    const originalPrice = hasDiscount
      ? item.price / (1 - item.discount_percentage / 100)
      : item.price;

    if (viewMode === 'list') {
      return (
        <Animated.View
          style={[
            styles.listCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.listImageContainer}>
            {item.images && item.images.length > 0 ? (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.listImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.listImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#d1d5db" />
              </View>
            )}
            {hasDiscount && (
              <View style={styles.listDiscountBadge}>
                <Text style={styles.listDiscountText}>%{item.discount_percentage}</Text>
              </View>
            )}
          </View>

          <View style={styles.listContent}>
            <View style={styles.listHeader}>
              <Text style={styles.listProductName} numberOfLines={2}>
                {item.name}
              </Text>
              {item.quality_grade && (
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityText}>{item.quality_grade}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.listCategory}>{item.category}</Text>
            
            <View style={styles.listFooter}>
              <View style={styles.listPriceContainer}>
                <Text style={styles.listPrice}>
                  {discountedPrice.toFixed(2)} TL/{item.unit}
                </Text>
                {hasDiscount && (
                  <Text style={styles.listOriginalPrice}>
                    {originalPrice.toFixed(2)} TL
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.listAddButton,
                  !item.is_available && styles.listAddButtonDisabled,
                ]}
                onPress={() => handleAddToCart(item)}
                disabled={!item.is_available || item.stock === 0}
              >
                {item.is_available && item.stock > 0 ? (
                  <>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.listAddButtonText}>Ekle</Text>
                  </>
                ) : (
                  <Text style={styles.listAddButtonTextDisabled}>Tükendi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.productCard,
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
        <View style={styles.productImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={50} color="#d1d5db" />
            </View>
          )}
          
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>%{item.discount_percentage}</Text>
            </View>
          )}
          
          {item.quality_grade && (
            <View style={styles.qualityBadgeGrid}>
              <Text style={styles.qualityTextGrid}>{item.quality_grade}</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                {discountedPrice.toFixed(2)} TL
              </Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  {originalPrice.toFixed(2)}
                </Text>
              )}
            </View>
            <Text style={styles.unit}>/{item.unit}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              !item.is_available && styles.addButtonDisabled,
            ]}
            onPress={() => handleAddToCart(item)}
            disabled={!item.is_available || item.stock === 0}
          >
            <LinearGradient
              colors={
                item.is_available && item.stock > 0
                  ? ['#0B3E25', '#0f3a1a']
                  : ['#9ca3af', '#6b7280']
              }
              style={styles.addButtonGradient}
            >
              {item.is_available && item.stock > 0 ? (
                <>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>Sepete Ekle</Text>
                </>
              ) : (
                <Text style={styles.addButtonText}>Tükendi</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderCategoryChip = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive,
      ]}
      onPress={() =>
        setSelectedCategory(selectedCategory === item.id ? '' : item.id)
      }
      activeOpacity={0.7}
    >
      <Text style={styles.categoryChipEmoji}>{item.icon}</Text>
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item.id && styles.categoryChipTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ara</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={22}
              color="#111827"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, showFilters && styles.headerButtonActive]}
            onPress={toggleFilters}
          >
            <Ionicons name="options" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryChip}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Sort Bar */}
      {filteredProducts.length > 0 && (
        <View style={styles.sortBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortList}
          >
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortBy === 'default' && styles.sortChipActive,
              ]}
              onPress={() => setSortBy('default')}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === 'default' && styles.sortChipTextActive,
                ]}
              >
                Varsayılan
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortBy === 'price_asc' && styles.sortChipActive,
              ]}
              onPress={() => setSortBy('price_asc')}
            >
              <Ionicons
                name="arrow-up"
                size={14}
                color={sortBy === 'price_asc' ? '#fff' : '#6b7280'}
              />
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === 'price_asc' && styles.sortChipTextActive,
                ]}
              >
                Fiyat
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortBy === 'price_desc' && styles.sortChipActive,
              ]}
              onPress={() => setSortBy('price_desc')}
            >
              <Ionicons
                name="arrow-down"
                size={14}
                color={sortBy === 'price_desc' ? '#fff' : '#6b7280'}
              />
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === 'price_desc' && styles.sortChipTextActive,
                ]}
              >
                Fiyat
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortBy === 'discount' && styles.sortChipActive,
              ]}
              onPress={() => setSortBy('discount')}
            >
              <Ionicons
                name="pricetag"
                size={14}
                color={sortBy === 'discount' ? '#fff' : '#6b7280'}
              />
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === 'discount' && styles.sortChipTextActive,
                ]}
              >
                İndirim
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B3E25" />
          <Text style={styles.loadingText}>Aranıyor...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProductCard}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          columnWrapperStyle={viewMode === 'grid' ? styles.productRow : undefined}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filteredProducts.length} ürün bulundu
            </Text>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory ? 'Ürün bulunamadı' : 'Aramaya başlayın'}
          </Text>
          {(searchQuery || selectedCategory) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
            >
              <Text style={styles.clearButtonText}>Aramayı Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Panel */}
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
          {/* Quality Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Kalite</Text>
            <View style={styles.filterOptions}>
              {['A', 'B', 'C'].map((quality) => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.filterOption,
                    selectedQuality.includes(quality) && styles.filterOptionActive,
                  ]}
                  onPress={() => toggleQuality(quality)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedQuality.includes(quality) && styles.filterOptionTextActive,
                    ]}
                  >
                    {quality} Kalite
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.filterCheckbox}
              onPress={() => setOnlyAvailable(!onlyAvailable)}
            >
              <View
                style={[
                  styles.checkbox,
                  onlyAvailable && styles.checkboxActive,
                ]}
              >
                {onlyAvailable && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.filterCheckboxText}>Sadece stokta olanlar</Text>
            </TouchableOpacity>
          </View>

          {/* Discount Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.filterCheckbox}
              onPress={() => setOnlyDiscount(!onlyDiscount)}
            >
              <View
                style={[
                  styles.checkbox,
                  onlyDiscount && styles.checkboxActive,
                ]}
              >
                {onlyDiscount && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.filterCheckboxText}>İndirimli ürünler</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.filterFooter}>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Temizle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={toggleFilters}
          >
            <LinearGradient
              colors={['#0B3E25', '#0f3a1a']}
              style={styles.applyFiltersGradient}
            >
              <Text style={styles.applyFiltersText}>Uygula</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Filter Overlay */}
      {showFilters && (
        <TouchableOpacity
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={toggleFilters}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 24, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  headerButtonActive: { backgroundColor: '#0B3E25' },
  searchSection: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  categoriesSection: { paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  categoriesList: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, gap: 6 },
  categoryChipActive: { backgroundColor: '#0B3E25', borderColor: '#0B3E25' },
  categoryChipEmoji: { fontSize: 16 },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  categoryChipTextActive: { color: '#fff' },
  sortBar: { backgroundColor: colors.surface, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sortList: { paddingHorizontal: 20, gap: 8 },
  sortChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  sortChipActive: { backgroundColor: '#0B3E25' },
  sortChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sortChipTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
  productsContainer: { padding: 20 },
  resultCount: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, fontWeight: '500' },
  productRow: { justifyContent: 'space-between', marginBottom: 16 },
  productCard: { width: CARD_WIDTH, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  productImageContainer: { width: '100%', height: 160, backgroundColor: colors.card },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  qualityBadgeGrid: { position: 'absolute', top: 8, right: 8, backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  qualityTextGrid: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4, height: 36 },
  productCategory: { fontSize: 11, color: colors.textSecondary, marginBottom: 8, textTransform: 'capitalize' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#0f3a1a' },
  originalPrice: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  unit: { fontSize: 12, color: colors.textSecondary, marginLeft: 2 },
  addButton: { borderRadius: 10, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  addButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  addButtonDisabled: { opacity: 0.6 },
  listCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  listImageContainer: { width: 100, height: 100, borderRadius: 10, overflow: 'hidden', marginRight: 12 },
  listImage: { width: '100%', height: '100%' },
  listImagePlaceholder: { width: '100%', height: '100%', backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  listDiscountBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  listDiscountText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  listContent: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  listProductName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, marginRight: 8 },
  qualityBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qualityText: { fontSize: 10, fontWeight: '600', color: '#1e40af' },
  listCategory: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  listFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listPriceContainer: { flex: 1 },
  listPrice: { fontSize: 16, fontWeight: 'bold', color: '#0f3a1a' },
  listOriginalPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through', marginTop: 2 },
  listAddButton: { backgroundColor: '#0B3E25', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  listAddButtonDisabled: { backgroundColor: '#9ca3af' },
  listAddButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  listAddButtonTextDisabled: { fontSize: 12, fontWeight: '600', color: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginTop: 16, marginBottom: 24 },
  clearButton: { backgroundColor: '#0B3E25', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  clearButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  filterPanel: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 300, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10, zIndex: 1000 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  filterContent: { flex: 1, padding: 20 },
  filterSection: { marginBottom: 24 },
  filterSectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  filterOptions: { flexDirection: 'row', gap: 8 },
  filterOption: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  filterOptionActive: { backgroundColor: '#0B3E25', borderColor: '#0B3E25' },
  filterOptionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterOptionTextActive: { color: '#fff' },
  filterCheckbox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#0B3E25', borderColor: '#0B3E25' },
  filterCheckboxText: { fontSize: 15, color: colors.text },
  filterFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  clearFiltersButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' },
  clearFiltersText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  applyFiltersButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  applyFiltersGradient: { paddingVertical: 14, alignItems: 'center' },
  applyFiltersText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  filterOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 },
});
