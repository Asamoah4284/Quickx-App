import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { ZoomIn } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { OUTCOME, PIE_STATUS, PieRing, RISK_TEXT, isOpen, percentFunded } from '@/components/pie/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Avatar, Badge, Button, Card, Check, Choice, Divider, Field, Icon, Input, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Footer, Page } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { cedis } from '@/utils/currency';
import { daysLeft, formatDate, formatDateTime, timeAgo } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { confirmAgain, confirmers, payWithPaystack } from '@/utils/paystack';
import { themed } from '@/utils/themedStyles';

function Term({ label, value, color }) {
  return (
    <View style={styles.term}>
      <Txt size={11.5} color={t.fgSubtle}>
        {label}
      </Txt>
      <Txt size={14} weight="semibold" color={color || t.fg} tabular style={{ marginTop: 3 }}>
        {value}
      </Txt>
    </View>
  );
}

/** What a slice would pay back at the target and at the worst case. */
function Outcomes({ pie, amount }) {
  const a = Number(amount) || 0;
  if (a <= 0) return null;
  const profit = (a * pie.targetRoiPercent) / 100;
  const best = a + profit - (profit * (pie.ownerFeePercent || 0)) / 100;
  const worst = a - (a * pie.maxLossPercent) / 100;
  return (
    <Row gap={10}>
      <View style={[styles.outcome, { borderColor: 'rgba(22,199,132,0.3)', backgroundColor: t.upSoft }]}>
        <Txt size={11.5} color={t.fgSubtle}>
          If it hits the target
        </Txt>
        <Txt size={16} weight="bold" color={t.up} tabular style={{ marginTop: 2 }}>
          {cedis(best)}
        </Txt>
      </View>
      <View style={[styles.outcome, { borderColor: 'rgba(234,57,67,0.3)', backgroundColor: t.downSoft }]}>
        <Txt size={11.5} color={t.fgSubtle}>
          If it hits the max loss
        </Txt>
        <Txt size={16} weight="bold" color={t.down} tabular style={{ marginTop: 2 }}>
          {cedis(worst)}
        </Txt>
      </View>
    </Row>
  );
}

function JoinSheet({ pie, already, visible, onClose, onDone }) {
  const { token, walletBalance, loadWallet } = useAppState();
  const room = Math.max(0, Number(pie.targetAmount) - Number(pie.raisedAmount));
  const personalRoom = Math.max(0, Number(pie.maxDeposit) - already);
  const max = Math.min(room, personalRoom);
  const [amount, setAmount] = useState(String(Math.min(max, Math.max(pie.minDeposit, 0)) || ''));
  const [method, setMethod] = useState('paystack');
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setWalletLoading(true);
    Promise.resolve(loadWallet?.()).finally(() => setWalletLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const balance = Number(walletBalance || 0);
  const value = Number(String(amount).replace(',', '.')) || 0;
  const tooLow = value > 0 && value < pie.minDeposit;
  const tooHigh = value > max;
  const short = method === 'wallet' && value > balance;
  const url = `/ptrading/${pie._id}/deposit`;

  const finish = (message) => {
    haptics.success();
    setPending(null);
    onDone(message || 'Your slice is in.');
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (method === 'wallet') {
        const data = await api(url, { method: 'POST', token, body: { amount: value, acceptRisk: true } });
        finish(data.message);
        return;
      }
      // Check the slice is still allowed before taking any money.
      await api(url, { method: 'POST', token, body: { amount: value, acceptRisk: true, check: true } });
      const outcome = await payWithPaystack({
        token,
        purpose: 'pie',
        body: { id: pie._id, amount: value },
        confirm: confirmers.pie(token, pie._id, value),
      });
      if (outcome.status === 'paid') finish(outcome.result?.message);
      else if (outcome.status === 'pending') setPending(outcome);
    } catch (err) {
      haptics.error();
      setError(err.message || 'The slice did not go through.');
    } finally {
      setBusy(false);
    }
  };

  const checkAgain = async () => {
    setBusy(true);
    const outcome = await confirmAgain(pending.reference, confirmers.pie(token, pie._id, value));
    setBusy(false);
    if (outcome.status === 'paid') finish(outcome.result?.message);
    else setPending(outcome);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={already ? 'Add to your slice' : 'Take a slice'} subtitle={`${pie.pair} · ${pie.title}`}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        <Field label="Amount (GH₵)" hint={`From ${cedis(pie.minDeposit)} up to ${cedis(max)}${already ? `. You already have ${cedis(already)} in.` : '.'}`}>
          <Input value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" icon="dollar-sign" />
        </Field>
        <Outcomes pie={pie} amount={value} />
        {tooLow ? <Alert tone="warn">The smallest slice is {cedis(pie.minDeposit)}.</Alert> : null}
        {tooHigh ? <Alert tone="warn">The most you can add is {cedis(max)}.</Alert> : null}

        <View style={{ gap: 8 }}>
          <Txt size={13.5} weight="semibold">
            How do you want to pay?
          </Txt>
          <Choice
            value={method}
            onChange={setMethod}
            options={[
              { value: 'paystack', icon: 'smartphone', label: 'Mobile Money or card', detail: 'Pay securely with Paystack.' },
              {
                value: 'wallet',
                icon: 'credit-card',
                label: 'QuickX wallet',
                detail: walletLoading ? 'Checking your balance' : `Balance: ${cedis(balance)}`,
                disabled: !walletLoading && balance <= 0,
              },
            ]}
          />
        </View>
        {short && !walletLoading ? <Alert tone="warn">Not enough in your wallet. Pay with Mobile Money or card instead.</Alert> : null}

        <Card padded style={{ backgroundColor: t.bgRaised }}>
          <Check checked={accept} onChange={setAccept}>
            {`I understand I can lose up to ${pie.maxLossPercent}% of this, or more if the market gaps, and that this is not financial advice.`}
          </Check>
        </Card>
        {error ? <Alert>{error}</Alert> : null}
        {pending ? (
          <Alert tone="warn" title="Waiting for your payment">
            {`${pending.message} You will not be charged twice. Reference: ${pending.reference}`}
          </Alert>
        ) : null}
        {pending ? (
          <Button size="lg" icon="refresh-cw" label="Check payment again" loading={busy} onPress={checkAgain} />
        ) : (
          <Button size="lg" label={`Pay ${value ? cedis(value) : ''}`} loading={busy} disabled={!accept || !value || tooLow || tooHigh || short} onPress={submit} />
        )}
      </View>
    </BottomSheet>
  );
}

