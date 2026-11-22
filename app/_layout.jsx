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
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Stack, router, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { ActionSheetHost } from '@/components/ui/ActionSheet';
import { LogoMark } from '@/components/ui/Logo';
import { t } from '@/constants/theme';
import { AppStateProvider, useAppState } from '@/context/AppState';
import { ThemeProvider, loadThemeChoice, takeReopen } from '@/context/ThemeContext';
import { appRouteFor } from '@/utils/pushNotifications';
import { themed } from '@/utils/themedStyles';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

/** Navigation colours for the current theme. */
const navTheme = () => {
  const base = t.scheme === 'light' ? DefaultTheme : DarkTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: t.brand400,
      background: t.bg,
      card: t.bgRaised,
      text: t.fg,
      border: t.line,
      notification: t.down,
    },
  };
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

const stack = () => ({
  headerShown: false,
  contentStyle: { backgroundColor: t.bg },
  animation: 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: false,
});

/** After a theme change the screens remount; this puts the person back where they were. */
function ReopenAfterTheme() {
  const pathname = usePathname();
  useEffect(() => {
    const to = takeReopen();
    if (to && pathname !== to) router.push(to);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function RootNav() {
  const { authReady } = useAppState();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SignInWatcher />
      {Platform.OS !== 'web' ? <NotificationRouter /> : null}
      <ReopenAfterTheme />
      <Stack screenOptions={stack()}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="learn/[courseId]/index" />
        <Stack.Screen name="learn/[courseId]/lesson/[lessonId]" />
        <Stack.Screen name="downloads/index" />
        <Stack.Screen name="downloads/play" />
        <Stack.Screen name="book/[id]/read" />
        <Stack.Screen name="events/my-tickets" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="delete-account" />
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
  const [themeChoice, setThemeChoice] = useState(null);

  useEffect(() => {
    loadThemeChoice().then(setThemeChoice);
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const ready = loaded && themeChoice;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AppStateProvider>
      <ThemeProvider initialChoice={themeChoice}>
        {(scheme) => (
          <NavThemeProvider value={navTheme()}>
            <StatusBar style={t.statusBar} />
            <RootNav key={scheme} />
          </NavThemeProvider>
        )}
      </ThemeProvider>
    </AppStateProvider>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    boot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
  })
);
