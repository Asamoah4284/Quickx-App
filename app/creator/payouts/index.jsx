import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import { fetchCreatorPayouts, formatShortDate, mapCreatorPayout } from '@/utils/instructorDashboard';
import { formatPriceCedi } from '@/utils/format';

function payoutTone(status) {
  if (status === 'paid') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

export default function CreatorPayoutsScreen() {
  const { token } = useAppState();
  const { approved, syncing, refresh } = useCreatorAccess();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local' || !approved) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchCreatorPayouts(token);
      setItems(data.map(mapCreatorPayout));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, token]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <CreatorAccessGate approved={approved} syncing={syncing}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refresh().finally(() => load());
              }}
            />
          }>
          <Text style={styles.lede}>Track payout requests, processing states, and completed transfers.</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View>
                  <Text style={styles.title}>{formatPriceCedi(item.amount)}</Text>
                  <Text style={styles.meta}>Requested {formatShortDate(item.requestedAt)}</Text>
                </View>
                <Badge label={item.status} tone={payoutTone(item.status)} />
              </View>
            ))
          ) : (
            <EmptyState icon="credit-card" title="No payouts yet" subtitle="Payout history will appear here once you request withdrawals." />
          )}
        </ScrollView>
      </CreatorAccessGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