export default function PieDetail() {
  const { id } = useLocalSearchParams();
  const { isSignedIn, requireSignIn } = useAppState();
  const { data, error, reload, refreshing, refresh } = useApi(`/ptrading/${id}`);
  const [joining, setJoining] = useState(false);
  const [notice, setNotice] = useState('');

  if (!data && !error) {
    return (
      <Page back>
        <View style={{ gap: 14 }}>
          <Skeleton height={32} width="70%" />
          <Skeleton height={260} radius={20} />
          <Skeleton height={160} radius={20} />
        </View>
      </Page>
    );
  }
  if (error || !data?.pie) {
    return (
      <Page back>
        <EmptyState icon="pie-chart" title="This Pie could not be found" subtitle={error?.message}>
          <Button label="All Pies" onPress={() => router.replace('/pie')} />
        </EmptyState>
      </Page>
    );
  }

  const { pie, deposits = [], userDeposit } = data;
  const status = PIE_STATUS[pie.status] || PIE_STATUS.funding;
  const outcome = pie.outcome ? OUTCOME[pie.outcome] : null;
  const pct = percentFunded(pie);
  const open = isOpen(pie);
  const left = daysLeft(pie.fundingDeadline);
  const already = Number(userDeposit?.amount || 0);
  const updates = (pie.tradeUpdates || []).slice().reverse();

  const join = async () => {
    if (!isSignedIn) {
      const ok = await requireSignIn('Sign in to take a slice of this Pie.');
      if (!ok) return;
    }
    setJoining(true);
  };

  return (
    <>
      <Page
        back
        refreshing={refreshing}
        onRefresh={refresh}
        footer={
          open ? (
            <Footer>
              <Button size="lg" label={pct >= 100 ? 'This Pie is full' : userDeposit ? 'Add to my slice' : 'Take a slice'} disabled={pct >= 100} onPress={join} />
            </Footer>
          ) : null
        }>
        <View style={{ gap: 22 }}>
          <Rise>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              <Badge tone={outcome ? outcome.tone : status.tone} label={outcome ? outcome.label : status.label} />
              <Badge label={pie.pair} />
              {pie.market ? (
                <Txt size={12} color={t.fgSubtle} style={{ textTransform: 'capitalize' }}>
                  {pie.market}
                </Txt>
              ) : null}
            </Row>
            <Txt size={26} weight="bold" style={{ marginTop: 10, letterSpacing: -0.5, lineHeight: 32 }}>
              {pie.title}
            </Txt>
            {pie.description ? (
              <Txt size={15} color={t.fgMuted} style={{ marginTop: 8, lineHeight: 22 }}>
                {pie.description}
              </Txt>
            ) : null}
            <Row gap={10} style={{ marginTop: 12 }}>
              <Avatar uri={assetUrl(pie.ownerId?.profilePicture)} name={pie.ownerId?.fullName} size={28} />
              <Txt size={13.5} color={t.fgMuted}>
                Traded by{' '}
                <Txt size={13.5} weight="semibold">
                  {pie.ownerId?.fullName || 'Maxwell'}
                </Txt>
              </Txt>
            </Row>
          </Rise>

          {notice ? (
            <Animated.View entering={ZoomIn.springify()}>
              <Alert tone="up" title="You are in">
                {notice}
              </Alert>
            </Animated.View>
          ) : null}

          <Rise index={1}>
            <Card style={{ alignItems: 'center' }}>
              <PieRing value={pct}>
                <Txt size={30} weight="bold" tabular>
                  {pct}%
                </Txt>
                <Txt size={12} color={t.fgSubtle}>
                  funded
                </Txt>
              </PieRing>
              <Txt size={17} weight="semibold" tabular style={{ marginTop: 14 }}>
                {cedis(pie.raisedAmount)}{' '}
                <Txt size={13} color={t.fgSubtle}>
                  of {cedis(pie.targetAmount)}
                </Txt>
              </Txt>
              <Row gap={14} style={{ marginTop: 6 }}>
                <Row gap={5}>
                  <Icon name="users" size={13} color={t.fgSubtle} />
                  <Txt size={12.5} color={t.fgSubtle}>
                    {pie.participantCount || 0} members
                  </Txt>
                </Row>
                {open && pie.fundingDeadline ? (
                  <Row gap={5}>
                    <Icon name="clock" size={13} color={t.fgSubtle} />
                    <Txt size={12.5} color={t.fgSubtle}>
                      {left > 0 ? `${left} day${left === 1 ? '' : 's'} left` : 'Closes today'}
                    </Txt>
                  </Row>
                ) : null}
              </Row>

              {userDeposit ? (
                <View style={styles.slice}>
                  <Txt size={12.5} color={t.fgMuted}>
                    Your slice
                  </Txt>
                  <Txt size={18} weight="bold" tabular style={{ marginTop: 2 }}>
                    {cedis(userDeposit.amount)}{' '}
                    <Txt size={13} color={t.fgMuted}>
                      ({userDeposit.slicePercentage}%)
                    </Txt>
                  </Txt>
                  {userDeposit.status === 'settled' ? (
                    <Txt size={13} color={userDeposit.pnlAmount >= 0 ? t.up : t.down} tabular style={{ marginTop: 2 }}>
                      Paid back {cedis(userDeposit.payoutAmount)} ({userDeposit.pnlAmount >= 0 ? '+' : ''}
                      {cedis(userDeposit.pnlAmount)})
                    </Txt>
                  ) : null}
                  {userDeposit.status === 'refunded' ? (
                    <Txt size={13} color={t.fgMuted} style={{ marginTop: 2 }}>
                      Refunded in full
                    </Txt>
                  ) : null}
                </View>
              ) : null}
              {!open ? (
                <Txt size={13} color={t.fgMuted} center style={{ marginTop: 14 }}>
                  {status.help}
                </Txt>
              ) : null}
            </Card>
          </Rise>

          {pie.status === 'settled' ? (
            <Card tone={outcome?.tone === 'up' ? 'up' : outcome?.tone === 'down' ? 'down' : undefined}>
              <Txt size={13} color={t.fgMuted}>
                Final result
              </Txt>
              <Txt size={36} weight="bold" tabular color={outcome?.tone === 'up' ? t.up : outcome?.tone === 'down' ? t.down : t.fg} style={{ marginTop: 2 }}>
                {pie.finalPnlPercent > 0 ? '+' : ''}
                {pie.finalPnlPercent}%
              </Txt>
              <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 19 }}>
                {cedis(pie.totalDistributedAmount)} was paid back into members' wallets on {formatDate(pie.settledAt)}.
              </Txt>
              {pie.settlementNotes ? (
                <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 8 }}>
                  {pie.settlementNotes}
                </Txt>
              ) : null}
              {pie.settlementProof ? (
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight="external-link"
                  label="See the broker statement"
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  onPress={() => Linking.openURL(assetUrl(pie.settlementProof)).catch(() => {})}
                />
              ) : null}
            </Card>
          ) : null}

          <View>
            <SectionTitle title="The plan" />
            <View style={styles.terms}>
              <Term label="Aiming for" value={`+${pie.targetRoiPercent}%`} color={t.up} />
              <Term label="Most it can lose" value={`-${pie.maxLossPercent}%`} color={t.down} />
              <Term label="Risk level" value={pie.riskLevel} />
              <Term label="Maxwell's fee" value={`${pie.ownerFeePercent}% of profit only`} />
              <Term label="Slice size" value={`${cedis(pie.minDeposit)} to ${cedis(pie.maxDeposit)}`} />
              <Term label="Joining closes" value={pie.fundingDeadline ? formatDate(pie.fundingDeadline) : 'When trading starts'} />
            </View>
            <Txt size={12} color={t.fgSubtle} style={{ marginTop: 8 }}>
              There is no fee if the trade loses or breaks even.
            </Txt>
          </View>

          <View>
            <SectionTitle title="Trade updates" />
            {updates.length ? (
              <View style={styles.timeline}>
                {updates.map((u, i) => (
                  <Rise key={u._id || i} index={i}>
                    <View style={{ paddingLeft: 20, paddingBottom: 18 }}>
                      <View style={styles.dot} />
                      <Txt size={15} weight="semibold">
                        {u.title}
                      </Txt>
                      <Txt size={12} color={t.fgSubtle}>
                        {formatDateTime(u.createdAt)}
                      </Txt>
                      {u.entryPrice || u.stopLoss || u.takeProfit ? (
                        <Row gap={14} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                          {u.entryPrice ? (
                            <Txt size={13} color={t.fgMuted} tabular>
                              Entry <Txt size={13} tabular>{u.entryPrice}</Txt>
                            </Txt>
                          ) : null}
                          {u.stopLoss ? (
                            <Txt size={13} color={t.fgMuted} tabular>
                              Stop <Txt size={13} color={t.down} tabular>{u.stopLoss}</Txt>
                            </Txt>
                          ) : null}
                          {u.takeProfit ? (
                            <Txt size={13} color={t.fgMuted} tabular>
                              Target <Txt size={13} color={t.up} tabular>{u.takeProfit}</Txt>
                            </Txt>
                          ) : null}
                        </Row>
                      ) : null}
                      {u.notes ? (
                        <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 19 }}>
                          {u.notes}
                        </Txt>
                      ) : null}
                      {u.imageUrl ? (
                        <Pressable onPress={() => Linking.openURL(assetUrl(u.imageUrl)).catch(() => {})} style={{ marginTop: 8 }}>
                          <Image source={{ uri: assetUrl(u.imageUrl) }} style={styles.updateImage} contentFit="cover" />
                        </Pressable>
                      ) : null}
                    </View>
                  </Rise>
                ))}
              </View>
            ) : (
              <Txt size={13.5} color={t.fgMuted}>
                Maxwell will post entries, exits and notes here once trading starts.
              </Txt>
            )}
          </View>

          <Alert tone="warn" icon="shield">
            {RISK_TEXT}
          </Alert>

          {deposits.length ? (
            <Card>
              <Txt size={14} weight="semibold">
                Who's in
              </Txt>
              <View style={{ marginTop: 10 }}>
                {deposits.slice(0, 12).map((d, i) => (
                  <View key={d._id}>
                    {i ? <Divider style={{ marginVertical: 8 }} /> : null}
                    <Row justify="space-between">
                      <Row gap={10} style={{ flex: 1 }}>
                        <Avatar uri={assetUrl(d.profilePicture)} name={d.name} size={26} />
                        <Txt size={13.5} weight={d.isYou ? 'semibold' : 'regular'} color={d.isYou ? t.fg : t.fgMuted} numberOfLines={1} style={{ flex: 1 }}>
                          {d.isYou ? 'You' : d.name}
                        </Txt>
                      </Row>
                      <Txt size={13} color={t.fgSubtle} tabular>
                        {d.slicePercentage}%
                      </Txt>
                    </Row>
                  </View>
                ))}
              </View>
              {deposits.length > 12 ? (
                <Txt size={12} color={t.fgSubtle} style={{ marginTop: 10 }}>
                  and {deposits.length - 12} more
                </Txt>
              ) : null}
              <Txt size={11} color={t.fgSubtle} style={{ marginTop: 10 }}>
                Updated {timeAgo(pie.updatedAt)}
              </Txt>
            </Card>
          ) : null}
        </View>
      </Page>

      {joining ? (
        <JoinSheet
          visible
          pie={pie}
          already={already}
          onClose={() => setJoining(false)}
          onDone={(message) => {
            setJoining(false);
            setNotice(message);
            reload({ quiet: true });
          }}
        />
      ) : null}
    </>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    term: { flexBasis: '47%', flexGrow: 1, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.bgRaised, paddingHorizontal: 14, paddingVertical: 11 },
    terms: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    outcome: { flex: 1, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
    slice: { marginTop: 16, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(91,143,255,0.3)', backgroundColor: t.brandSoft, paddingHorizontal: 14, paddingVertical: 11 },
    timeline: { borderLeftWidth: 1, borderLeftColor: t.line, marginLeft: 4 },
    dot: { position: 'absolute', left: -5, top: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: t.brand400 },
    updateImage: { width: '100%', height: 200, borderRadius: 14, borderWidth: 1, borderColor: t.line },
  })
);
