import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Keyboard,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone: string;
  role: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  phone?: string;
}

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: 'customer',
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    animateProgress();
  }, [currentStep]);

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

  const animateProgress = () => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateStep = (step: number): boolean => {
    console.log('🔍 VALIDATE_STEP BAŞLADI - Adım:', step);
    console.log('📝 Form Data:', JSON.stringify(formData, null, 2));
    
    const newErrors: FormErrors = {};

    if (step === 1) {
      console.log('✅ Adım 1 validasyonu başlıyor...');
      console.log('full_name değeri:', formData.full_name);
      console.log('full_name trim:', formData.full_name.trim());
      console.log('full_name length:', formData.full_name.trim().length);
      
      if (!formData.full_name.trim()) {
        console.log('❌ Ad Soyad boş!');
        newErrors.full_name = 'Ad Soyad gerekli';
      } else if (formData.full_name.trim().length < 3) {
        console.log('❌ Ad Soyad çok kısa!');
        newErrors.full_name = 'Ad Soyad en az 3 karakter olmalı';
      } else {
        console.log('✅ Ad Soyad geçerli');
      }

      console.log('phone değeri:', formData.phone);
      if (!formData.phone.trim()) {
        console.log('❌ Telefon boş!');
        newErrors.phone = 'Telefon numarası gerekli';
      } else if (!validatePhone(formData.phone)) {
        console.log('❌ Telefon formatı geçersiz!');
        newErrors.phone = 'Geçerli bir telefon numarası girin (05xxxxxxxxx)';
      } else {
        console.log('✅ Telefon geçerli');
      }
    } else if (step === 2) {
      console.log('✅ Adım 2 validasyonu başlıyor...');
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email adresi gerekli';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Geçerli bir email adresi girin';
      }

      if (!formData.password) {
        newErrors.password = 'Şifre gerekli';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalı';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifre tekrarı gerekli';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    }

    console.log('📊 Validasyon hataları:', newErrors);
    console.log('📊 Hata sayısı:', Object.keys(newErrors).length);
    
    // Show errors in Alert for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ VALIDATION BAŞARISIZ - Hatalar gösteriliyor');
      const errorMessages = Object.values(newErrors).join('\n');
      Alert.alert('Validation Hatası', errorMessages);
      setErrors(newErrors);
      shakeAnimation();
      return false;
    }
    
    console.log('✅ VALIDATION BAŞARILI - Devam ediliyor');
    setErrors(newErrors);
    return true;
  };

  const handleNext = () => {
    console.log('🚀 HANDLE_NEXT ÇAĞRILDI');
    console.log('📍 Mevcut adım:', currentStep);
    
    const isValid = validateStep(currentStep);
    console.log('📊 Validation sonucu:', isValid);
    
    if (isValid) {
      console.log('✅ Validation geçti!');
      if (currentStep < 3) {
        console.log('➡️ Bir sonraki adıma geçiliyor:', currentStep + 1);
        setCurrentStep(currentStep + 1);
      } else {
        console.log('🎯 Son adım - Kayıt işlemi başlatılıyor');
        handleRegister();
      }
    } else {
      console.log('❌ Validation başarısız - Adım değişmedi');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      router.back();
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...registerData } = formData;
      await register({
        ...registerData,
        email: registerData.email.trim().toLowerCase(),
      });
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/(tabs)');
      });
    } catch (error: any) {
      shakeAnimation();
      Alert.alert('Kayıt Hatası', error.message || 'Kayıt işlemi başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key as keyof FormErrors]) {
      setErrors({ ...errors, [key]: undefined });
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0B3E25', '#082E1C', '#0B3E25']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.content,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
                    zIndex: 1,
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.headerContainer}>
                  <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.header}>
                    <View style={styles.iconContainer}>
                      <LinearGradient colors={['#fff', '#f0fdf4']} style={styles.iconGradient}>
                        <Ionicons name="storefront" size={48} color="#0B3E25" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.title}>MANAVIM</Text>
                    <Text style={styles.subtitle}>Çiftçiden Halka</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                    <Text style={styles.progressText}>Adım {currentStep}/3</Text>
                  </View>

                  {/* Step indicators */}
                  <View style={styles.stepsContainer}>
                    {[1, 2, 3].map((step) => (
                      <View key={step} style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepCircle,
                            currentStep >= step && styles.stepCircleActive,
                            currentStep > step && styles.stepCircleCompleted,
                          ]}
                        >
                          {currentStep > step ? (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          ) : (
                            <Text
                              style={[
                                styles.stepNumber,
                                currentStep >= step && styles.stepNumberActive,
                              ]}
                            >
                              {step}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.stepLabel}>
                          {step === 1 ? 'Bilgiler' : step === 2 ? 'Güvenlik' : 'Onay'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Form Steps */}
                <View style={styles.form}>
                  {currentStep === 1 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Kişisel Bilgileriniz</Text>
                      
                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Ad Soyad *</Text>
                        <View style={[styles.inputContainer, errors.full_name && styles.inputError]}>
                          <Ionicons name="person-outline" size={20} color="#0B3E25" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Adınız ve Soyadınız"
                            placeholderTextColor="#9ca3af"
                            value={formData.full_name}
                            onChangeText={(text) => updateFormData('full_name', text)}
                            editable={!loading}
                          />
                        </View>
                        {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Telefon *</Text>
                        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                          <Ionicons name="call-outline" size={20} color="#0B3E25" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="05xx xxx xx xx"
                            placeholderTextColor="#9ca3af"
                            value={formData.phone}
                            onChangeText={(text) => updateFormData('phone', text)}
                            keyboardType="phone-pad"
                            maxLength={11}
                            editable={!loading}
                          />
                        </View>
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                      </View>
                    </View>
                  )}

                  {currentStep === 2 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Giriş Bilgileriniz</Text>
                      
                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email *</Text>
                        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                          <Ionicons name="mail-outline" size={20} color="#0B3E25" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="ornek@email.com"
                            placeholderTextColor="#9ca3af"
                            value={formData.email}
                            onChangeText={(text) => updateFormData('email', text)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                          />
                        </View>
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Şifre *</Text>
                        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                          <Ionicons name="lock-closed-outline" size={20} color="#0B3E25" style={styles.inputIcon} />
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="En az 6 karakter"
                            placeholderTextColor="#9ca3af"
                            value={formData.password}
                            onChangeText={(text) => updateFormData('password', text)}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                          />
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#0B3E25" />
                          </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Şifre Tekrar *</Text>
                        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                          <Ionicons name="lock-closed-outline" size={20} color="#0B3E25" style={styles.inputIcon} />
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Şifrenizi tekrar girin"
                            placeholderTextColor="#9ca3af"
                            value={formData.confirmPassword}
                            onChangeText={(text) => updateFormData('confirmPassword', text)}
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                          />
                          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#0B3E25" />
                          </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                      </View>

                      {/* Password strength */}
                      <View style={styles.passwordStrength}>
                        <View style={styles.strengthBars}>
                          <View style={[styles.strengthBar, formData.password.length >= 6 && styles.strengthBarActive]} />
                          <View style={[styles.strengthBar, formData.password.length >= 8 && styles.strengthBarActive]} />
                          <View style={[styles.strengthBar, formData.password.length >= 10 && styles.strengthBarActive]} />
                        </View>
                        <Text style={styles.strengthText}>
                          {formData.password.length < 6 ? 'Zayıf' : formData.password.length < 8 ? 'Orta' : 'Güçlü'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {currentStep === 3 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Son Adım</Text>
                      
                      <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Bilgileriniz</Text>
                        <View style={styles.summaryRow}>
                          <Ionicons name="person" size={20} color="#082E1C" />
                          <Text style={styles.summaryText}>{formData.full_name}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Ionicons name="mail" size={20} color="#082E1C" />
                          <Text style={styles.summaryText}>{formData.email}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Ionicons name="call" size={20} color="#082E1C" />
                          <Text style={styles.summaryText}>{formData.phone}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Navigation Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleNext}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={['#fff', '#f9fafb']} style={styles.nextButtonGradient}>
                        {loading ? (
                          <ActivityIndicator color="#082E1C" />
                        ) : (
                          <>
                            <Text style={styles.nextButtonText}>
                              {currentStep === 3 ? 'Kayıt Ol' : 'Devam Et'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#082E1C" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Footer */}
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading}>
                      <Text style={styles.footerLink}>Giriş Yap</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  content: { flex: 1 },
  headerContainer: { marginTop: 16, marginBottom: 32 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconContainer: { marginBottom: 16 },
  iconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
  progressContainer: { marginBottom: 24 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#fff', textAlign: 'center', fontWeight: '600' },
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  stepCircleActive: { backgroundColor: '#fff', borderColor: '#fff' },
  stepCircleCompleted: { backgroundColor: '#082E1C' },
  stepNumber: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  stepNumberActive: { color: '#082E1C' },
  stepLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
  form: { gap: 20 },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  inputWrapper: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: 'transparent' },
  inputError: { borderColor: '#ef4444' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
  eyeIcon: { padding: 8 },
  errorText: { fontSize: 12, color: '#fca5a5', marginLeft: 4, fontWeight: '500' },
  passwordStrength: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  strengthBarActive: { backgroundColor: '#fff' },
  strengthText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#fff' },
  termsText: { flex: 1, fontSize: 13, color: '#fff', lineHeight: 20 },
  termsLink: { fontWeight: 'bold', textDecorationLine: 'underline' },
  buttonContainer: { marginTop: 8 },
  nextButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 32, gap: 8 },
  nextButtonText: { color: '#082E1C', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  footerLink: { color: '#fff', fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
});
