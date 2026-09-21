import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { api } from '@/constants/api';

let registeredToken = null;

export async function registerPushNotifications(authToken) {
  if (!authToken || authToken === 'local') return null;
  if (Platform.OS === 'web') return null;

  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (!Device.isDevice) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.slug;

    const pushToken = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = pushToken?.data;
    if (!token || token === registeredToken) return token;

    await api('/notifications/register-device', {
      method: 'POST',
      token: authToken,
      body: { token, platform: Platform.OS },
    });
    registeredToken = token;
    return token;
  } catch {
    return null;
  }
}
