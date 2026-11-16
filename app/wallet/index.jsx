import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { detectMomoNetwork, getMomoNetworks } from '@/utils/moolre';
import { formatCurrency } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function WalletScreen() {
  const router = useRouter();
  const {
    walletBalance,
    currency,
    transactions,
    deposit,
    withdraw,
    user,
    token,
    loadWallet,
  } = useAppState();
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState('50');
  const [phone, setPhone] = useState(user?.phone || '');
  const [network, setNetwork] = useState(detectMomoNetwork(user?.phone || ''));
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
      setNetwork(detectMomoNetwork(user.phone));
    }
  }, [user?.phone]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  }, [loadWallet]);

  useEffect(() => {
    if (token && token !== 'local') refresh();
  }, [token, refresh]);

  const close = () => {
    setModal(null);
    setAmount('50');
    setSubmitting(false);
  };

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert('Invalid amount');
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      Alert.alert('Phone required', 'Enter your Mobile Money number.');
      return;
    }
    if (modal === 'withdraw' && walletBalance < value) {
      Alert.alert('Insufficient balance', `You can withdraw up to ${formatCurrency(walletBalance, currency)}.`);
      return;
    }
    setSubmitting(true);
    try {
      if (modal === 'deposit') {
        await deposit({
          amount: value,
          phone,
          network,
          onPending: () => setPending(true),
        });
        haptics.success();
        Alert.alert('Top-up successful', 'Your wallet balance has been updated.');
      } else if (modal === 'withdraw') {
        await withdraw({ amount: value, phone, network });
        haptics.success();
        Alert.alert('Withdrawal requested', 'Funds will be sent to your MoMo number once approved.');
      }
      close();
    } catch (err) {
      haptics.error();
      Alert.alert(modal === 'deposit' ? 'Top-up failed' : 'Withdrawal failed', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
      setPending(false);
    }
  };

  if (!token || token === 'local') {
    return (
      <Screen>
        <Text style={typography.h2}>QuickX Wallet</Text>
        <Text style={[typography.caption, { marginTop: spacing.md }]}>
          Sign in to use your wallet for bookings and top-ups.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Text style={[typography.h2, { marginBottom: spacing.md }]}>QuickX Wallet</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(walletBalance, currency)}</Text>
        <Text style={styles.balanceHint}>Top up via Moolre Mobile Money</Text>
      </View>

      <View style={styles.actions}>
        <Action label="Top up" onPress={() => setModal('deposit')} />
        <Action label="Withdraw" onPress={() => setModal('withdraw')} />
      </View>

      <Pressable style={styles.linkCard} onPress={() => router.push('/bookings')}>
        <Text style={styles.linkTitle}>My Bookings</Text>
        <Text style={typography.caption}>Sessions paid from wallet</Text>
      </Pressable>

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Transaction history
      </Text>
      {transactions.length ? (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.tx}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>{tx.label || tx.type}</Text>
              <Text style={typography.caption}>
                {tx.type} · {tx.date}
                {tx.status && tx.status !== 'completed' ? ` · ${tx.status}` : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: tx.amount >= 0 ? colors.success : colors.text },
              ]}>
              {tx.amount >= 0 ? '+' : ''}
              {formatCurrency(tx.amount, currency)}
            </Text>
          </View>
        ))
      ) : (
        <Text style={typography.caption}>No transactions yet. Top up to get started.</Text>
      )}

      <Modal visible={Boolean(modal)} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h3}>{modal === 'deposit' ? 'Top up wallet' : 'Withdraw'}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Amount"
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.fieldLabel}>Network</Text>
            <View style={styles.networkRow}>
              {getMomoNetworks().map((item) => {
                const active = network === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setNetwork(item.id)}
                    style={[styles.networkChip, active && styles.networkChipActive]}>
                    <Text style={[styles.networkText, active && styles.networkTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="MoMo number"
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            {pending ? (
              <Text style={styles.pending}>Approve the MoMo prompt on your phone — we’ll confirm automatically.</Text>
            ) : null}
            <PrimaryButton
              label={modal === 'deposit' ? 'Top up' : 'Withdraw'}
              onPress={submit}
              loading={submitting}
            />
            <PrimaryButton label="Cancel" variant="ghost" onPress={close} disabled={submitting} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Action({ label, onPress }) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  balanceLabel: { color: '#7BA3FF', fontWeight: '600' },
  balanceValue: { color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 8 },
  balanceHint: { color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionText: { color: colors.white, fontWeight: '700' },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkTitle: { fontWeight: '700', color: colors.text },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  txLabel: { fontWeight: '600', color: colors.text },
  txAmount: { fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  pending: {
    backgroundColor: '#FFF7E0',
    color: colors.navy,
    borderRadius: radii.md,
    padding: spacing.md,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  networkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  networkChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  networkChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  networkText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  networkTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
});
