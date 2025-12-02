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

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      // Phone number'ı email formatına çeviriyoruz (backend uyumu için)
      const email = phone.includes('@') ? phone : `${phone}@manavim.com`;
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.message || 'Giriş başarısız');
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Telefon */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Telefon Numarası"
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

            {/* Şifremi Unuttum */}
            <TouchableOpacity style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum?</Text>
            </TouchableOpacity>

            {/* Giriş Yap Butonu */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            {/* Kayıt Ol Butonu */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/register')}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 20,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B3E25',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
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
  forgotPasswordText: {
    fontSize: 14,
    color: '#0B3E25',
    fontWeight: '600',
    textAlign: 'right',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#0B3E25',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F7F3EC',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#0B3E25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0B3E25',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
