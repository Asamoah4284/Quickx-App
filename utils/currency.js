import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '@/constants/api';

/**
 * Catalog prices (courses, books, programs, subscriptions) are stored in the platform currency
 * (USD by default) and charged in GHS at the platform exchange rate — same as the website.
 * Wallet, Pie Trading and event amounts are already GHS and must NOT go through toGhs().
 */
const CACHE_KEY = 'quickx.currencySettings';
let settings = { currency: 'USD', rate: 15.5 };

function normalise(raw) {
  return {
    currency: raw?.defaultCurrency === 'GHS' || raw?.currency === 'GHS' ? 'GHS' : 'USD',
    rate: Number(raw?.exchangeRateUsdToGhs ?? raw?.rate) > 0 ? Number(raw.exchangeRateUsdToGhs ?? raw.rate) : 15.5,
  };
}

/** Load cached settings immediately, then refresh from the API (bounded wait so launch isn't blocked). */
export async function loadCurrencySettings() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) settings = normalise(JSON.parse(cached));
  } catch {
    // ignore
  }

  const refresh = api('/platform/settings')
    .then((data) => {
      settings = normalise(data);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(settings)).catch(() => {});
      return settings;
    })
    .catch(() => settings);

  // Wait up to 4s on first launch; afterwards the cache is used and the refresh finishes in the background.
  const timeout = new Promise((resolve) => setTimeout(() => resolve(settings), 4000));
  return Promise.race([refresh, timeout]);
}

export function getCurrencySettings() {
  return settings;
}

/** Convert a catalog price to the GHS amount the buyer actually pays. */
export function toGhs(amount) {
  const n = Number(amount) || 0;
  return settings.currency === 'USD' ? Math.round(n * settings.rate * 100) / 100 : Math.round(n * 100) / 100;
}
