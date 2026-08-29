import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api, isNetworkError } from '@/constants/api';
import { initialTransactions, initialWallet } from '@/data/wallet';

const AVATAR_KEY = 'quickx.avatarUri';
const AUTH_KEY = 'quickx.auth';

const AppStateContext = createContext(null);

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function AppStateProvider({ children }) {
  const [walletBalance, setWalletBalance] = useState(initialWallet.balance);
  const balanceRef = useRef(initialWallet.balance);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [savedCourses, setSavedCourses] = useState(['c4']);
  const [wishlistBooks, setWishlistBooks] = useState([]);
  const [followedTutors, setFollowedTutors] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState({
    c4: { progress: { l1: true }, lastLessonId: 'l1' },
  });
  const [bookings, setBookings] = useState([
    {
      id: 'bk1',
      tutorId: 't1',
      serviceId: 's1',
      serviceName: '1-on-1 Strategy Session',
      date: '2026-08-22',
      time: '14:00',
      durationMins: 60,
      price: 150,
      status: 'upcoming',
    },
  ]);
  const [purchasedBooks, setPurchasedBooks] = useState(['b4']);
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

    AsyncStorage.getItem(AUTH_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.user) {
          setUser(parsed.user);
          setToken(parsed.token || null);
        }
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

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

  const refreshSession = useCallback(async () => {
    if (!token || token === 'local') return null;
    try {
      const data = await api('/users/validate-token', { token });
      if (data?.user) {
        await updateUser(data.user);
        return data.user;
      }
    } catch {
      // offline or expired token
    }
    return null;
  }, [token, updateUser]);

  useEffect(() => {
    if (!authReady || !token || token === 'local') return;
    refreshSession();
  }, [authReady, token, refreshSession]);

  const setAvatarUri = useCallback((uri) => {
    setAvatarUriState(uri);
    if (uri) AsyncStorage.setItem(AVATAR_KEY, uri).catch(() => {});
    else AsyncStorage.removeItem(AVATAR_KEY).catch(() => {});
  }, []);

  const setBalance = useCallback((next) => {
    balanceRef.current = next;
    setWalletBalance(next);
  }, []);

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [
      { id: makeId('tx'), date: new Date().toISOString().slice(0, 10), status: 'completed', ...tx },
      ...prev,
    ]);
  }, []);

  const deposit = useCallback(
    (amount) => {
      setBalance(balanceRef.current + amount);
      addTransaction({ type: 'deposit', label: 'Wallet deposit', amount });
      return true;
    },
    [addTransaction, setBalance]
  );

  const withdraw = useCallback(
    (amount) => {
      if (balanceRef.current < amount) return false;
      setBalance(balanceRef.current - amount);
      addTransaction({ type: 'withdraw', label: 'Wallet withdrawal', amount: -amount });
      return true;
    },
    [addTransaction, setBalance]
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
    (amount, label) => {
      if (amount <= 0) {
        addTransaction({ type: 'payment', label, amount: 0 });
        return true;
      }
      if (balanceRef.current < amount) return false;
      setBalance(balanceRef.current - amount);
      addTransaction({ type: 'payment', label, amount: -amount });
      return true;
    },
    [addTransaction, setBalance]
  );

  const toggleSavedCourse = useCallback((courseId) => {
    setSavedCourses((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
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
    (booking) => {
      const paid = pay(booking.price, `Session: ${booking.serviceName}`);
      if (!paid) return null;
      const full = { id: makeId('bk'), status: 'upcoming', ...booking };
      setBookings((prev) => [full, ...prev]);
      return full;
    },
    [pay]
  );

  const cancelBooking = useCallback((bookingId) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
  }, []);

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
  }, [persistAuth]);

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
      cancelBooking,
      completeBooking,
      buyBook,
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
      cancelBooking,
      completeBooking,
      buyBook,
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
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
