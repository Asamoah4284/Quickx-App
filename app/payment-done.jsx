import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { t } from '@/constants/theme';

/**
 * Paystack sends people back with quickxlearn://payment-done. The payment screen that
 * opened the checkout confirms it, so this route only steps back to that screen.
 */
export default function PaymentDone() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  return <View style={{ flex: 1, backgroundColor: t.bg }} />;
}
