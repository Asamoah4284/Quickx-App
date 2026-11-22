import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { api } from '@/constants/api';

/**
 * Money rules, the same as the website:
 * - Every price is stored in Ghana cedis (GH₵) and Paystack always charges cedis.
 * - The admin "display currency" only changes how prices are SHOWN. With USD on,
 *   GH₵155 shows as "$10" at the admin's rate. Nothing is ever charged in dollars.
 */
const CACHE_KEY = 'quickx.currencySettings.v2';
const DEFAULT_RATE = 15.5;
let settings = { currency: 'GHS', rate: DEFAULT_RATE };
const listeners = new Set();

function normalise(raw) {
  const currency = raw?.defaultCurrency === 'USD' || raw?.currency === 'USD' ? 'USD' : 'GHS';
  const rate = Number(raw?.exchangeRateUsdToGhs ?? raw?.rate);
  return { currency, rate: rate > 0 ? rate : DEFAULT_RATE };
}

function publish(next) {
  settings = next;
  listeners.forEach((fn) => {
    try {
      fn(settings);
    } catch {
      // one bad listener must not stop the others
    }
  });
}

/** Use the cached settings straight away, then refresh from the server (waits at most 4s). */
export async function loadCurrencySettings() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) publish(normalise(JSON.parse(cached)));
  } catch {
    // ignore
  }
  const refresh = api('/platform/settings')
    .then((data) => {
      const next = normalise(data);
      publish(next);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    })
    .catch(() => settings);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(settings), 4000));
  return Promise.race([refresh, timeout]);
}

export function getCurrencySettings() {
  return settings;
}

function number(n, decimals) {
  const max = decimals != null ? decimals : Math.round(n * 100) % 100 !== 0 ? 2 : 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals ?? 0, maximumFractionDigits: max });
}

/** A browsing price (plans, courses, books) in the display currency: "GH₵155" or "$10". */
export function money(ghs) {
  const n = Number(ghs || 0);
  if (settings.currency === 'USD') return `$${number(Math.round((n / settings.rate) * 100) / 100)}`;
  return `GH₵${number(n)}`;
}

/** Exact cedis. Use wherever money actually moves: checkout totals, wallet, withdrawals, Pie. */
export function cedis(ghs) {
  return `GH₵${number(Number(ghs || 0))}`;
}

/** Re-renders when the admin changes the display currency. */
export function useCurrency() {
  const [value, setValue] = useState(settings);
  useEffect(() => {
    setValue(settings);
    listeners.add(setValue);
    return () => listeners.delete(setValue);
  }, []);
  return value;
}
