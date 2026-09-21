import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { detectMomoNetwork, getMomoNetworks } from '@/utils/moolre';
import { fetchReferrals } from '@/utils/referrals';
import {
  fetchMomoDetails,
  fetchWithdrawalHistory,
  requestReferralWithdrawal,
  saveMomoDetails,
} from '@/utils/withdrawals';
import { formatPriceCedi } from '@/utils/format';

const NETWORKS = getMomoNetworks();

export default function ReferralsScreen() {
  const { token } = useAppState();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [momoNumber, setMomoNumber] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [ref, momo, hist] = await Promise.all([
        fetchReferrals(token),
        fetchMomoDetails(token).catch(() => null),
        fetchWithdrawalHistory(token).catch(() => ({ withdrawalRequests: [] })),
      ]);
      setData(ref);
      setHistory(hist.withdrawalRequests || []);
      if (momo?.momoDetails?.momoNumber) {
        setMomoNumber(momo.momoDetails.momoNumber);
        setNetwork(momo.momoDetails.network || detectMomoNetwork(momo.momoDetails.momoNumber));
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onWithdraw = async () => {
    if ((data?.referralEarnings || 0) < 20) {
      Alert.alert('Minimum ₵20', 'You need at least ₵20 in referral earnings to withdraw.');
      return;
    }
    if (!momoNumber || momoNumber.replace(/\D/g, '').length < 10) {
      Alert.alert('MoMo required', 'Enter a valid Mobile Money number.');
      return;
    }
    setWithdrawing(true);
    try {
      await saveMomoDetails(token, { momoNumber, network });
      await requestReferralWithdrawal(token);
      Alert.alert('Withdrawal requested', 'Your referral earnings withdrawal is being processed.');
      await load();
    } catch (err) {
      Alert.alert('Withdrawal failed', err.message || 'Try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (!token || token === 'local') {
    return (
      <Screen>
        <Text style={typography.h2}>Referrals</Text>
        <EmptyState icon="gift" title="Sign in to view referrals" subtitle="Share your code and earn when friends purchase." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Text style={typography.h2}>Referrals</Text>
        <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
          Share your code at checkout. You earn 5% when referred users purchase.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : data ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Your referral code</Text>
              <Text style={styles.code}>{data.referralCode || '—'}</Text>
              <Text style={styles.earnings}>Available: {formatPriceCedi(data.referralEarnings || 0)}</Text>
              <Text style={styles.hint}>Minimum withdrawal: ₵20</Text>
            </View>

            <Text style={styles.section}>Withdraw to MoMo</Text>
            <AuthField icon="phone" value={momoNumber} onChangeText={setMomoNumber} placeholder="0XX XXX XXXX" keyboardType="phone-pad" />
            <View style={styles.networkRow}>
              {NETWORKS.map((item) => (
                <PrimaryButton
                  key={item.id}
                  label={item.label}
                  variant={network === item.id ? 'primary' : 'secondary'}
                  onPress={() => setNetwork(item.id)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
            <PrimaryButton
              label={withdrawing ? 'Processing…' : 'Withdraw earnings'}
              onPress={onWithdraw}
              disabled={withdrawing || (data.referralEarnings || 0) < 20}
            />

            <Text style={styles.section}>Referral history</Text>
            {(data.referralHistory || []).length ? (
              data.referralHistory.map((item, index) => (
                <View key={String(item._id || index)} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.referredUser?.fullName || 'User'}</Text>
                    <Text style={styles.rowMeta}>{item.courseId?.title || 'Purchase'}</Text>
                  </View>
                  <Text style={styles.rowAmount}>{formatPriceCedi(item.amount || 0)}</Text>
                </View>
              ))
            ) : (
              <EmptyState icon="users" title="No referrals yet" subtitle="Your referral activity will show up here." />
            )}

            {history.length ? (
              <>
                <Text style={[styles.section, { marginTop: spacing.xl }]}>Withdrawal requests</Text>
                {history.map((item, index) => (
                  <View key={String(item._id || index)} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{formatPriceCedi(item.amount || 0)}</Text>
                      <Text style={styles.rowMeta}>{item.status} · {item.network}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </>
        ) : (
          <EmptyState icon="gift" title="Could not load referrals" subtitle="Pull to refresh and try again." />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  code: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm, letterSpacing: 2 },
  earnings: { marginTop: spacing.sm, color: colors.primary, fontWeight: '700' },
  hint: { marginTop: spacing.xs, color: colors.muted, fontSize: 12 },
  section: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  networkRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowTitle: { fontWeight: '700', color: colors.text },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowAmount: { fontWeight: '800', color: colors.text },
});
