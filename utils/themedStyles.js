import { t } from '@/constants/theme';

/**
 * Styles that follow the theme.
 *
 *   const styles = themed(() => StyleSheet.create({ card: { backgroundColor: t.card } }));
 *
 * The function runs again the first time a style is read after the theme changes, and the
 * result is kept per theme, so switching back and forth costs nothing after the first time.
 */
export function themed(make) {
  const cache = {};
  const current = () => (cache[t.scheme] ||= make());
  return new Proxy(
    {},
    {
      get: (_, key) => current()[key],
      has: (_, key) => key in current(),
      ownKeys: () => Reflect.ownKeys(current()),
      getOwnPropertyDescriptor: (_, key) => {
        const value = current()[key];
        return value === undefined ? undefined : { value, enumerable: true, configurable: true, writable: false };
      },
    }
  );
}
