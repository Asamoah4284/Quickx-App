import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FundingBar, StatusPill } from '@/components/ptrading/PieCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatCurrency } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import {
  cancelPie,
  deadlineLabel,
  depositToPie,
  fetchPie,
  isFundingOpen,
  postPieUpdate,
  RISK_COLORS,
  settlePie,
  startPieTrading,
} from '@/utils/ptrading';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.inputMulti]} {...props} />
    </View>
  );
}

export default function PieDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, walletBalance, loadWallet } = useAppState();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null); // 'deposit' | 'update' | 'settle'
  const [busy, setBusy] = useState(false);

  const [amount, setAmount] = useState('');
  const [update, setUpdate] = useState({ title: '', notes: '', entryPrice: '', stopLoss: '', takeProfit: '' });
  const [settle, setSettle] = useState({ outcome: 'win', pnl: '', notes: '' });

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await fetchPie(id, token));
    } catch (err) {
      setError(err.message || 'Could not load this pie.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const pie = data?.pie;
  const userDeposit = data?.userDeposit;
  const isOwner = data?.isOwner;
  const canDeposit = pie && isFundingOpen(pie) && !isOwner;

  const updates = useMemo(
    () => [...(pie?.tradeUpdates || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [pie?.tradeUpdates]
  );

  const amountValue = Number(amount) || 0;
  const alreadyIn = Number(userDeposit?.amount) || 0;
  const maxAllowed = Math.max(0, (Number(pie?.maxDeposit) || Infinity) - alreadyIn);
  const projected = pie
    ? amountValue * ((Number(pie.targetRoiPercent) || 0) / 100) * (1 - (Number(pie.ownerFeePercent) || 0) / 100)
    : 0;
  const depositError = !amountValue
    ? ''
    : amountValue < (pie?.minDeposit || 1)
      ? `Minimum deposit is ${formatCurrency(pie.minDeposit)}.`
      : amountValue > maxAllowed
        ? `You can add up to ${formatCurrency(maxAllowed)} more to this pie.`
        : amountValue > walletBalance
          ? 'Not enough in your wallet.'
          : '';

  const run = async (fn, successTitle) => {
    setBusy(true);
    try {
      const res = await fn();
      haptics.success();
      setSheet(null);
      await Promise.all([load(), loadWallet()]);
      if (successTitle) Alert.alert(successTitle, res?.message || '');
      return res;
    } catch (err) {
      haptics.error();
      Alert.alert('Something went wrong', err.message || 'Please try again.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onDeposit = () => {
    if (!amountValue || depositError) return;
    run(() => depositToPie(token, id, amountValue), 'You’re in!').then((res) => {
      if (res) setAmount('');
    });
  };

  const onStart = () =>
    Alert.alert(
      'Start trading?',
      'Deposits close and the pool moves into market execution. Backers can no longer join.',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Start trading', onPress: () => run(() => startPieTrading(token, id), 'Trading started') },
      ]
    );

  const onCancel = () =>
    Alert.alert('Cancel this pie?', 'Every backer gets a 100% refund to their QuickX wallet. This can’t be undone.', [
      { text: 'Keep pie', style: 'cancel' },
      {
        text: 'Cancel & refund',
        style: 'destructive',
        onPress: () => run(() => cancelPie(token, id, 'Cancelled by owner from the mobile app'), 'Pie cancelled'),
      },
    ]);

  const onPostUpdate = () => {
    if (!update.title.trim()) {
      Alert.alert('Add a title', 'Give this update a short headline.');
      return;
    }
    run(() => postPieUpdate(token, id, update), 'Update posted').then((res) => {
      if (res) setUpdate({ title: '', notes: '', entryPrice: '', stopLoss: '', takeProfit: '' });
    });
  };

  const onSettle = () => {
    const raw = Math.abs(Number(settle.pnl));
    if (settle.outcome !== 'even' && (!raw || Number.isNaN(raw))) {
      Alert.alert('Enter the result', 'Add the final percentage gain or loss for the pool.');
      return;
    }
    const pnl = settle.outcome === 'even' ? 0 : settle.outcome === 'loss' ? -raw : raw;
    const label = settle.outcome === 'even' ? 'break-even' : `${settle.outcome.toUpperCase()} (${pnl > 0 ? '+' : ''}${pnl}%)`;
    Alert.alert('Settle pie?', `Settle as ${label}. Wallets are credited immediately and this can’t be undone.`, [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Settle',
        style: 'destructive',
        onPress: () =>
          run(
            () => settlePie(token, id, { outcome: settle.outcome, finalPnlPercent: pnl, settlementNotes: settle.notes }),
            'Pie settled'
          ),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!pie) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <FontAwesome name="pie-chart" size={32} color={colors.muted} />
        <Text style={styles.emptyTitle}>{error || 'Pie not found'}</Text>
        <PrimaryButton label="Go back" variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </SafeAreaView>
    );
  }

  const ownerActions =
    isOwner && (pie.status === 'funding' || pie.status === 'trading') ? (
      <View style={styles.ownerRow}>
        {pie.status === 'funding' ? (
          <PrimaryButton
            label="Start trading"
            icon="play"
            onPress={onStart}
            disabled={busy || !(pie.raisedAmount > 0)}
            style={{ flex: 1 }}
          />
        ) : (
          <>
            <PrimaryButton label="Post update" icon="pencil" variant="secondary" onPress={() => setSheet('update')} style={{ flex: 1 }} />
            <PrimaryButton label="Settle" icon="flag-checkered" onPress={() => setSheet('settle')} style={{ flex: 1 }} />
          </>
        )}
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={busy} accessibilityLabel="Cancel pie">
          <FontAwesome name="ban" size={18} color={colors.danger} />
        </Pressable>
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.white}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <LinearGradient colors={['#07152F', '#0C2340', '#1246C4']} style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.heroTop}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back">
              <FontAwesome name="arrow-left" size={16} color={colors.white} />
            </Pressable>
            <StatusPill status={pie.status} />
          </View>

          <View style={styles.pairRow}>
            <View style={styles.pairBadge}>
              <Text style={styles.pairText}>{pie.pair}</Text>
            </View>
            <Text style={styles.market}>{pie.market}</Text>
          </View>
          <Text style={styles.title}>{pie.title}</Text>
          <Text style={styles.owner}>
            Run by <Text style={{ color: colors.white, fontWeight: '700' }}>{pie.ownerId?.fullName || 'QuickX trader'}</Text>
            {isOwner ? ' (you)' : ''}
          </Text>

          <View style={{ marginTop: spacing.lg }}>
            <FundingBar pie={pie} dark />
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaText}>
              <FontAwesome name="users" size={11} /> {pie.participantCount || 0} backers
            </Text>
            <Text style={styles.heroMetaText}>
              <FontAwesome name="clock-o" size={11} />{' '}
              {pie.status === 'funding' ? deadlineLabel(pie) : pie.tradingStartedAt ? `Started ${formatDate(pie.tradingStartedAt)}` : ''}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {userDeposit ? (
            <View style={styles.sliceCard}>
              <Text style={styles.sliceLabel}>Your slice</Text>
              <View style={styles.sliceRow}>
                <View>
                  <Text style={styles.sliceValue}>{formatCurrency(userDeposit.amount)}</Text>
                  <Text style={styles.sliceHint}>deposited</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sliceValue}>{Number(userDeposit.slicePercentage || 0).toFixed(2)}%</Text>
                  <Text style={styles.sliceHint}>of the pool</Text>
                </View>
              </View>
              {userDeposit.status !== 'active' ? (
                <Text style={styles.slicePayout}>
                  {userDeposit.status === 'refunded' ? 'Refunded' : 'Paid out'} {formatCurrency(userDeposit.payoutAmount)} to your wallet
                  {userDeposit.status === 'settled'
                    ? ` (${userDeposit.pnlAmount >= 0 ? '+' : ''}${formatCurrency(userDeposit.pnlAmount)})`
                    : ''}
                </Text>
              ) : null}
            </View>
          ) : null}

          {pie.status === 'settled' ? (
            <View style={[styles.card, styles.resultCard]}>
              <FontAwesome
                name={pie.outcome === 'win' ? 'trophy' : pie.outcome === 'loss' ? 'arrow-down' : 'minus-circle'}
                size={22}
                color={pie.outcome === 'win' ? colors.success : pie.outcome === 'loss' ? colors.danger : colors.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {pie.outcome === 'win' ? 'Closed in profit' : pie.outcome === 'loss' ? 'Closed at a loss' : 'Closed at break-even'}{' '}
                  ({Number(pie.finalPnlPercent) > 0 ? '+' : ''}
                  {pie.finalPnlPercent ?? 0}%)
                </Text>
                <Text style={styles.muted}>
                  {formatCurrency(pie.totalDistributedAmount)} returned to backers · settled {formatDate(pie.settledAt)}
                </Text>
                {pie.settlementNotes ? <Text style={[styles.muted, { marginTop: 6 }]}>{pie.settlementNotes}</Text> : null}
              </View>
            </View>
          ) : null}

          <View style={styles.grid}>
            <Term label="Target ROI" value={`${pie.targetRoiPercent}%`} color={colors.success} />
            <Term label="Max loss" value={`${pie.maxLossPercent}%`} color={colors.danger} />
            <Term label="Trader fee" value={`${pie.ownerFeePercent}% of profit`} />
            <Term label="Risk" value={pie.riskLevel} color={RISK_COLORS[pie.riskLevel]} />
            <Term label="Min deposit" value={formatCurrency(pie.minDeposit)} />
            <Term label="Max deposit" value={formatCurrency(pie.maxDeposit)} />
          </View>

          {pie.description ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Strategy</Text>
              <Text style={styles.bodyText}>{pie.description}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>How payouts work</Text>
            <Text style={styles.bodyText}>
              If the pie wins, you get your deposit back plus your slice of the profit after the trader’s {pie.ownerFeePercent}% fee. If it
              loses, the remaining pool is shared by slice and the trader earns nothing. Cancelled pies refund 100%.
            </Text>
          </View>

          <Text style={styles.section}>Trade journal</Text>
          {updates.length ? (
            updates.map((u, index) => (
              <View key={u._id || index} style={styles.update}>
                <View style={styles.timeline}>
                  <View style={styles.dot} />
                  {index < updates.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                  <Text style={styles.updateTitle}>{u.title}</Text>
                  <Text style={styles.updateDate}>{formatDate(u.createdAt)}</Text>
                  {u.notes ? <Text style={styles.bodyText}>{u.notes}</Text> : null}
                  {u.entryPrice || u.stopLoss || u.takeProfit ? (
                    <View style={styles.levels}>
                      {u.entryPrice ? <Level label="Entry" value={u.entryPrice} /> : null}
                      {u.stopLoss ? <Level label="SL" value={u.stopLoss} color={colors.danger} /> : null}
                      {u.takeProfit ? <Level label="TP" value={u.takeProfit} color={colors.success} /> : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No trade updates yet. The trader posts entries, stops and targets here once trading starts.</Text>
          )}

          <Text style={styles.section}>Backers</Text>
          {data.deposits.length ? (
            <View style={styles.card}>
              {data.deposits.slice(0, 15).map((d, index) => (
                <View key={d._id || index} style={[styles.backer, index > 0 && styles.backerBorder]}>
                  <View style={styles.backerAvatar}>
                    <Text style={styles.backerLetter}>{(d.userId?.fullName || 'Q').charAt(0)}</Text>
                  </View>
                  <Text style={styles.backerName} numberOfLines={1}>
                    {d.userId?.fullName || 'QuickX member'}
                  </Text>
                  <Text style={styles.backerAmount}>{formatCurrency(d.amount)}</Text>
                  <Text style={styles.backerPct}>{Number(d.slicePercentage || 0).toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No backers yet — be the first.</Text>
          )}
        </View>
      </ScrollView>

      {canDeposit || ownerActions ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {ownerActions || (
            <PrimaryButton
              label={userDeposit ? 'Add to my slice' : 'Back this pie'}
              icon="pie-chart"
              onPress={() => {
                if (!token) return router.push('/(auth)/login');
                setAmount(String(pie.minDeposit || 10));
                setSheet('deposit');
              }}
            />
          )}
        </View>
      ) : null}

      <BottomSheet
        visible={sheet === 'deposit'}
        onClose={() => setSheet(null)}
        title="Back this pie"
        subtitle={`Paid from your QuickX wallet · balance ${formatCurrency(walletBalance)}`}>
        <Field label="Amount (GH₵)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" autoFocus />
        <View style={styles.quickRow}>
          {[pie.minDeposit, 50, 100, 500]
            .filter((v, i, arr) => v && arr.indexOf(v) === i && v <= maxAllowed)
            .map((v) => (
              <Pressable key={v} style={styles.quick} onPress={() => setAmount(String(v))}>
                <Text style={styles.quickText}>{formatCurrency(v)}</Text>
              </Pressable>
            ))}
        </View>
        {depositError ? <Text style={styles.error}>{depositError}</Text> : null}
        {amountValue && !depositError ? (
          <View style={styles.projection}>
            <FontAwesome name="line-chart" size={14} color={colors.success} />
            <Text style={styles.projectionText}>
              If the pie hits its {pie.targetRoiPercent}% target you’d earn about{' '}
              <Text style={{ fontWeight: '800' }}>{formatCurrency(projected)}</Text> on top of your deposit.
            </Text>
          </View>
        ) : null}
        {amountValue > walletBalance ? (
          <PrimaryButton
            label="Top up wallet"
            icon="plus"
            variant="secondary"
            onPress={() => {
              setSheet(null);
              router.push('/wallet');
            }}
          />
        ) : (
          <PrimaryButton
            label={amountValue ? `Deposit ${formatCurrency(amountValue)}` : 'Deposit'}
            onPress={onDeposit}
            loading={busy}
            disabled={!amountValue || Boolean(depositError)}
          />
        )}
        <Text style={styles.disclaimer}>Trading carries risk. Only deposit what you can afford to lose.</Text>
      </BottomSheet>

      <BottomSheet visible={sheet === 'update'} onClose={() => setSheet(null)} title="Post a trade update" subtitle="Backers see this in the trade journal.">
        <Field label="Headline" value={update.title} onChangeText={(v) => setUpdate((s) => ({ ...s, title: v }))} placeholder="e.g. Long entry filled" />
        <Field
          label="Notes"
          value={update.notes}
          onChangeText={(v) => setUpdate((s) => ({ ...s, notes: v }))}
          placeholder="What happened and why"
          multiline
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Field label="Entry" value={update.entryPrice} onChangeText={(v) => setUpdate((s) => ({ ...s, entryPrice: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Stop loss" value={update.stopLoss} onChangeText={(v) => setUpdate((s) => ({ ...s, stopLoss: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Take profit" value={update.takeProfit} onChangeText={(v) => setUpdate((s) => ({ ...s, takeProfit: v }))} />
          </View>
        </View>
        <PrimaryButton label="Post update" onPress={onPostUpdate} loading={busy} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'settle'}
        onClose={() => setSheet(null)}
        title="Settle this pie"
        subtitle={`Pool of ${formatCurrency(pie.raisedAmount)} · wallets are credited instantly`}>
        <Text style={styles.fieldLabel}>Outcome</Text>
        <View style={styles.segment}>
          {[
            { id: 'win', label: 'Win', color: colors.success },
            { id: 'loss', label: 'Loss', color: colors.danger },
            { id: 'even', label: 'Break-even', color: colors.muted },
          ].map((o) => {
            const active = settle.outcome === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => {
                  haptics.select();
                  setSettle((s) => ({ ...s, outcome: o.id }));
                }}
                style={[styles.segmentItem, active && { backgroundColor: o.color }]}>
                <Text style={[styles.segmentText, active && { color: colors.white }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {settle.outcome !== 'even' ? (
          <Field
            label={settle.outcome === 'win' ? 'Final profit (%)' : 'Final loss (%)'}
            value={settle.pnl}
            onChangeText={(v) => setSettle((s) => ({ ...s, pnl: v.replace(/[^\d.]/g, '') }))}
            keyboardType="decimal-pad"
            placeholder="e.g. 12.5"
          />
        ) : null}
        <Field
          label="Notes for backers (optional)"
          value={settle.notes}
          onChangeText={(v) => setSettle((s) => ({ ...s, notes: v }))}
          multiline
        />
        <PrimaryButton label="Settle pie" onPress={onSettle} loading={busy} variant={settle.outcome === 'loss' ? 'danger' : 'primary'} />
      </BottomSheet>
    </View>
  );
}

function Term({ label, value, color }) {
  return (
    <View style={styles.term}>
      <Text style={styles.termLabel}>{label}</Text>
      <Text style={[styles.termValue, color && { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Level({ label, value, color = colors.text }) {
  return (
    <View style={styles.level}>
      <Text style={styles.levelLabel}>{label}</Text>
      <Text style={[styles.levelValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl + spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pairBadge: { backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.sm },
  pairText: { color: colors.navy, fontWeight: '900', fontSize: 13, letterSpacing: 0.6 },
  market: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'capitalize' },
  title: { color: colors.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: spacing.md, lineHeight: 32 },
  owner: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 13 },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  heroMetaText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  body: {
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  sliceCard: { backgroundColor: colors.navy, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  sliceLabel: { color: colors.gold, fontWeight: '800', fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  sliceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  sliceValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  sliceHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  slicePayout: { color: '#9FE3B8', marginTop: spacing.md, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  resultCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 6 },
  bodyText: { color: colors.muted, lineHeight: 20, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  term: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  termLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  termValue: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 },
  section: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  update: { flexDirection: 'row', gap: spacing.md },
  timeline: { alignItems: 'center', width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 4, borderWidth: 2, borderColor: '#D6E2FF' },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  updateTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  updateDate: { fontSize: 11, color: colors.muted, marginBottom: 4, marginTop: 2 },
  levels: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  level: { backgroundColor: colors.card, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6 },
  levelLabel: { fontSize: 10, fontWeight: '800', color: colors.muted },
  levelValue: { fontSize: 13, fontWeight: '800' },
  backer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  backerBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  backerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  backerLetter: { color: colors.primary, fontWeight: '800' },
  backerName: { flex: 1, color: colors.text, fontWeight: '600' },
  backerAmount: { fontWeight: '800', color: colors.text },
  backerPct: { width: 48, textAlign: 'right', color: colors.muted, fontWeight: '700', fontSize: 12 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  ownerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  cancelBtn: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#F6C9CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  quick: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.full, backgroundColor: '#EEF4FF' },
  quickText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.md },
  projection: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#EAF8EF',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  projectionText: { flex: 1, color: '#13803C', fontSize: 13, lineHeight: 19 },
  disclaimer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: spacing.md },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.md, padding: 4, marginBottom: spacing.md },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.sm },
  segmentText: { fontWeight: '700', color: colors.text },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
});
