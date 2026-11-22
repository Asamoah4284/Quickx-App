import { Alert, Linking } from 'react-native';

/** True only for navigable http(s) / mailto / tel links, not plain labels like "In Person". */
export function isOpenableUrl(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return /^(https?:\/\/|mailto:|tel:)/i.test(text);
}

export async function openExternalUrl(value, { title = 'Link unavailable' } = {}) {
  const text = String(value || '').trim();
  if (!isOpenableUrl(text)) {
    if (text) {
      Alert.alert(title, text.includes(' ') ? `Location: ${text}` : 'This is not a web link.');
    }
    return false;
  }
  try {
    const supported = await Linking.canOpenURL(text);
    if (!supported) {
      Alert.alert(title, 'Cannot open this link on your device.');
      return false;
    }
    await Linking.openURL(text);
    return true;
  } catch {
    Alert.alert(title, 'Could not open this link.');
    return false;
  }
}
