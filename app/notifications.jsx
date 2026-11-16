import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Button, Card, Divider, Icon, IconBox, Row, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/utils/notifications';
import { appRouteFor } from '@/utils/pushNotifications';

const ICONS = {
  signal: 'activity',
  withdrawal: 'credit-card',
  direct_message: 'message-circle',
  question_answered: 'help-circle',
  question_asked: 'help-circle',
  live_reminder: 'video',
  resource_upload: 'folder',
  announcement: 'volume-2',
  new_course: 'play-circle',
  comment_reply: 'message-square',
  mention: 'at-sign',
  post_like: 'heart',
};

export default function NotificationsScreen() {
  const { token, isSignedIn, requireSignIn } = useAppState();
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications(token);
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      setItems((prev) => prev || []);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const open = (n) => {
    if (!n.read) {
      markNotificationRead(token, n.id).catch(() => {});
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (n.webPath) router.push(appRouteFor(n.webPath));
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead(token);
      setItems((list) => list.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      // Try again next time.
    }
  };

  if (!isSignedIn) {
    return (
      <Page>
        <EmptyState icon="bell" title="Sign in to see your notifications" subtitle="Signal alerts, replies and payouts show up here.">
          <Button label="Sign in" onPress={() => requireSignIn()} />
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}>
      <View style={{ gap: 14 }}>
        {unread ? (
          <Row justify="space-between">
            <Txt size={13.5} color={t.fgMuted}>
              {unread} unread
            </Txt>
            <Button variant="ghost" size="sm" icon="check" label="Mark all as read" onPress={readAll} />
          </Row>
        ) : null}
        {items === null ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={72} radius={16} />
            <Skeleton height={72} radius={16} />
            <Skeleton height={72} radius={16} />
          </View>
        ) : null}
        {items && !items.length ? <EmptyState icon="bell-o" title="You are all caught up" subtitle="New signals, replies and payouts will show up here." /> : null}
        {items?.length ? (
          <Card padded={false}>
            {items.map((n, i) => (
              <View key={n.id}>
                {i ? <Divider /> : null}
                <PressableScale haptic="select" scaleTo={0.99} onPress={() => open(n)} style={{ padding: 14 }}>
                  <Row gap={12} align="flex-start">
                    <IconBox name={ICONS[n.type] || 'bell'} size={38} iconSize={17} tone={n.read ? 'neutral' : 'brand'} />
                    <View style={{ flex: 1 }}>
                      <Row gap={8} justify="space-between" align="flex-start">
                        <Txt size={14.5} weight={n.read ? 'medium' : 'bold'} style={{ flex: 1 }}>
                          {n.title}
                        </Txt>
                        <Txt size={11.5} color={t.fgSubtle}>
                          {n.time}
                        </Txt>
                      </Row>
                      {n.body ? (
                        <Txt size={13.5} color={n.read ? t.fgSubtle : t.fgMuted} style={{ marginTop: 2, lineHeight: 19 }} numberOfLines={3}>
                          {n.body}
                        </Txt>
                      ) : null}
                    </View>
                    {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.brand400, marginTop: 6 }} /> : n.webPath ? <Icon name="chevron-right" size={16} color={t.fgSubtle} style={{ marginTop: 2 }} /> : null}
                  </Row>
                </PressableScale>
              </View>
            ))}
          </Card>
        ) : null}
      </View>
    </Page>
  );
}
