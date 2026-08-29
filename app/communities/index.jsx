import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { fetchMySubscriptions, SUBSCRIPTION_PLANS } from '@/utils/community';

export default function CommunitiesScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setRows([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const list = await fetchMySubscriptions(token);
      setRows(list.filter((s) => s.tutor));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const withCommunity = rows.filter((s) => s.canAccessCommunity);
  const videoOnly = rows.filter((s) => !s.canAccessCommunity);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Communities' }} />
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
          Premium and Diamond subscriptions unlock each tutor’s community feed, Q&A, live sessions, and resources.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : withCommunity.length ? (
          <>
            <Text style={styles.section}>Your communities</Text>
            {withCommunity.map((sub) => {
              const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub.planId);
              return (
                <Pressable
                  key={sub.id}
                  style={styles.card}
                  onPress={() => router.push(`/community/${sub.tutor.id}`)}>
                  {sub.tutor.avatar ? (
                    <Image source={{ uri: sub.tutor.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.letter}>{sub.tutor.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{sub.tutor.name}</Text>
                    <Text style={styles.meta}>
                      {plan?.label || sub.planId}
                      {sub.endsAt ? ` · until ${new Date(sub.endsAt).toLocaleDateString()}` : ''}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color={colors.muted} />
                </Pressable>
              );
            })}
          </>
        ) : (
          <EmptyState
            icon="comments"
            title="No communities yet"
            subtitle="Subscribe to a tutor on Premium or Diamond to join their community."
          />
        )}

        {videoOnly.length ? (
          <>
            <Text style={styles.section}>Video-only plans</Text>
            <Text style={styles.hint}>Upgrade these to Premium to unlock community access.</Text>
            {videoOnly.map((sub) => (
              <Pressable
                key={sub.id}
                style={styles.cardMuted}
                onPress={() => router.push(`/subscribe/${sub.tutor.id}`)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{sub.tutor.name}</Text>
                  <Text style={styles.meta}>Basic · upgrade for community</Text>
                </View>
                <Text style={styles.upgrade}>Upgrade</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <PrimaryButton
          label="Browse tutors"
          variant="secondary"
          onPress={() => router.push('/tutors')}
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
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  hint: { color: colors.muted, fontSize: 12, marginBottom: spacing.md, marginTop: -4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#EEF2F8',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  letter: { color: colors.white, fontWeight: '800', fontSize: 18 },
  name: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  upgrade: { color: colors.primary, fontWeight: '800', fontSize: 12 },
});
