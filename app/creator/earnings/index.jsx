import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import {
  fetchCreatorEarnings,
  formatShortDate,
  mapCreatorTransaction,
} from '@/utils/instructorDashboard';
import { formatPriceCedi } from '@/utils/format';

function SummaryCard({ label, value }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function CreatorEarningsScreen() {
  const { token } = useAppState();
  const { approved, syncing, refresh } = useCreatorAccess();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local' || !approved) {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setData(await fetchCreatorEarnings(token));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, token]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  const transactions = (data?.transactions || []).map(mapCreatorTransaction);

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
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <View style={styles.summaryGrid}>
                <SummaryCard label="Gross revenue" value={formatPriceCedi(data?.totalRevenue || 0)} />
                <SummaryCard label="Net earnings" value={formatPriceCedi(data?.totalEarnings || 0)} />
                <SummaryCard label="Available balance" value={formatPriceCedi(data?.availableBalance || 0)} />
              </View>

              <Text style={styles.sectionTitle}>Transactions</Text>
              {transactions.length ? (
                transactions.map((tx) => (
                  <View key={tx.id} style={styles.card}>
                    <View>
                      <Text style={styles.title}>Ref {tx.reference}</Text>
                      <Text style={styles.meta}>{formatShortDate(tx.createdAt)}</Text>
                    </View>
                    <Text style={styles.amount}>{formatPriceCedi(tx.amount)}</Text>
                  </View>
                ))
              ) : (
                <EmptyState icon="line-chart" title="No transactions yet" subtitle="Earnings from course sales will appear here." />
              )}
            </>
          )}
        </ScrollView>
      </CreatorAccessGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  summaryGrid: { gap: spacing.sm, marginBottom: spacing.xl },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  summaryLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  summaryValue: { marginTop: 8, fontSize: 24, fontWeight: '800', color: colors.text },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
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
  title: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '800', color: colors.text },
});
