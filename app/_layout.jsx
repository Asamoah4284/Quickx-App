import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { BackHandler, StyleSheet, View } from 'react-native';

import { AppStateProvider, useAppState } from '@/context/AppState';
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

function AuthRedirect() {
  const { user, authReady } = useAppState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, authReady, segments, router]);

  useEffect(() => {
    if (!user) return undefined;
    const onBack = () => {
      if (segments[0] === '(tabs)' || segments[0] === '(auth)') return true;
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [user, segments]);

  return null;
}

function RootNav() {
  const { authReady } = useAppState();

  return (
    <View style={{ flex: 1 }}>
      <AuthRedirect />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.surface },
          animation: 'slide_from_right',
          animationDuration: 380,
          gestureEnabled: true,
          // Edge swipe only — full-screen gesture fights vertical scrolling (Learning Area, feeds, etc.)
          fullScreenGestureEnabled: false,
          gestureDirection: 'horizontal',
        }}>
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'none',
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="learn/[courseId]/index"
          options={{ title: 'Learning area', fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="learn/[courseId]/lesson/[lessonId]"
          options={{ title: 'Lesson', fullScreenGestureEnabled: false }}
        />
        <Stack.Screen name="tutors/index" options={{ title: 'Find a Tutor' }} />
        <Stack.Screen name="wallet/index" options={{ title: 'QuickX Wallet' }} />
        <Stack.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="live" options={{ title: 'Live Classes' }} />
        <Stack.Screen name="ai" options={{ title: 'QuickX AI' }} />
        <Stack.Screen name="trading" options={{ title: 'AI Trading' }} />
        <Stack.Screen name="bookings/index" options={{ title: 'My Bookings' }} />
        <Stack.Screen name="my-courses/index" options={{ title: 'My courses' }} />
        <Stack.Screen name="programs/index" options={{ title: 'Creator onboarding' }} />
        <Stack.Screen name="programs/[slug]" options={{ title: 'Program' }} />
        <Stack.Screen name="creator/courses/index" options={{ title: 'My teaching courses' }} />
        <Stack.Screen name="creator/courses/[courseId]" options={{ title: 'Edit course' }} />
        <Stack.Screen name="communities/index" options={{ title: 'Communities' }} />
        <Stack.Screen name="community/[tutorId]/index" options={{ title: 'Community' }} />
        <Stack.Screen name="subscribe/[tutorId]" options={{ title: 'Subscribe' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {!authReady ? <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.navy }} /> : null}
    </View>
  );
}

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
        <RootNav />
      </ThemeProvider>
    </AppStateProvider>
  );
}
