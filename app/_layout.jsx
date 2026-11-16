import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, ThemeProvider } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { ActionSheetHost } from '@/components/ui/ActionSheet';
import { LogoMark } from '@/components/ui/Logo';
import { fonts, t } from '@/constants/theme';
import { AppStateProvider, useAppState } from '@/context/AppState';
import { appRouteFor } from '@/utils/pushNotifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: t.brand400,
    background: t.bg,
    card: t.bgRaised,
    text: t.fg,
    border: t.line,
    notification: t.down,
  },
};

/** Opens the sign-in sheet when something calls requireSignIn(). */
function SignInWatcher() {
  const { signInPrompt } = useAppState();
  const segments = useSegments();
  const inAuth = segments[0] === '(auth)';
  useEffect(() => {
    if (signInPrompt && !inAuth) router.push('/(auth)/login');
  }, [signInPrompt, inAuth]);
  return null;
}

/** Tapping a notification opens the matching screen. */
function NotificationRouter() {
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef(null);
  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const url = last.notification.request.content.data?.url;
    router.push(appRouteFor(url));
  }, [last]);
  return null;
}

const stack = {
  headerShown: false,
  contentStyle: { backgroundColor: t.bg },
  animation: 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: false,
};

/** Screens kept from the earlier app still use the native header, styled dark. */
const header = (title) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: t.bg },
  headerTintColor: t.fg,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
  headerShadowVisible: false,
  headerBackTitle: 'Back',
});

function RootNav() {
  const { authReady } = useAppState();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SignInWatcher />
      <NotificationRouter />
      <Stack screenOptions={stack}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="learn/[courseId]/index" options={header('Learning area')} />
        <Stack.Screen name="learn/[courseId]/lesson/[lessonId]" />
        <Stack.Screen name="downloads/index" options={header('Downloads')} />
        <Stack.Screen name="downloads/play" />
        <Stack.Screen name="book/[id]/read" options={header('Read')} />
        <Stack.Screen name="events/my-tickets" options={header('My tickets')} />
        <Stack.Screen name="notifications" options={header('Notifications')} />
        <Stack.Screen name="settings/index" options={header('Profile and settings')} />
        <Stack.Screen name="delete-account" options={header('Delete account')} />
        <Stack.Screen name="checkout/[key]" options={{ presentation: 'card' }} />
        <Stack.Screen name="owner/signal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="payment-done" options={{ animation: 'none' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <ActionSheetHost />
      {!authReady ? (
        <View style={styles.boot}>
          <LogoMark size={64} />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    ...Feather.font,
    ...FontAwesome.font,
    ...Ionicons.font,
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
        <StatusBar style="light" />
        <RootNav />
      </ThemeProvider>
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  boot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
});
