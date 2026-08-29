import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCommunityLiveSessions, fetchMySubscriptions } from '@/utils/community';
import { isOpenableUrl, openExternalUrl } from '@/utils/openUrl';

export default function LiveClassesScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setSessions([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const subs = await fetchMySubscriptions(token);
      const communitySubs = subs.filter((s) => s.canAccessCommunity && s.tutor?.id);
      const batches = await Promise.all(
        communitySubs.map(async (sub) => {
          try {
            const list = await fetchCommunityLiveSessions(sub.tutor.id, token);
            return list
              .filter((s) => !s.cancelled)
              .map((s) => ({
                ...s,
                tutorName: sub.tutor.name,
                tutorId: sub.tutor.id,
              }));
          } catch {
            return [];
          }
        })
      );
      const flat = batches.flat().sort((a, b) => {
        const ta = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const tb = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return ta - tb;
      });
      setSessions(flat);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Live Classes' }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <Text style={styles.lede}>
          Live sessions from tutor communities you’re subscribed to (Premium / Diamond).
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : sessions.length ? (
          sessions.map((s) => (
            <View key={`${s.tutorId}-${s.id}`} style={styles.card}>
              <View style={styles.icon}>
                <FontAwesome name="video-camera" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.meta}>
                  {s.tutorName}
                  {s.startsAt ? ` · ${new Date(s.startsAt).toLocaleString()}` : ''}
                  {s.location && !isOpenableUrl(s.joinUrl) ? ` · ${s.location}` : ''}
                </Text>
                {s.description ? (
                  <Text style={styles.body} numberOfLines={3}>
                    {s.description}
                  </Text>
                ) : null}
                <View style={styles.actions}>
                  {isOpenableUrl(s.joinUrl) ? (
                    <Pressable style={styles.join} onPress={() => openExternalUrl(s.joinUrl)}>
                      <Text style={styles.joinText}>Join</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => router.push(`/community/${s.tutorId}`)}>
                    <Text style={styles.link}>Open community</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="video-camera"
            title="No live classes"
            subtitle="Subscribe to a tutor community to see upcoming live sessions here."
          />
        )}

        <PrimaryButton
          label="My communities"
          variant="secondary"
          onPress={() => router.push('/communities')}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1B5EF514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  body: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  join: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  joinText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
