import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppStateProvider } from '@/context/AppState';
import { colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.surface,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppStateProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.surface },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tutors/index" options={{ title: 'Find a Tutor' }} />
          <Stack.Screen name="wallet/index" options={{ title: 'QuickX Wallet' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications', presentation: 'modal' }} />
          <Stack.Screen name="live" options={{ title: 'Live Classes' }} />
          <Stack.Screen name="ai" options={{ title: 'QuickX AI' }} />
          <Stack.Screen name="trading" options={{ title: 'AI Trading' }} />
          <Stack.Screen name="bookings/index" options={{ title: 'My Bookings' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </AppStateProvider>
  );
}
