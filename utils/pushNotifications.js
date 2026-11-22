import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/constants/api';
import { t } from '@/constants/theme';

let registeredToken = null;

// Show alerts while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for permission (once), get this phone's Expo push token and save it on the server,
 * so signals, replies and payouts reach the phone. Safe to call on every sign-in.
 */
export async function registerPushNotifications(authToken) {
  if (!authToken || Platform.OS === 'web' || !Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      // The channel must exist before asking for a token on Android 13+.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'QuickX alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
        lightColor: t.brand500,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted && current.canAskAgain !== false) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (!granted) return null;

    const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null; // set by `eas init`; push needs it
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!pushToken || pushToken === registeredToken) return pushToken;

    await api('/notifications/register-device', {
      method: 'POST',
      token: authToken,
      body: { token: pushToken, platform: Platform.OS },
    });
    registeredToken = pushToken;
    return pushToken;
  } catch {
    return null;
  }
}

/**
 * Notifications carry website paths (the same links the web app uses).
 * Turn one into the matching screen in the app.
 */
export function appRouteFor(webPath) {
  const raw = String(webPath || '').trim();
  if (!raw.startsWith('/')) return '/notifications';
  const [pathAndQuery, hash] = raw.split('#');
  const [pathname, query = ''] = pathAndQuery.split('?');
  const tabMatch = query.match(/(?:^|&)tab=([^&]*)/);
  const tab = tabMatch ? decodeURIComponent(tabMatch[1]) : '';
  const parts = pathname.split('/').filter(Boolean);

  if (hash === 'wallet') return '/wallet';
  switch (parts[0]) {
    case 'signals':
      return '/signals';
    case 'community':
      return tab ? `/community?tab=${encodeURIComponent(tab)}` : '/community';
    case 'mentorship':
      return '/mentorship';
    case 'pie':
    case 'ptrading':
      return parts[1] ? `/pie/${parts[1]}` : '/pie';
    case 'events':
      return parts[1] ? `/events/${parts[1]}` : '/events';
    case 'courses':
      return parts[1] ? `/course/${parts[1]}` : '/courses';
    case 'school':
      return parts[2] ? `/learn/${parts[2]}` : '/courses';
    case 'store':
      return parts[1] ? `/book/${parts[1]}` : '/books';
    case 'pricing':
      return '/pricing';
    case 'account':
      return '/account';
    default:
      return '/notifications';
  }
}
