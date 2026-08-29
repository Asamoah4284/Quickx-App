import { Platform } from 'react-native';
import Constants from 'expo-constants';

function fromHost(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text.replace(/\/$/, '');
  const match = text.match(/(\d+\.\d+\.\d+\.\d+)/);
  return match ? `http://${match[1]}:5000/api` : null;
}

function resolveApiBase() {
  const fromEnv = fromHost(process.env.EXPO_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  const fromExtra = fromHost(Constants.expoConfig?.extra?.apiUrl);
  if (fromExtra) return fromExtra;

  const fromExpo = fromHost(
    Constants.expoConfig?.hostUri ||
      Constants.expoGoConfig?.debuggerHost ||
      Constants.linkingUri
  );
  if (fromExpo) return fromExpo;

  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://127.0.0.1:5000/api';
}

export const API_BASE = resolveApiBase();

export function isNetworkError(error) {
  const message = String(error?.message || '');
  return (
    error?.name === 'TypeError' ||
    error?.name === 'AbortError' ||
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Aborted')
  );
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const fromErrors = Array.isArray(data.errors) ? data.errors[0]?.msg : null;
      throw new Error(fromErrors || data.message || 'Request failed');
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
