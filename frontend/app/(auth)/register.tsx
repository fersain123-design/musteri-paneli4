import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phone || !password || !confirmPassword) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      alert('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      alert('Şifre en az 6 karakter olmalı');
      return;
    }

    if (!acceptTerms) {
      alert('Lütfen KVKK ve Kullanıcı Sözleşmesini kabul edin');
      return;
    }

    setLoading(true);
    try {
      const email = phone.includes('@') ? phone : `${phone}@manavim.com`;
      await register({
        email,
        password,
        full_name: fullName,
        phone,
        role: 'customer',
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#0B3E25" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Başlık */}
          <Text style={styles.title}>Kayıt Ol</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Ad Soyad */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                placeholderTextColor="#55685F"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Telefon */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Telefon"
                placeholderTextColor="#55685F"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Şifre */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Şifre"
                placeholderTextColor="#55685F"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#55685F"
                />
              </TouchableOpacity>
            </View>

            {/* Şifre Tekrar */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Şifre Tekrar"
                placeholderTextColor="#55685F"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#55685F"
                />
              </TouchableOpacity>
            </View>

            {/* KVKK Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>
                <Text style={styles.linkText}>KVKK</Text> ve{' '}
                <Text style={styles.linkText}>Kullanıcı Sözleşmesi</Text>'ni kabul ediyorum
              </Text>
            </TouchableOpacity>

            {/* Hesap Oluştur Butonu */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Hesap Oluştur</Text>
              )}
            </TouchableOpacity>

            {/* Giriş Yap Linki */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading}>
                <Text style={styles.footerLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#0B3E25',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0B3E25',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#0B3E25',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0A2E1D',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#0B3E25',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0B3E25',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#55685F',
    lineHeight: 20,
  },
  linkText: {
    color: '#0B3E25',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#0B3E25',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 15,
    color: '#55685F',
  },
  footerLink: {
    fontSize: 15,
    color: '#0B3E25',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
