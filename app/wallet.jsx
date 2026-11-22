import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Alert, Badge, Button, Card, Chips, Divider, Field, Icon, Input, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { useCopy } from '@/hooks/useCopy';
import { cedis } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { NETWORKS, guessNetwork, withdrawReferral, withdrawWallet } from '@/utils/wallet';

const STATUS = {
  pending: { label: 'Being processed', tone: 'warn' },
  completed: { label: 'Paid', tone: 'up' },
  rejected: { label: 'Rejected, money returned', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'down' },
};

function WithdrawSheet({ source, wallet, onClose, onDone }) {
  const { token, user } = useAppState();
  const isReferral = source === 'referral';
  const available = isReferral ? wallet.referralEarnings : wallet.balance;
  const minimum = isReferral ? wallet.minReferralWithdrawal : wallet.minWalletWithdrawal;
  const startNumber = wallet.momoDetails?.momoNumber || String(user?.phone || '').replace(/^\+?233/, '0');
  const [amount, setAmount] = useState(String(available));
  const [momoNumber, setMomoNumber] = useState(startNumber.replace(/\D/g, '').slice(0, 10));
  const [network, setNetwork] = useState(wallet.momoDetails?.network || guessNetwork(startNumber) || 'MTN');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Pick the network from the number as people type, until they choose one themselves.
  const [pickedNetwork, setPickedNetwork] = useState(Boolean(wallet.momoDetails?.network));
  useEffect(() => {
    if (pickedNetwork) return;
    const guess = guessNetwork(momoNumber);
    if (guess) setNetwork(guess);
  }, [momoNumber, pickedNetwork]);

  const value = Number(String(amount).replace(',', '.')) || 0;
  const numberOk = /^0\d{9}$/.test(momoNumber);
  const amountOk = isReferral || (value >= minimum && value <= available);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (isReferral) await withdrawReferral(token, { momoNumber, network });
      else await withdrawWallet(token, { amount: value, momoNumber, network });
      haptics.success();
      onDone();
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not request the withdrawal.');
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible onClose={onClose} title={isReferral ? 'Withdraw referral earnings' : 'Withdraw from wallet'}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        <Txt size={14} color={t.fgMuted} style={{ lineHeight: 20 }}>
          {isReferral
            ? `Your full referral balance of ${cedis(available)} will be sent to your Mobile Money number once approved.`
            : `You have ${cedis(available)} available. The smallest withdrawal is ${cedis(minimum)}.`}
        </Txt>
        {!isReferral ? (
          <Field label="Amount (GH₵)" error={value && !amountOk ? `Enter between ${cedis(minimum)} and ${cedis(available)}.` : undefined}>
            <Input value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" />
          </Field>
        ) : null}
        <Field label="Mobile Money number" hint="10 digits, for example 0241234567">
          <Input value={momoNumber} onChangeText={(v) => setMomoNumber(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" icon="smartphone" placeholder="0241234567" />
        </Field>
        <Field label="Network">
          <Chips
            items={NETWORKS}
            value={network}
            onChange={(v) => {
              setPickedNetwork(true);
              setNetwork(v);
            }}
          />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        <Button size="lg" label="Request withdrawal" loading={busy} disabled={!numberOk || !amountOk} onPress={submit} />
        <Txt size={12} color={t.fgSubtle} center>
          Withdrawals are checked and paid out by hand, usually within a day.
        </Txt>
      </View>
    </BottomSheet>
  );
}

export default function WalletScreen() {
  const { loadWallet } = useAppState();
  const { data: wallet, error, reload, refresh, refreshing } = useApi('/wallet', { refetchOnFocus: true });
  const [withdrawing, setWithdrawing] = useState(null);
  const [done, setDone] = useState(false);
  const { copy, copied } = useCopy();

  if (!wallet) {
    return (
      <Page back title="Wallet">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : (
          <View style={{ gap: 12 }}>
            <Skeleton height={150} radius={20} />
            <Skeleton height={120} radius={20} />
          </View>
        )}
      </Page>
    );
  }

  const canWithdrawWallet = wallet.balance >= wallet.minWalletWithdrawal && !wallet.hasPendingWithdrawal;
  const canWithdrawReferral = wallet.referralEarnings >= wallet.minReferralWithdrawal && !wallet.hasPendingWithdrawal;

  return (
    <Page back title="Wallet" subtitle="Pie payouts, refunds and referral earnings land here." refreshing={refreshing} onRefresh={refresh}>
      <View style={{ gap: 14 }}>
        {done ? (
          <Animated.View entering={ZoomIn.springify()}>
            <Alert tone="up" title="Withdrawal requested">
              We will send it to your Mobile Money and tell you when it is paid.
            </Alert>
          </Animated.View>
        ) : null}
        {wallet.hasPendingWithdrawal && !done ? <Alert tone="brand">You have a withdrawal being processed. You can request another once it is paid.</Alert> : null}

        <Rise>
          <Card tone="brand">
            <Txt size={11.5} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Wallet balance
            </Txt>
            <Txt size={36} weight="bold" tabular style={{ marginTop: 4, letterSpacing: -0.8 }}>
              {cedis(wallet.balance)}
            </Txt>
            <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 2 }}>
              Use it to pay for plans and Pie slices, or withdraw to Mobile Money.
            </Txt>
            <Button
              variant="secondary"
              icon="arrow-up-right"
              label="Withdraw"
              disabled={!canWithdrawWallet}
              style={{ marginTop: 14, alignSelf: 'flex-start' }}
              onPress={() => setWithdrawing('wallet')}
            />
            {!canWithdrawWallet && !wallet.hasPendingWithdrawal ? (
              <Txt size={12} color={t.fgSubtle} style={{ marginTop: 8 }}>
                You can withdraw once you have {cedis(wallet.minWalletWithdrawal)}.
              </Txt>
            ) : null}
          </Card>
        </Rise>

        <Rise index={1}>
          <Card>
            <Txt size={11.5} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Referral earnings
            </Txt>
            <Txt size={28} weight="bold" color={t.up} tabular style={{ marginTop: 4 }}>
              {cedis(wallet.referralEarnings)}
            </Txt>
            <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 2 }}>
              Withdraw once you reach {cedis(wallet.minReferralWithdrawal)}.
            </Txt>
            <Button
              variant="secondary"
              size="sm"
              label="Withdraw"
              disabled={!canWithdrawReferral}
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              onPress={() => setWithdrawing('referral')}
            />
          </Card>
        </Rise>

        <Rise index={2}>
          <Card>
            <Row gap={8}>
              <Icon name="gift" size={14} color={t.fgSubtle} />
              <Txt size={11.5} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Your referral code
              </Txt>
            </Row>
            <PressableScale haptic={false} onPress={() => wallet.referralCode && copy(wallet.referralCode, 'code')} accessibilityLabel="Copy referral code">
              <Row gap={12} style={{ marginTop: 8 }}>
                <Txt size={28} weight="bold" tabular style={{ letterSpacing: 3 }}>
                  {wallet.referralCode || 'Not set yet'}
                </Txt>
                <Icon name={copied === 'code' ? 'check' : 'copy'} size={18} color={copied === 'code' ? t.up : t.fgSubtle} />
              </Row>
            </PressableScale>
            <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 19 }}>
              Earn {wallet.referralRatePercent}% of every purchase made by people who sign up with your code.
            </Txt>
          </Card>
        </Rise>

        {wallet.withdrawals?.length ? (
          <View style={{ marginTop: 8 }}>
            <SectionTitle title="Withdrawals" />
            <Card padded={false}>
              {wallet.withdrawals.map((w, i) => (
                <View key={w.id}>
                  {i ? <Divider /> : null}
                  <Row justify="space-between" gap={10} style={{ padding: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Txt size={15} weight="semibold" tabular>
                        {cedis(w.amount)}
                      </Txt>
                      <Txt size={12} color={t.fgSubtle} style={{ marginTop: 2 }}>
                        {w.source === 'wallet' ? 'Wallet' : 'Referral earnings'} · {w.network} {w.momoNumber} · {formatDate(w.requestedAt)}
                      </Txt>
                    </View>
                    <Badge tone={STATUS[w.status]?.tone} label={STATUS[w.status]?.label || w.status} />
                  </Row>
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </View>

      {withdrawing ? (
        <WithdrawSheet
          source={withdrawing}
          wallet={wallet}
          onClose={() => setWithdrawing(null)}
          onDone={() => {
            setWithdrawing(null);
            setDone(true);
            reload({ quiet: true });
            loadWallet?.();
          }}
        />
      ) : null}
    </Page>
  );
}
