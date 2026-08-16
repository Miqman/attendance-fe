import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/services/authStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Protected Auth Guard Navigation
  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!token && !inAuthGroup) {
      // Unauthenticated -> Redirect to Login page
      router.replace('/auth/login');
    } else if (token && inAuthGroup) {
      // Authenticated -> Redirect to Dashboard
      router.replace('/');
    }
  }, [token, segments, isHydrated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="employees" />
        <Stack.Screen name="history" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="report" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="attendance/[id]" />
        <Stack.Screen name="auth/login" />
      </Stack>
    </ThemeProvider>
  );
}
