import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PieCard } from '@/components/ptrading/PieCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { SkeletonList } from '@/components/ui/Skeleton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatCurrency } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { fetchMySlices, fetchPies, PIE_MARKETS, PIE_STATUSES, pieId } from '@/utils/ptrading';

const VIEWS = [
  { id: 'explore', label: 'Explore pies' },
  { id: 'mine', label: 'My slices' },
];

function Chip({ label, active, onPress, dark }) {
  return (
    <Pressable
      onPress={() => {
        if (!active) haptics.select();
        onPress();
      }}
      style={[styles.chip, dark && styles.chipDark, active && (dark ? styles.chipDarkActive : styles.chipActive)]}>
      <Text
        style={[
          styles.chipText,
          dark && styles.chipTextDark,
          active && (dark ? styles.chipTextDarkActive : styles.chipTextActive),
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function PieTradingScreen() {
  const router = useRouter();
  const { token, walletBalance } = useAppState();
  const [view, setView] = useState('explore');
  const [status, setStatus] = useState('funding');
  const [market, setMarket] = useState('all');
  const [pies, setPies] = useState([]);
  const [stats, setStats] = useState(null);
  const [mine, setMine] = useState({ deposits: [], createdPies: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setError('');
    try {
      if (view === 'explore') {
        const data = await fetchPies({ status, market, token });
        if (id !== requestId.current) return;
        setPies(data.pies);
        if (data.stats) setStats(data.stats);
      } else {
        const data = await fetchMySlices(token);
        if (id !== requestId.current) return;
        setMine(data);
      }
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message || 'Could not load trading pies.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [view, status, market, token]);

  // Reload on focus so balances and pools are fresh after depositing or creating a pie.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const switchTo = (fn) => {
    setLoading(true);
    fn();
  };

  const myTotals = useMemo(() => {
    const active = mine.deposits.filter((d) => d.status === 'active');
    const invested = active.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const pnl = mine.deposits.reduce((sum, d) => sum + (Number(d.pnlAmount) || 0), 0);
    return { invested, pnl, activeCount: active.length };
  }, [mine.deposits]);

  const openPie = (pie) => router.push(`/ptrading/${pieId(pie)}`);

  const listData = view === 'explore' ? pies : mine.deposits;

  const renderItem = ({ item }) => {
    if (view === 'explore') return <PieCard pie={item} onPress={() => openPie(item)} />;
    const pie = item.pieId;
    const pnl = Number(item.pnlAmount) || 0;
    return (
      <PieCard
        pie={pie}
        onPress={() => openPie(pie)}
        footer={
          <View style={styles.stake}>
            <View>
              <Text style={styles.stakeLabel}>Your stake</Text>
              <Text style={styles.stakeValue}>{formatCurrency(item.amount)}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.stakeLabel}>Slice</Text>
              <Text style={styles.stakeValue}>{Number(item.slicePercentage || 0).toFixed(1)}%</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stakeLabel}>{item.status === 'active' ? 'Status' : 'P&L'}</Text>
              {item.status === 'active' ? (
                <Text style={[styles.stakeValue, { color: colors.primary }]}>Active</Text>
              ) : (
                <Text style={[styles.stakeValue, { color: pnl >= 0 ? colors.success : colors.danger }]}>
                  {item.status === 'refunded' ? 'Refunded' : `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`}
                </Text>
              )}
            </View>
          </View>
        }
      />
    );
  };

  const header =
    view === 'explore' ? (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PIE_STATUSES.map((s) => (
            <Chip key={s.id} label={s.label} active={status === s.id} onPress={() => switchTo(() => setStatus(s.id))} />
          ))}
          <View style={styles.chipDivider} />
          {PIE_MARKETS.map((m) => (
            <Chip key={m.id} label={m.label} active={market === m.id} onPress={() => switchTo(() => setMarket(m.id))} />
          ))}
        </ScrollView>
      </View>
    ) : (
      <View>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(myTotals.invested)}</Text>
            <Text style={styles.summaryLabel}>In active pies</Text>
          </View>
          <View style={styles.summaryLine} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: myTotals.pnl >= 0 ? colors.success : colors.danger }]}>
              {myTotals.pnl >= 0 ? '+' : ''}
              {formatCurrency(myTotals.pnl)}
            </Text>
            <Text style={styles.summaryLabel}>Realised P&L</Text>
          </View>
          <View style={styles.summaryLine} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(walletBalance)}</Text>
            <Text style={styles.summaryLabel}>Wallet</Text>
          </View>
        </View>

        {mine.createdPies.length ? (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={styles.sectionTitle}>Pies you run</Text>
            {mine.createdPies.map((pie) => (
              <PressableScale key={pieId(pie)} style={styles.ownedRow} onPress={() => openPie(pie)}>
                <View style={styles.ownedPair}>
                  <Text style={styles.ownedPairText}>{pie.pair}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownedTitle} numberOfLines={1}>
                    {pie.title}
                  </Text>
                  <Text style={styles.ownedMeta}>
                    {pie.status} · {formatCurrency(pie.raisedAmount)} raised · {pie.participantCount || 0} backers
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color={colors.muted} />
              </PressableScale>
            ))}
          </View>
        ) : null}

        {mine.deposits.length ? <Text style={styles.sectionTitle}>Your slices</Text> : null}
      </View>
    );

  const empty = loading ? (
    <SkeletonList count={3} imageHeight={0} />
  ) : error ? (
    <View style={styles.empty}>
      <FontAwesome name="wifi" size={30} color={colors.muted} />
      <Text style={styles.emptyTitle}>Couldn’t load pies</Text>
      <Text style={styles.emptySub}>{error}</Text>
      <Pressable style={styles.retry} onPress={() => switchTo(load)}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <FontAwesome name="pie-chart" size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{view === 'explore' ? 'No pies here yet' : 'You haven’t backed a pie yet'}</Text>
      <Text style={styles.emptySub}>
        {view === 'explore'
          ? 'Try another filter, or launch your own trading pie.'
          : 'Explore open pools and back a trader with as little as GH₵10 from your wallet.'}
      </Text>
      {view === 'mine' ? (
        <Pressable style={styles.retry} onPress={() => switchTo(() => setView('explore'))}>
          <Text style={styles.retryText}>Explore pies</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#07152F', '#0C2340', '#1246C4']} locations={[0, 0.6, 1]} style={styles.heroBg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back">
            <FontAwesome name="arrow-left" size={16} color={colors.white} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.kicker}>POOLED TRADING</Text>
            <Text style={styles.headerTitle}>Pie Trading</Text>
          </View>
          <PressableScale
            style={styles.launchBtn}
            haptic="press"
            onPress={() => router.push('/ptrading/create')}
            accessibilityLabel="Launch a trading pie">
            <FontAwesome name="plus" size={12} color={colors.navy} />
            <Text style={styles.launchText}>Launch</Text>
          </PressableScale>
        </View>

        <Text style={styles.lede}>
          Back verified traders with pooled capital. Wins are paid straight to your QuickX wallet by slice size.
        </Text>

        {stats ? (
          <View style={styles.stats}>
            <Stat value={String(stats.totalPools || 0)} label="Pools" />
            <Stat value={formatCurrency(stats.totalCapitalRaised || 0)} label="Raised" />
            <Stat value={formatCurrency(stats.totalDistributed || 0)} label="Paid out" />
            <Stat value={`${stats.winRate ?? 0}%`} label="Win rate" />
          </View>
        ) : null}

        <View style={styles.viewSwitch}>
          {VIEWS.map((v) => (
            <Chip key={v.id} dark label={v.label} active={view === v.id} onPress={() => switchTo(() => setView(v.id))} />
          ))}
        </View>

        <View style={styles.sheet}>
          <FlatList
            data={loading || error ? [] : listData}
            keyExtractor={(item) => String(item._id || item.id)}
            renderItem={renderItem}
            ListHeaderComponent={header}
            ListEmptyComponent={empty}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={colors.primary}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
              />
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  heroBg: { ...StyleSheet.absoluteFillObject, height: 360 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
  },
  launchText: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  lede: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statValue: { color: colors.white, fontWeight: '800', fontSize: 14 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  viewSwitch: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginVertical: spacing.lg },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  list: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
  chipRow: { gap: spacing.sm, paddingBottom: spacing.lg, alignItems: 'center' },
  chipDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  chipDark: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'transparent' },
  chipDarkActive: { backgroundColor: colors.white },
  chipTextDark: { color: 'rgba(255,255,255,0.85)' },
  chipTextDarkActive: { color: colors.navy },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  summaryLine: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  ownedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  ownedPair: { backgroundColor: colors.navy, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 6 },
  ownedPairText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  ownedTitle: { fontWeight: '700', color: colors.text },
  ownedMeta: { fontSize: 12, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  stake: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EEF4FF',
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  stakeLabel: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  stakeValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(27,94,245,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  retry: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  retryText: { color: colors.white, fontWeight: '700' },
});
