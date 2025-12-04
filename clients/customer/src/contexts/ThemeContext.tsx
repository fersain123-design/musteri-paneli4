import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryDark: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  overlay: string;
}

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  toggleTheme: () => void;
}

// MANAVIM Official Brand Colors (2025)
const BRAND_PRIMARY = '#0B3E25'; // Primary Color (Ana)
const BRAND_ACCENT = '#F4A51C'; // Accent Color (İkincil / Vurgu)
const BRAND_BACKGROUND = '#F7F3EC'; // Background (Arka plan)
const BRAND_WHITE = '#FFFFFF'; // White
const BRAND_TEXT_PRIMARY = '#0A2E1D'; // Text Primary
const BRAND_TEXT_SECONDARY = '#55685F'; // Text Secondary

const lightColors: ThemeColors = {
  background: BRAND_BACKGROUND,
  surface: BRAND_WHITE,
  card: BRAND_WHITE,
  text: BRAND_TEXT_PRIMARY,
  textSecondary: BRAND_TEXT_SECONDARY,
  border: BRAND_PRIMARY,
  primary: BRAND_PRIMARY,
  primaryDark: '#082E1C', // Pressed state
  error: '#ef4444',
  success: BRAND_PRIMARY,
  warning: BRAND_ACCENT,
  info: BRAND_ACCENT,
  overlay: 'rgba(11, 62, 37, 0.5)',
};

const darkColors: ThemeColors = {
  background: '#0A2E1D',
  surface: '#0B3E25',
  card: '#0B3E25',
  text: BRAND_WHITE,
  textSecondary: '#A8B5AF',
  border: BRAND_PRIMARY,
  primary: BRAND_PRIMARY,
  primaryDark: '#082E1C',
  error: '#ef4444',
  success: BRAND_PRIMARY,
  warning: BRAND_ACCENT,
  info: BRAND_ACCENT,
  overlay: 'rgba(0,0,0,0.7)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@manavim_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'auto') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themeMode,
        setThemeMode,
        colors,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
