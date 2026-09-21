import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/utils/notifications';

export default function NotificationsScreen() {
  const { token } = useAppState();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchNotifications(token);
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onMarkRead = async (id) => {
    if (!token || token === 'local') return;
    try {
      await markNotificationRead(token, id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // ignore
    }
  };

  const onMarkAllRead = async () => {
    if (!token || token === 'local') return;
    try {
      await markAllNotificationsRead(token);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!token || token === 'local') {
    return (
      <Screen>
        <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Notifications</Text>
        <EmptyState
          icon="bell-o"
          title="Sign in to see notifications"
          subtitle="Community updates, course alerts, and reminders appear here once you are signed in."
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={styles.header}>
        <View>
          <Text style={typography.h2}>Notifications</Text>
          {unreadCount ? (
            <Text style={styles.unreadMeta}>{unreadCount} unread</Text>
          ) : (
            <Text style={styles.unreadMeta}>All caught up</Text>
          )}
        </View>
        {unreadCount ? (
          <PrimaryButton label="Mark all read" variant="secondary" onPress={onMarkAllRead} />
        ) : null}
      </View>

      {!items.length ? (
        <EmptyState
          icon="bell-o"
          title="No notifications yet"
          subtitle="When tutors post, reply, or go live, you will see alerts here."
        />
      ) : (
        items.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => !n.read && onMarkRead(n.id)}
            style={[styles.card, !n.read && styles.cardUnread]}>
            <Text style={styles.title}>{n.title}</Text>
            {n.body ? <Text style={typography.caption}>{n.body}</Text> : null}
            <Text style={styles.time}>{n.time}</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  unreadMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    borderColor: '#C7D9FF',
    backgroundColor: '#F6F9FF',
  },
  title: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  time: { marginTop: spacing.sm, color: colors.primary, fontWeight: '600', fontSize: 12 },
});
