import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api, isNetworkError } from '@/constants/api';
import { initialTransactions, initialWallet } from '@/data/wallet';
import { loginWithEmail as loginWithEmailApi } from '@/utils/auth';
import { cancelBooking as cancelBookingApi, createBooking as createBookingApi, fetchBookings } from '@/utils/bookings';
import { registerPushNotifications } from '@/utils/pushNotifications';
import { fetchWallet, payFromWallet, topUpWallet, withdrawWallet } from '@/utils/wallet';

const AVATAR_KEY = 'quickx.avatarUri';
const AUTH_KEY = 'quickx.auth';
const SAVED_COURSES_KEY = 'quickx.savedCourses';
const BOOKINGS_KEY = 'quickx.bookings';
const CART_KEY = 'quickx.bookCart';

const AppStateContext = createContext(null);

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function AppStateProvider({ children }) {
  const [walletBalance, setWalletBalance] = useState(initialWallet.balance);
  const balanceRef = useRef(initialWallet.balance);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [savedCourses, setSavedCourses] = useState([]);
  const [wishlistBooks, setWishlistBooks] = useState([]);
  const [followedTutors, setFollowedTutors] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState({});
  const [bookings, setBookings] = useState([]);
  const [cartBookIds, setCartBookIds] = useState([]);
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [physicalOrders, setPhysicalOrders] = useState([]);
  const [avatarUri, setAvatarUriState] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY)
      .then((value) => {
        if (value) setAvatarUriState(value);
      })
      .catch(() => {});

    Promise.all([
      AsyncStorage.getItem(AUTH_KEY),
      AsyncStorage.getItem(SAVED_COURSES_KEY),
      AsyncStorage.getItem(BOOKINGS_KEY),
      AsyncStorage.getItem(CART_KEY),
    ])
      .then(([authRaw, savedRaw, bookingsRaw, cartRaw]) => {
        if (authRaw) {
          try {
            const parsed = JSON.parse(authRaw);
            if (parsed?.user) {
              setUser(parsed.user);
              setToken(parsed.token || null);
            }
          } catch {
            // ignore
          }
        }
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            if (Array.isArray(parsed)) setSavedCourses(parsed);
          } catch {
            // ignore
          }
        }
        if (bookingsRaw) {
          try {
            const parsed = JSON.parse(bookingsRaw);
            if (Array.isArray(parsed)) setBookings(parsed);
          } catch {
            // ignore
          }
        }
        if (cartRaw) {
          try {
            const parsed = JSON.parse(cartRaw);
            if (Array.isArray(parsed)) setCartBookIds(parsed);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!authReady) return;
    AsyncStorage.setItem(SAVED_COURSES_KEY, JSON.stringify(savedCourses)).catch(() => {});
  }, [authReady, savedCourses]);

  useEffect(() => {
    if (!authReady) return;
    AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)).catch(() => {});
  }, [authReady, bookings]);

  useEffect(() => {
    if (!authReady) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(cartBookIds)).catch(() => {});
  }, [authReady, cartBookIds]);

  const syncBookings = useCallback(async () => {
    if (!token || token === 'local') return;
    try {
      const list = await fetchBookings(token);
      setBookings(list);
    } catch {
      // keep local cache
    }
  }, [token]);

  const persistAuth = useCallback(async (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken || null);
    if (nextUser) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user: nextUser, token: nextToken || null }));
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  }, []);

  const updateUser = useCallback(async (nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ ...parsed, user: nextUser }));
    } catch {
      // ignore
    }
  }, []);

  const setBalance = useCallback((next) => {
    balanceRef.current = next;
    setWalletBalance(next);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!token || token === 'local') return null;
    try {
      const data = await api('/users/validate-token', { token });
      if (data?.user) {
        await updateUser(data.user);
        if (typeof data.user.walletBalance === 'number') {
          setBalance(data.user.walletBalance);
        }
        return data.user;
      }
    } catch {
      // offline or expired token
    }
    return null;
  }, [token, updateUser, setBalance]);

  const loadWallet = useCallback(async () => {
    if (!token || token === 'local') return null;
    try {
      const data = await fetchWallet(token);
      setBalance(Number(data.balance || 0));
      if (Array.isArray(data.transactions)) {
        setTransactions(
          data.transactions.map((tx) => ({
            id: tx.id,
            type: tx.type,
            label: tx.label,
            amount: tx.amount,
            date: tx.date ? String(tx.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: tx.status || 'completed',
          }))
        );
      }
      return data;
    } catch {
      return null;
    }
  }, [token, setBalance]);

  useEffect(() => {
    if (!authReady || !token || token === 'local') return;
    refreshSession();
    loadWallet();
    syncBookings();
    registerPushNotifications(token).catch(() => {});
  }, [authReady, token, refreshSession, loadWallet, syncBookings]);

  const loginWithEmail = useCallback(
    async (email, password) => {
      const data = await loginWithEmailApi(email, password);
      await persistAuth(data.user, data.token);
      if (typeof data.user?.walletBalance === 'number') {
        setBalance(data.user.walletBalance);
      }
      await loadWallet();
      registerPushNotifications(data.token).catch(() => {});
    },
    [persistAuth, loadWallet, setBalance]
  );

  const setAvatarUri = useCallback((uri) => {
    setAvatarUriState(uri);
    if (uri) AsyncStorage.setItem(AVATAR_KEY, uri).catch(() => {});
    else AsyncStorage.removeItem(AVATAR_KEY).catch(() => {});
  }, []);

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [
      { id: makeId('tx'), date: new Date().toISOString().slice(0, 10), status: 'completed', ...tx },
      ...prev,
    ]);
  }, []);

  const deposit = useCallback(
    async ({ amount, phone, network, onPending }) => {
      if (!token || token === 'local') return false;
      try {
        const result = await topUpWallet({ token, amount, phone, network, onPending });
        if (typeof result.balance === 'number') {
          setBalance(result.balance);
        }
        await loadWallet();
        return true;
      } catch {
        return false;
      }
    },
    [token, setBalance, loadWallet]
  );

  const withdraw = useCallback(
    async ({ amount, phone, network }) => {
      if (!token || token === 'local') return false;
      if (balanceRef.current < amount) return false;
      try {
        const result = await withdrawWallet({ token, amount, phone, network });
        if (typeof result.balance === 'number') {
          setBalance(result.balance);
        }
        await loadWallet();
        return true;
      } catch {
        return false;
      }
    },
    [token, setBalance, loadWallet]
  );

  const transfer = useCallback(
    (amount, note) => {
      if (balanceRef.current < amount) return false;
      setBalance(balanceRef.current - amount);
      addTransaction({ type: 'transfer', label: note || 'Transfer', amount: -amount });
      return true;
    },
    [addTransaction, setBalance]
  );

  const pay = useCallback(
    async (amount, label) => {
      if (amount <= 0) {
        addTransaction({ type: 'payment', label, amount: 0 });
        return true;
      }
      if (token && token !== 'local') {
        try {
          const result = await payFromWallet({ token, amount, label });
          if (typeof result.balance === 'number') {
            setBalance(result.balance);
          }
          await loadWallet();
          return true;
        } catch {
          return false;
        }
      }
      if (balanceRef.current < amount) return false;
      setBalance(balanceRef.current - amount);
      addTransaction({ type: 'payment', label, amount: -amount });
      return true;
    },
    [addTransaction, setBalance, token, loadWallet]
  );

  const toggleSavedCourse = useCallback((courseId) => {
    setSavedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }, []);

  const toggleWishlistBook = useCallback((bookId) => {
    setWishlistBooks((prev) => (prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]));
  }, []);

  const toggleFollowTutor = useCallback((tutorId) => {
    setFollowedTutors((prev) => (prev.includes(tutorId) ? prev.filter((id) => id !== tutorId) : [...prev, tutorId]));
  }, []);

  const enrollCourse = useCallback((courseId, price, title) => {
    const paid = pay(price, `Course: ${title}`);
    if (!paid) return false;
    setEnrolledCourses((prev) => ({
      ...prev,
      [courseId]: prev[courseId] || { progress: {}, lastLessonId: null },
    }));
    return true;
  }, [pay]);

  const grantCourseAccess = useCallback((courseId) => {
    setEnrolledCourses((prev) => ({
      ...prev,
      [courseId]: prev[courseId] || { progress: {}, lastLessonId: null },
    }));
  }, []);

  const markLessonComplete = useCallback((courseId, lessonId) => {
    setEnrolledCourses((prev) => {
      const current = prev[courseId] || { progress: {}, lastLessonId: null };
      return {
        ...prev,
        [courseId]: {
          ...current,
          progress: { ...current.progress, [lessonId]: true },
          lastLessonId: lessonId,
        },
      };
    });
  }, []);

  const setLastLesson = useCallback((courseId, lessonId) => {
    setEnrolledCourses((prev) => {
      const current = prev[courseId] || { progress: {}, lastLessonId: null };
      return {
        ...prev,
        [courseId]: { ...current, lastLessonId: lessonId },
      };
    });
  }, []);

  const createBooking = useCallback(
    async (booking) => {
      if (!token || token === 'local') return null;
      try {
        const result = await createBookingApi(token, booking);
        if (typeof result.walletBalance === 'number') {
          setBalance(result.walletBalance);
        }
        const full = result.booking;
        setBookings((prev) => [full, ...prev]);
        await loadWallet();
        return full;
      } catch {
        return null;
      }
    },
    [token, setBalance, loadWallet]
  );

  const cancelBooking = useCallback((bookingId) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
  }, []);

  const cancelBookingRemote = useCallback(
    async (bookingId) => {
      if (!token || token === 'local') {
        cancelBooking(bookingId);
        return;
      }
      try {
        await cancelBookingApi(token, bookingId);
        cancelBooking(bookingId);
      } catch {
        cancelBooking(bookingId);
      }
    },
    [token, cancelBooking]
  );

  const toggleCartBook = useCallback((bookId) => {
    setCartBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  }, []);

  const clearCart = useCallback(() => setCartBookIds([]), []);

  const completeBooking = useCallback((bookingId) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b)));
  }, []);

  const buyBook = useCallback(
    (book) => {
      const paid = pay(book.price, `Book: ${book.title}`);
      if (!paid) return false;
      setPurchasedBooks((prev) => (prev.includes(book.id) ? prev : [...prev, book.id]));
      if (book.type === 'physical' || book.type === 'bundle') {
        setPhysicalOrders((prev) => [
          {
            id: makeId('ord'),
            bookId: book.id,
            title: book.title,
            status: 'processing',
            date: new Date().toISOString().slice(0, 10),
          },
          ...prev,
        ]);
      }
      return true;
    },
    [pay]
  );

  const requestOtp = useCallback(async (phone, purpose, profile = {}) => {
    try {
      const data = await api('/users/otp/request', {
        method: 'POST',
        body: { phone, purpose, ...profile },
      });
      return { offline: false, devCode: data.devCode };
    } catch (error) {
      if (!isNetworkError(error) && error.name !== 'AbortError') throw error;
      return { offline: true };
    }
  }, []);

  const verifyOtp = useCallback(async (phone, code, profile = {}) => {
    try {
      const data = await api('/users/otp/verify', {
        method: 'POST',
        body: { phone, code },
      });
      await persistAuth(data.user, data.token);
      if (typeof data.user?.walletBalance === 'number') {
        setBalance(data.user.walletBalance);
      }
      await loadWallet();
      registerPushNotifications(data.token).catch(() => {});
    } catch (error) {
      if (!isNetworkError(error) && error.name !== 'AbortError') throw error;
      if (code !== '123456') {
        throw new Error('Wrong code. Use 123456 while offline.');
      }
      await persistAuth(
        {
          id: 'local',
          fullName: profile.fullName || 'QuickX Learner',
          email: profile.email || '',
          phone,
        },
        'local'
      );
    }
  }, [persistAuth, loadWallet, setBalance]);

  const logout = useCallback(async () => {
    await persistAuth(null, null);
  }, [persistAuth]);

  const value = useMemo(
    () => ({
      walletBalance,
      currency: initialWallet.currency,
      transactions,
      savedCourses,
      wishlistBooks,
      followedTutors,
      enrolledCourses,
      bookings,
      cartBookIds,
      purchasedBooks,
      physicalOrders,
      deposit,
      withdraw,
      transfer,
      pay,
      toggleSavedCourse,
      toggleWishlistBook,
      toggleFollowTutor,
      enrollCourse,
      grantCourseAccess,
      markLessonComplete,
      setLastLesson,
      createBooking,
      cancelBooking: cancelBookingRemote,
      completeBooking,
      buyBook,
      toggleCartBook,
      clearCart,
      syncBookings,
      avatarUri,
      setAvatarUri,
      user,
      token,
      authReady,
      requestOtp,
      verifyOtp,
      logout,
      updateUser,
      refreshSession,
      loadWallet,
      loginWithEmail,
      isEnrolled: (id) => Boolean(enrolledCourses[id]),
      isSavedCourse: (id) => savedCourses.includes(id),
      isWishlisted: (id) => wishlistBooks.includes(id),
      isFollowing: (id) => followedTutors.includes(id),
      isBookOwned: (id) => purchasedBooks.includes(id),
    }),
    [
      walletBalance,
      transactions,
      savedCourses,
      wishlistBooks,
      followedTutors,
      enrolledCourses,
      bookings,
      cartBookIds,
      purchasedBooks,
      physicalOrders,
      deposit,
      withdraw,
      transfer,
      pay,
      toggleSavedCourse,
      toggleWishlistBook,
      toggleFollowTutor,
      enrollCourse,
      grantCourseAccess,
      markLessonComplete,
      setLastLesson,
      createBooking,
      cancelBookingRemote,
      completeBooking,
      buyBook,
      toggleCartBook,
      clearCart,
      syncBookings,
      avatarUri,
      setAvatarUri,
      user,
      token,
      authReady,
      requestOtp,
      verifyOtp,
      logout,
      updateUser,
      refreshSession,
      loadWallet,
      loginWithEmail,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
