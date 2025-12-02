import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ToastProvider } from '../src/components/Toast';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    async function prepare() {
      try {
        // Load user data with error handling
        await loadUser();
      } catch (error) {
        console.log('Auth loading error (non-critical):', error);
      } finally {
        // Hide splash after loading attempt
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 2000);
      }
    }
    
    prepare();
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="vendor/[id]" />
        </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}
