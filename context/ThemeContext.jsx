import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { applyTheme, t } from '@/constants/theme';

const KEY = 'qx-theme';
const CHOICES = ['system', 'light', 'dark'];

let reopen = null;

/** The screen to return to after the theme change remounts everything (read once). */
export function takeReopen() {
  const to = reopen;
  reopen = null;
  return to;
}

const ThemeContext = createContext({ choice: 'system', scheme: 'dark', setChoice: () => {} });

/** Reads the saved choice before the first screen draws, so the app never flashes the wrong theme. */
export async function loadThemeChoice() {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    return CHOICES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Light, dark, or follow the phone. The native side (keyboard, alerts, date pickers) is told
 * through Appearance.setColorScheme, so it matches the app too.
 * Children are remounted when the theme changes, because module styles read `t` once per theme.
 */
export function ThemeProvider({ initialChoice = 'system', children }) {
  const [choice, setChoiceState] = useState(initialChoice);

  // Apply the override before reading the scheme, so the first render already has it.
  useMemo(() => {
    try {
      Appearance.setColorScheme(choice === 'system' ? 'unspecified' : choice);
    } catch {}
  }, [choice]);

  const system = useColorScheme();
  const scheme = choice === 'system' ? (system === 'light' ? 'light' : 'dark') : choice;
  if (t.scheme !== scheme) applyTheme(scheme);

  // A choice that did not change the colours (dark to System on a dark phone) remounts nothing,
  // so drop the screen it asked to return to.
  const shown = useRef(scheme);
  useEffect(() => {
    if (shown.current === scheme) reopen = null;
    shown.current = scheme;
  }, [choice, scheme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.bg).catch(() => {});
  }, [scheme]);

  /** reopenPath: the screen the person is on, so they stay there after the remount. */
  const setChoice = useCallback((next, reopenPath) => {
    if (!CHOICES.includes(next)) return;
    reopen = reopenPath || null;
    setChoiceState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ choice, scheme, setChoice }), [choice, scheme, setChoice]);
  return <ThemeContext.Provider value={value}>{children(scheme)}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
