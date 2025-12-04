import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { showToast } from '../src/components/Toast';
import { useTheme } from '../src/contexts/ThemeContext';

// MapView is not available - show placeholder only
// This prevents the codegenNativeCommands error
const MapView: any = null;
const Marker: any = null;
const PROVIDER_GOOGLE: any = null;

export default function AddAddress() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState({
    latitude: 37.0902,
    longitude: 37.3833,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 37.0902,
    longitude: 37.3833,
  });

  const [addressData, setAddressData] = useState({
    title: '',
    street: '',
    buildingNo: '',
    floor: '',
    apartment: '',
    directions: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarkerPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        showToast({
          message: 'Konum izni reddedildi',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setMarkerPosition(coordinate);
  };

  const handleMyLocation = async () => {
    if (!locationPermission) {
      await requestLocationPermission();
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarkerPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      showToast({
        message: 'Konumunuz güncellendi',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Konum alınamadı',
        type: 'error',
      });
    }
  };

  const handleSave = async () => {
    if (!addressData.title.trim()) {
      showToast({ message: 'Lütfen adres başlığı girin (Ev, İş vb.)', type: 'error' });
      return;
    }

    if (!addressData.street.trim()) {
      showToast({ message: 'Lütfen sokak/cadde bilgisi girin', type: 'error' });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAddress = {
        ...addressData,
        latitude: markerPosition.latitude,
        longitude: markerPosition.longitude,
      };
      
      console.log('New Address:', newAddress);
      
      showToast({
        message: 'Adres başarıyla eklendi',
        type: 'success',
      });
      
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      showToast({
        message: 'Adres eklenemedi',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
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
        <Text style={styles.headerTitle}>Yeni Adres Ekle</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.mapContainer}>
          {Platform.OS !== 'web' && MapView ? (
            <>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={markerPosition}
                  draggable
                  onDragEnd={(e) => setMarkerPosition(e.nativeEvent.coordinate)}
                >
                  <View style={styles.customMarker}>
                    <Ionicons name="location" size={40} color="#0B3E25" />
                  </View>
                </Marker>
              </MapView>

              {/* My Location Button */}
              <TouchableOpacity
                style={styles.myLocationButton}
                onPress={handleMyLocation}
              >
                <Ionicons name="locate" size={24} color="#0B3E25" />
              </TouchableOpacity>

              {/* Info Box */}
              <View style={styles.mapInfoBox}>
                <Ionicons name="information-circle" size={20} color="#fff" />
                <Text style={styles.mapInfoText}>
                  Haritada konumu seçin veya pini sürükleyin
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.webMapPlaceholder}>
              <LinearGradient
                colors={['#0B3E25', '#0f3a1a']}
                style={styles.webMapGradient}
              >
                <Ionicons name="map" size={60} color="#fff" />
                <Text style={styles.webMapText}>
                  Harita özelliği mobil cihazlarda kullanılabilir
                </Text>
                <Text style={styles.webMapSubtext}>
                  Lütfen Expo Go uygulaması ile açın
                </Text>
                <TouchableOpacity
                  style={styles.webLocationButton}
                  onPress={handleMyLocation}
                >
                  <Ionicons name="locate" size={20} color="#0B3E25" />
                  <Text style={styles.webLocationButtonText}>
                    Mevcut Konumumu Kullan
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Address Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adres Başlığı *</Text>
              <View style={styles.titleButtons}>
                {['Ev', 'İş', 'Diğer'].map((title) => (
                  <TouchableOpacity
                    key={title}
                    style={[
                      styles.titleButton,
                      addressData.title === title && styles.titleButtonActive,
                    ]}
                    onPress={() => setAddressData({ ...addressData, title })}
                  >
                    <Text
                      style={[
                        styles.titleButtonText,
                        addressData.title === title && styles.titleButtonTextActive,
                      ]}
                    >
                      {title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {addressData.title === 'Diğer' && (
                <TextInput
                  style={styles.input}
                  placeholder="Başlık girin (örn: Annemin Evi)"
                  placeholderTextColor={colors.textSecondary}
                  value={addressData.title === 'Ev' || addressData.title === 'İş' ? '' : addressData.title}
                  onChangeText={(text) => setAddressData({ ...addressData, title: text })}
                />
              )}
            </View>

            {/* Street */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sokak/Cadde *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Atatürk Caddesi"
                placeholderTextColor={colors.textSecondary}
                value={addressData.street}
                onChangeText={(text) => setAddressData({ ...addressData, street: text })}
              />
            </View>

            <View style={styles.row}>
              {/* Building No */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Bina No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 123"
                  placeholderTextColor={colors.textSecondary}
                  value={addressData.buildingNo}
                  onChangeText={(text) => setAddressData({ ...addressData, buildingNo: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Floor */}
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Kat</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 5"
                  placeholderTextColor={colors.textSecondary}
                  value={addressData.floor}
                  onChangeText={(text) => setAddressData({ ...addressData, floor: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Apartment */}
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Daire</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 12"
                  placeholderTextColor={colors.textSecondary}
                  value={addressData.apartment}
                  onChangeText={(text) => setAddressData({ ...addressData, apartment: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Directions */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adres Tarifi (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Örn: Yeşil kapılı bina, zil numarası 12"
                placeholderTextColor={colors.textSecondary}
                value={addressData.directions}
                onChangeText={(text) => setAddressData({ ...addressData, directions: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0B3E25', '#0f3a1a']}
              style={styles.saveButtonGradient}
            >
              {isLoading ? (
                <Text style={styles.saveButtonText}>Kaydediliyor...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Adresi Kaydet</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    mapContainer: {
      height: 250,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    webMapPlaceholder: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: 0,
    },
    webMapGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      gap: 12,
    },
    webMapText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    webMapSubtext: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
      textAlign: 'center',
    },
    webLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#fff',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 12,
    },
    webLocationButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0B3E25',
    },
    customMarker: {
      alignItems: 'center',
    },
    myLocationButton: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    mapInfoBox: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(11, 62, 37, 0.9)',
      padding: 12,
      borderRadius: 12,
    },
    mapInfoText: {
      flex: 1,
      fontSize: 12,
      color: '#fff',
      fontWeight: '500',
    },
    formContainer: {
      flex: 1,
    },
    form: {
      padding: 20,
      paddingBottom: 100,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    titleButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    titleButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    titleButtonActive: {
      backgroundColor: '#0B3E2515',
      borderColor: '#0B3E25',
    },
    titleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    titleButtonTextActive: {
      color: '#0B3E25',
    },
    row: {
      flexDirection: 'row',
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 80,
      paddingTop: 12,
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
    saveButton: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    saveButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });
