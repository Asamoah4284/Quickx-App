import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';

import { haptics } from '@/utils/haptics';

/** Copy text. `copied` holds the key of the last thing copied for about 1.6 seconds. */
export function useCopy() {
  const [copied, setCopied] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text, key = 'default') => {
    try {
      await Clipboard.setStringAsync(String(text ?? ''));
      haptics.success();
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1600);
      return true;
    } catch {
      haptics.error();
      return false;
    }
  }, []);

  return { copy, copied };
}
