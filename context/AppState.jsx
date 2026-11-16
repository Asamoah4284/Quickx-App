import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api, setUnauthorizedHandler } from '@/constants/api';
import { loginWithEmail as loginWithEmailApi } from '@/utils/auth';
import { loadCurrencySettings } from '@/utils/currency';
import { registerPushNotifications } from '@/utils/pushNotifications';

const AUTH_KEY = 'quickx.auth';
const AVATAR_KEY = 'quickx.avatarUri';
const WISHLIST_KEY = 'quickx.wishlist';
const CART_KEY = 'quickx.bookCart';
const PROGRESS_KEY = 'quickx.progress';

const EMPTY_ACCESS = { features: [], entitlements: [], isOwner: false, loaded: false };

const AppStateContext = createContext(null);

function readJson(raw, fallback) {
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Who is signed in, what they can open, and small things kept on the phone
 * (book cart, wishlist, lesson progress).
 *
 * People can browse without an account. `requireSignIn(reason)` opens the sign-in sheet
 * and resolves with the new token once they are signed in (false if they close it),
 * so an action can carry on afterwards: `const tk = await requireSignIn('...'); if (!tk) return;`
 */
export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [walletBalance, setWalletBalance] = useState(0);
  const [avatarUri, setAvatarUriState] = useState(null);
  const [wishlistBooks, setWishlistBooks] = useState([]);
  const [cartBookIds, setCartBookIds] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState({});
  const [signInPrompt, setSignInPrompt] = useState(null);
  const pendingSignIn = useRef(null);

  // ── Start-up: restore the session and local lists ──
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AUTH_KEY),
      AsyncStorage.getItem(AVATAR_KEY),
      AsyncStorage.getItem(WISHLIST_KEY),
      AsyncStorage.getItem(CART_KEY),
      AsyncStorage.getItem(PROGRESS_KEY),
      loadCurrencySettings().catch(() => null),
    ])
      .then(([authRaw, avatar, wishRaw, cartRaw, progressRaw]) => {
        const saved = readJson(authRaw, null);
        if (saved?.token && saved.token !== 'local' && saved.user) {
          setUser(saved.user);
          setToken(saved.token);
        } else if (authRaw) {
          AsyncStorage.removeItem(AUTH_KEY).catch(() => {});
        }
        if (avatar) setAvatarUriState(avatar);
        setWishlistBooks(readJson(wishRaw, []));
        setCartBookIds(readJson(cartRaw, []));
        setEnrolledCourses(readJson(progressRaw, {}));
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (authReady) AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistBooks)).catch(() => {});
  }, [authReady, wishlistBooks]);
  useEffect(() => {
    if (authReady) AsyncStorage.setItem(CART_KEY, JSON.stringify(cartBookIds)).catch(() => {});
  }, [authReady, cartBookIds]);
  useEffect(() => {
    if (authReady) AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(enrolledCourses)).catch(() => {});
  }, [authReady, enrolledCourses]);

  // ── Session ──
  const persistAuth = useCallback(async (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken || null);
    if (nextUser && nextToken) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  }, []);

  const updateUser = useCallback(
    async (nextUser) => {
      if (!nextUser) return;
      setUser(nextUser);
      if (token) await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user: nextUser, token })).catch(() => {});
    },
    [token]
  );

  const logout = useCallback(async () => {
    await persistAuth(null, null);
    setAccess({ ...EMPTY_ACCESS, loaded: true });
    setWalletBalance(0);
    setEnrolledCourses({});
    setCartBookIds([]);
  }, [persistAuth]);

  // A signed-in request came back 401: the session ended on the server.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const refreshAccess = useCallback(async () => {
    if (!token) {
      setAccess({ ...EMPTY_ACCESS, loaded: true });
      return;
    }
    try {
      const data = await api('/me/entitlements', { token });
      setAccess({
        features: data.features || [],
        entitlements: data.entitlements || [],
        isOwner: Boolean(data.isOwner),
        loaded: true,
      });
    } catch {
      setAccess((prev) => ({ ...prev, loaded: true }));
    }
  }, [token]);

  const loadWallet = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await api('/wallet', { token });
      setWalletBalance(Number(data.balance || 0));
      return data;
    } catch {
      return null;
    }
  }, [token]);

  const refreshSession = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await api('/users/validate-token', { token });
      if (data?.user) {
        await updateUser(data.user);
        return data.user;
      }
    } catch {
      // offline, or the token expired (handled by the 401 handler)
    }
    return null;
  }, [token, updateUser]);

  // Whenever the session changes: who am I, what can I open, wallet, phone alerts.
  useEffect(() => {
    if (!authReady) return;
    setAccess((prev) => ({ ...prev, loaded: false }));
    refreshAccess();
    if (!token) return;
    refreshSession();
    loadWallet();
    registerPushNotifications(token).catch(() => {});
  }, [authReady, token, refreshAccess, refreshSession, loadWallet]);

  const completeSignIn = useCallback(
    async (data) => {
      await persistAuth(data.user, data.token);
      if (pendingSignIn.current) {
        pendingSignIn.current(data.token);
        pendingSignIn.current = null;
      }
      setSignInPrompt(null);
    },
    [persistAuth]
  );

  // ── Sign-in sheet (browse first) ──
  const requireSignIn = useCallback(
    (reason) => {
      if (token) return Promise.resolve(token);
      return new Promise((resolve) => {
        pendingSignIn.current?.(false);
        pendingSignIn.current = resolve;
        setSignInPrompt({ reason: reason || 'Sign in to continue.' });
      });
    },
    [token]
  );

  const dismissSignIn = useCallback(() => {
    pendingSignIn.current?.(false);
    pendingSignIn.current = null;
    setSignInPrompt(null);
  }, []);

  // ── Auth calls used by the sign-in screens ──
  const loginWithEmail = useCallback(
    async (email, password) => {
      const data = await loginWithEmailApi(email, password);
      await completeSignIn(data);
    },
    [completeSignIn]
  );

  const requestOtp = useCallback(async (phone, purpose, profile = {}) => {
    const data = await api('/users/otp/request', { method: 'POST', body: { phone, purpose, ...profile } });
    return { devCode: data.devCode };
  }, []);

  const verifyOtp = useCallback(
    async (phone, code) => {
      const data = await api('/users/otp/verify', { method: 'POST', body: { phone, code } });
      await completeSignIn(data);
    },
    [completeSignIn]
  );

  const registerWithEmail = useCallback(async ({ fullName, email, phone, password, referralCode }) => {
    const data = await api('/users/register', {
      method: 'POST',
      body: {
        fullName: String(fullName || '').trim(),
        email: String(email || '').trim().toLowerCase(),
        phone,
        password,
        country: 'Ghana',
        ...(referralCode ? { referralCode: String(referralCode).trim().toUpperCase() } : {}),
      },
    });
    return { devCode: data.devCode };
  }, []);

  const verifyEmailAccount = useCallback(
    async (email, code) => {
      const data = await api('/users/verify-account', {
        method: 'POST',
        body: { email: String(email || '').trim().toLowerCase(), code },
      });
      await completeSignIn(data);
    },
    [completeSignIn]
  );

  const resendEmailOtp = useCallback(async (email) => {
    const data = await api('/users/resend-otp', { method: 'POST', body: { email: String(email || '').trim().toLowerCase() } });
    return { devCode: data.devCode };
  }, []);

  // ── Local lists ──
  const setAvatarUri = useCallback((uri) => {
    setAvatarUriState(uri);
    if (uri) AsyncStorage.setItem(AVATAR_KEY, uri).catch(() => {});
    else AsyncStorage.removeItem(AVATAR_KEY).catch(() => {});
  }, []);

  const toggleWishlistBook = useCallback((id) => {
    setWishlistBooks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const toggleCartBook = useCallback((id) => {
    setCartBookIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const clearCart = useCallback(() => setCartBookIds([]), []);

  const grantCourseAccess = useCallback((courseId) => {
    setEnrolledCourses((prev) => (prev[courseId] ? prev : { ...prev, [courseId]: { progress: {}, lastLessonId: null } }));
  }, []);
  const markLessonComplete = useCallback((courseId, lessonId) => {
    setEnrolledCourses((prev) => {
      const current = prev[courseId] || { progress: {}, lastLessonId: null };
      return { ...prev, [courseId]: { ...current, progress: { ...current.progress, [lessonId]: true }, lastLessonId: lessonId } };
    });
  }, []);
  const setLastLesson = useCallback((courseId, lessonId) => {
    setEnrolledCourses((prev) => {
      const current = prev[courseId] || { progress: {}, lastLessonId: null };
      return { ...prev, [courseId]: { ...current, lastLessonId: lessonId } };
    });
  }, []);

  const value = useMemo(() => {
    const isSignedIn = Boolean(token && user);
    return {
      user,
      token,
      authReady,
      isSignedIn,
      // Access
      features: access.features,
      entitlements: access.entitlements,
      isOwner: access.isOwner,
      accessLoaded: access.loaded,
      has: (feature) => access.features.includes(feature),
      expiryOf: (feature) => access.entitlements.find((e) => e.feature === feature)?.endsAt || null,
      refreshAccess,
      // Session
      requireSignIn,
      signInPrompt,
      dismissSignIn,
      loginWithEmail,
      requestOtp,
      verifyOtp,
      registerWithEmail,
      verifyEmailAccount,
      resendEmailOtp,
      logout,
      updateUser,
      refreshSession,
      // Money
      walletBalance,
      loadWallet,
      // On this phone
      avatarUri,
      setAvatarUri,
      wishlistBooks,
      toggleWishlistBook,
      isWishlisted: (id) => wishlistBooks.includes(id),
      cartBookIds,
      toggleCartBook,
      clearCart,
      enrolledCourses,
      grantCourseAccess,
      markLessonComplete,
      setLastLesson,
      isEnrolled: (id) => Boolean(enrolledCourses[id]),
    };
  }, [
    user,
    token,
    authReady,
    access,
    refreshAccess,
    requireSignIn,
    signInPrompt,
    dismissSignIn,
    loginWithEmail,
    requestOtp,
    verifyOtp,
    registerWithEmail,
    verifyEmailAccount,
    resendEmailOtp,
    logout,
    updateUser,
    refreshSession,
    walletBalance,
    loadWallet,
    avatarUri,
    setAvatarUri,
    wishlistBooks,
    toggleWishlistBook,
    cartBookIds,
    toggleCartBook,
    clearCart,
    enrolledCourses,
    grantCourseAccess,
    markLessonComplete,
    setLastLesson,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
