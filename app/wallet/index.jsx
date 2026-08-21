import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatCurrency } from '@/utils/format';

export default function WalletScreen() {
  const router = useRouter();
  const {
    walletBalance,
    currency,
    transactions,
    deposit,
    withdraw,
    transfer,
    physicalOrders,
  } = useAppState();
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState('100');
  const [note, setNote] = useState('');

  const close = () => {
    setModal(null);
    setAmount('100');
    setNote('');
  };

  const submit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert('Invalid amount');
      return;
    }
    if (modal === 'deposit') {
      deposit(value);
      Alert.alert('Deposit successful');
    } else if (modal === 'withdraw') {
      if (!withdraw(value)) Alert.alert('Insufficient balance');
      else Alert.alert('Withdrawal requested (mock)');
    } else if (modal === 'transfer') {
      if (!transfer(value, note || 'Transfer')) Alert.alert('Insufficient balance');
      else Alert.alert('Transfer sent (mock)');
    }
    close();
  };

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.md }]}>QuickX Wallet</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(walletBalance, currency)}</Text>
      </View>

      <View style={styles.actions}>
        <Action label="Deposit" onPress={() => setModal('deposit')} />
        <Action label="Withdraw" onPress={() => setModal('withdraw')} />
        <Action label="Transfer" onPress={() => setModal('transfer')} />
      </View>

      <Pressable style={styles.linkCard} onPress={() => router.push('/bookings')}>
        <Text style={styles.linkTitle}>My Bookings</Text>
        <Text style={typography.caption}>Sessions paid from wallet</Text>
      </Pressable>

      {physicalOrders.length ? (
        <>
          <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Physical orders
          </Text>
          {physicalOrders.map((o) => (
            <View key={o.id} style={styles.tx}>
              <Text style={styles.txLabel}>{o.title}</Text>
              <Text style={typography.caption}>
                {o.status} · {o.date}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Transaction history
      </Text>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.tx}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txLabel}>{tx.label}</Text>
            <Text style={typography.caption}>
              {tx.type} · {tx.date}
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
      ))}

      <Modal visible={Boolean(modal)} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h3}>
              {modal === 'deposit' ? 'Deposit' : modal === 'withdraw' ? 'Withdraw' : 'Transfer'}
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Amount"
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            {modal === 'transfer' ? (
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Note / recipient"
                style={styles.input}
                placeholderTextColor={colors.muted}
              />
            ) : null}
            <PrimaryButton label="Confirm" onPress={submit} />
            <PrimaryButton label="Cancel" variant="ghost" onPress={close} style={{ marginTop: 8 }} />
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
});
