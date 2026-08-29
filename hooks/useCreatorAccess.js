import { useCallback, useEffect, useState } from 'react';

import { useAppState } from '@/context/AppState';
import { api } from '@/constants/api';
import {
  fetchCreatorProfile,
  hasSubmittedCreatorApplication,
  isApprovedCreator,
} from '@/utils/creator';

/** Pull latest role + creatorStatus from the server (cached login data goes stale after approval). */
export async function refreshCreatorSession(token, updateUser) {
  if (!token || token === 'local') return null;

  const [session, profile] = await Promise.all([
    api('/users/validate-token', { token }).catch(() => null),
    fetchCreatorProfile(token).catch(() => null),
  ]);

  const freshUser = profile?.user || session?.user || null;
  if (freshUser && updateUser) {
    await updateUser(freshUser);
  }

  return {
    user: freshUser,
    creatorStatus: freshUser?.creatorStatus || profile?.creatorStatus || 'not_applied',
    approved: isApprovedCreator(freshUser),
    applied: hasSubmittedCreatorApplication(freshUser),
  };
}

export function useCreatorAccess() {
  const { user, token, updateUser } = useAppState();
  const [syncing, setSyncing] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);

  const refresh = useCallback(async () => {
    if (!token || token === 'local') {
      setSessionUser(null);
      setSyncing(false);
      return null;
    }

    setSyncing(true);
    try {
      const result = await refreshCreatorSession(token, updateUser);
      if (result?.user) setSessionUser(result.user);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [token, updateUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const effectiveUser = sessionUser || user;

  return {
    user: effectiveUser,
    approved: isApprovedCreator(effectiveUser),
    applied: hasSubmittedCreatorApplication(effectiveUser),
    syncing,
    refresh,
  };
}
