import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// For Expo Go: use your computer's local IP
// Get it by running: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
const getBackendURL = () => {
  if (Platform.OS === 'web') {
    // Web can use relative URL
    return '';
  }
  // Get backend URL from environment variable (required for deployment)
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL environment variable is required');
  }
  return backendUrl;
};

const BACKEND_URL = getBackendURL();

const api = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
