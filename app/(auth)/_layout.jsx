import { Stack, useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';

/**
 * Sign-in screens. They open as a sheet; once the person is signed in the whole
 * sheet closes and they are back where they were. Closing it without signing in
 * tells whoever asked (requireSignIn) that the answer is no.
 */
export default function AuthLayout() {
  const { isSignedIn, dismissSignIn } = useAppState();
  const navigation = useNavigation();
  const wasSignedIn = useRef(isSignedIn);

  useEffect(() => {
    if (isSignedIn && !wasSignedIn.current && navigation.canGoBack()) navigation.goBack();
    wasSignedIn.current = isSignedIn;
  }, [isSignedIn, navigation]);

  useEffect(() => () => dismissSignIn(), [dismissSignIn]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: t.bg },
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password/[token]" />
    </Stack>
  );
}
