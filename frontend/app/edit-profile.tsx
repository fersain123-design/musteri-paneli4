import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { showToast } from '../src/components/Toast';
import { useTheme } from '../src/contexts/ThemeContext';

export default function EditProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast({ message: 'Lütfen adınızı girin', type: 'error' });
      return;
    }

    if (!phone.trim()) {
      showToast({ message: 'Lütfen telefon numaranızı girin', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // API çağrısı simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store'u güncelle (gerçek uygulamada API'den gelecek)
      showToast({
        message: 'Profil başarıyla güncellendi',
        type: 'success',
      });
      
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      showToast({
        message: 'Güncelleme başarısız',
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
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <LinearGradient
                colors={['#0B3E25', '#0f3a1a']}
                style={styles.photoGradient}
              >
                <Ionicons name="person" size={60} color="#fff" />
              </LinearGradient>
              <TouchableOpacity style={styles.photoEditButton}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.photoHint}>Fotoğrafı değiştir</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Adınız ve soyadınız"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@email.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Telefon numaranız teslimat için kullanılacaktır
              </Text>
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
                  <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
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
    content: {
      flex: 1,
    },
    photoSection: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    photoContainer: {
      position: 'relative',
      marginBottom: 12,
    },
    photoGradient: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoEditButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F4A51C',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    photoHint: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    form: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderWidth: 2,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 12,
      marginLeft: 12,
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
