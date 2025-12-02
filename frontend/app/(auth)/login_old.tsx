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
  Animated,
  ScrollView,
  Dimensions,
  Keyboard,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const emailInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateInput = (anim: Animated.Value, focused: boolean) => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email adresi gerekli';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      shakeAnimation();
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login(email.trim().toLowerCase(), password);
      
      // Success animation
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
      
      const errorMessage = error.message || 'Giriş başarısız oldu';
      
      if (errorMessage.includes('email') || errorMessage.includes('password')) {
        setErrors({
          email: 'Email veya şifre hatalı',
          password: 'Email veya şifre hatalı',
        });
      } else {
        Alert.alert(
          'Giriş Hatası',
          errorMessage,
          [
            { text: 'Tamam', style: 'default' },
            { text: 'Tekrar Dene', onPress: () => handleLogin() },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Şifremi Unuttum',
      'Email adresinizi girin, şifre sıfırlama bağlantısı gönderelim',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: () => {
            if (validateEmail(email)) {
              Alert.alert('Başarılı', 'Email adresinize bağlantı gönderildi');
            } else {
              Alert.alert('Hata', 'Lütfen geçerli bir email adresi girin');
            }
          },
        },
      ]
    );
  };

  const emailBorderColor = emailInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', '#0B3E25'],
  });

  const passwordBorderColor = passwordInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', '#0B3E25'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0B3E25', '#082E1C', '#0a2510']}
        style={styles.gradient}
      >
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
                style={[
                  styles.content,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { translateX: shakeAnim },
                    ],
                  },
                ]}
              >
                {/* Back button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={['#fff', '#f0fdf4']}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="storefront" size={48} color="#0B3E25" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.title}>MANAVIM</Text>
                  <Text style={styles.subtitle}>Çiftçiden Halka</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Email Adresi</Text>
                    <Animated.View
                      pointerEvents="box-none"
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: errors.email ? '#ef4444' : emailBorderColor,
                          backgroundColor: focusedInput === 'email' ? '#fff' : 'rgba(255,255,255,0.95)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={errors.email ? '#ef4444' : '#0B3E25'}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="ornek@email.com"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) {
                            setErrors({ ...errors, email: undefined });
                          }
                        }}
                        onFocus={() => {
                          setFocusedInput('email');
                          animateInput(emailInputAnim, true);
                        }}
                        onBlur={() => {
                          setFocusedInput(null);
                          animateInput(emailInputAnim, false);
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        editable={!loading}
                      />
                      {email.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setEmail('')}
                          style={styles.clearButton}
                        >
                          <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Şifre</Text>
                    <Animated.View
                      pointerEvents="box-none"
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: errors.password ? '#ef4444' : passwordBorderColor,
                          backgroundColor: focusedInput === 'password' ? '#fff' : 'rgba(255,255,255,0.95)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={errors.password ? '#ef4444' : '#047857'}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Şifrenizi girin"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) {
                            setErrors({ ...errors, password: undefined });
                          }
                        }}
                        onFocus={() => {
                          setFocusedInput('password');
                          animateInput(passwordInputAnim, true);
                        }}
                        onBlur={() => {
                          setFocusedInput(null);
                          animateInput(passwordInputAnim, false);
                        }}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color="#047857"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                    {errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {/* Remember me & Forgot password */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={styles.rememberMe}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          rememberMe && styles.checkboxChecked,
                        ]}
                      >
                        {rememberMe && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.rememberMeText}>Beni hatırla</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      disabled={loading}
                    >
                      <Text style={styles.forgotPassword}>Şifremi Unuttum?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Login button */}
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      loading && styles.loginButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={loading ? ['#9ca3af', '#6b7280'] : ['#fff', '#f9fafb']}
                      style={styles.loginButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Giriş Yap</Text>
                          <Ionicons name="arrow-forward" size={20} color="#082E1C" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>veya</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social login buttons */}
                  <View style={styles.socialButtons}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => Alert.alert('Bilgi', 'Yakında eklenecek')}
                    >
                      <Ionicons name="logo-google" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => Alert.alert('Bilgi', 'Yakında eklenecek')}
                    >
                      <Ionicons name="logo-apple" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => Alert.alert('Bilgi', 'Yakında eklenecek')}
                    >
                      <Ionicons name="logo-facebook" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Footer */}
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Hesabınız yok mu? </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/(auth)/register')}
                      disabled={loading}
                    >
                      <Text style={styles.footerLink}>Kayıt Ol</Text>
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
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  backButton: {
    marginTop: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#fca5a5',
    marginLeft: 4,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  loginButtonText: {
    color: '#082E1C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
