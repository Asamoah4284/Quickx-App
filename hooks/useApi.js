import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/constants/api';
import { useAppState } from '@/context/AppState';

/**
 * Load a GET endpoint. Pass `null` as the path to skip (for example while signed out).
 * Sends the member's token when there is one.
 * Returns { data, loading, error, reload, refreshing, refresh }.
 * `refresh` is for pull-to-refresh: it keeps the old data on screen while it loads.
 * `refetchOnFocus` reloads quietly each time the screen comes back into view.
 */
export function useApi(path, { refetchOnFocus = false } = {}) {
  const { token } = useAppState();
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const [refreshing, setRefreshing] = useState(false);
  const request = useRef(0);
  const first = useRef(true);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!path) {
        setState({ data: null, loading: false, error: null });
        return null;
      }
      const id = ++request.current;
      if (!quiet) setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await api(path, { token });
        if (id === request.current) setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        if (id === request.current) {
          setState((prev) => ({ data: quiet ? prev.data : null, loading: false, error: quiet && prev.data ? null : error }));
        }
        return null;
      }
    },
    [path, token]
  );

  useEffect(() => {
    first.current = true;
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!refetchOnFocus) return;
      if (first.current) {
        first.current = false;
        return;
      }
      load({ quiet: true });
    }, [refetchOnFocus, load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load({ quiet: true });
    setRefreshing(false);
  }, [load]);

  return { ...state, reload: load, refresh, refreshing };
}
