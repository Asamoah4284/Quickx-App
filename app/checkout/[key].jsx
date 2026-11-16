import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Alert, Button, Card, Divider, Field, Icon, Input, Loading, Rise, Row, Txt } from '@/components/ui/kit';
import { Footer, Page } from '@/components/ui/Page';
import { api } from '@/constants/api';
import { FEATURES } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { cedis, money } from '@/utils/currency';
import { durationLabel, formatDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { confirmAgain, confirmers, payWithPaystack } from '@/utils/paystack';

function Success({ product, entitlements }) {
  const first = FEATURES[product.grants[0]];
  return (
    <Page back>
      <View style={{ alignItems: 'center', paddingTop: 40 }}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: t.upSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={40} color={t.up} />
        </Animated.View>
        <Rise delay={120}>
          <Txt size={30} weight="bold" center style={{ marginTop: 24, letterSpacing: -0.6 }}>
            You are in
          </Txt>
          <Txt size={15} color={t.fgMuted} center style={{ marginTop: 6 }}>
            {product.name} is now active on your account.
          </Txt>
        </Rise>
        <Rise delay={220} style={{ alignSelf: 'stretch', marginTop: 24 }}>
          <Card padded={false}>
            {entitlements.map((e, i) => (
              <View key={e.feature}>
                {i ? <Divider /> : null}
                <Row justify="space-between" style={{ padding: 16 }}>
                  <Row gap={10}>
                    <Icon name="check" size={16} color={t.up} />
                    <Txt size={15} weight="semibold">
                      {FEATURES[e.feature]?.label || e.feature}
                    </Txt>
                  </Row>
                  <Txt size={13} color={t.fgMuted} tabular>
                    until {formatDate(e.endsAt)}
                  </Txt>
                </Row>
              </View>
            ))}
          </Card>
        </Rise>
        <Rise delay={300} style={{ alignSelf: 'stretch', marginTop: 24, gap: 10 }}>
          <Button size="lg" label={`Open ${first?.label || 'my account'}`} onPress={() => router.replace(first?.route || '/account')} />
          <Button variant="secondary" label="My account" onPress={() => router.replace('/account')} />
        </Rise>
      </View>
    </Page>
  );
}

export default function Checkout() {
  const { key } = useLocalSearchParams();
  const { token, requireSignIn, refreshAccess, walletBalance, loadWallet } = useAppState();
  const [quote, setQuote] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [pending, setPending] = useState(null);
  const [done, setDone] = useState(null);

  const loadQuote = useCallback(
    (code) => api(`/products/${key}/quote${code ? `?coupon=${encodeURIComponent(code)}` : ''}`),
    [key]
  );

  useEffect(() => {
    loadQuote()
      .then(setQuote)
      .catch((err) => setLoadError(err.message || 'This plan is not available.'));
  }, [loadQuote]);

  useEffect(() => {
    if (token) loadWallet();
  }, [token, loadWallet]);

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      setQuote(await loadQuote(code));
      haptics.success();
    } catch (err) {
      setCouponError(err.message || 'That coupon could not be applied.');
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async () => {
    setCoupon('');
    setCouponError('');
    setQuote(await loadQuote().catch(() => quote));
  };

  const finish = async (data) => {
    haptics.success();
    await Promise.all([refreshAccess(), loadWallet()]);
    setPending(null);
    setDone(data?.entitlements || []);
  };

  /** Every payment needs an account; ask for one first, then carry on with the new token. */
  const signedIn = () => requireSignIn('Sign in or create a free account to finish your purchase.');

  const payPaystack = async () => {
    setPayError('');
    const tk = await signedIn();
    if (!tk) return;
    setPaying(true);
    try {
      const outcome = await payWithPaystack({
        token: tk,
        purpose: 'product',
        body: { key, couponCode: quote.couponCode || undefined },
        confirm: confirmers.product(tk, key, quote.couponCode),
      });
      if (outcome.status === 'paid') await finish(outcome.result);
      else if (outcome.status === 'pending') setPending(outcome);
    } catch (err) {
      haptics.error();
      setPayError(err.message || 'Could not open the payment page. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const checkAgain = async () => {
    setPaying(true);
    const outcome = await confirmAgain(pending.reference, confirmers.product(token, key, quote.couponCode));
    setPaying(false);
    if (outcome.status === 'paid') await finish(outcome.result);
    else setPending(outcome);
  };

  const payWallet = async () => {
    setPaying(true);
    setPayError('');
    try {
      const data = await api(`/products/${key}/purchase/wallet`, { method: 'POST', token, body: { couponCode: quote.couponCode || undefined } });
      await finish(data);
    } catch (err) {
      haptics.error();
      setPayError(err.message || 'Could not pay from your wallet.');
      loadWallet();
    } finally {
      setPaying(false);
    }
  };

  const redeem = async () => {
    const tk = await signedIn();
    if (!tk) return;
    setPaying(true);
    setPayError('');
    try {
      const data = await api(`/products/${key}/redeem`, { method: 'POST', token: tk, body: { couponCode: quote.couponCode } });
      await finish(data);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loadError) {
    return (
      <Page back title="Checkout">
        <Alert>{loadError}</Alert>
        <Button variant="secondary" label="See all plans" style={{ marginTop: 16 }} onPress={() => router.replace('/pricing')} />
      </Page>
    );
  }
  if (!quote) {
    return (
      <Page back title="Checkout">
        <Loading label="Loading plan" />
      </Page>
    );
  }

  const { product } = quote;
  if (done) return <Success product={product} entitlements={done} />;

  const free = quote.amount < 0.01;
  const canWallet = Boolean(token) && walletBalance >= quote.amount && !free;

  return (
    <Page
      back
      keyboard
      eyebrow="You are getting"
      title={product.name}
      subtitle={product.tagline}
      footer={
        <Footer>
          {pending ? (
            <Button size="lg" icon="refresh-cw" label="Check payment again" loading={paying} onPress={checkAgain} />
          ) : free ? (
            <Button size="lg" label="Activate for free" loading={paying} onPress={redeem} />
          ) : (
            <View style={{ gap: 8 }}>
              <Button size="lg" icon="lock" label={`Pay ${cedis(quote.amount)}`} loading={paying} onPress={payPaystack} />
              {canWallet ? (
                <Button variant="secondary" label={`Pay from wallet · ${cedis(walletBalance)} available`} disabled={paying} onPress={payWallet} />
              ) : null}
            </View>
          )}
          <Row gap={6} justify="center" style={{ marginTop: 10 }}>
            <Icon name="shield" size={12} color={t.fgSubtle} />
            <Txt size={11.5} color={t.fgSubtle}>
              Mobile Money or card, processed securely by Paystack
            </Txt>
          </Row>
        </Footer>
      }>
      <View style={{ gap: 16 }}>
        <Rise>
          <Card>
            <View style={{ gap: 10 }}>
              {(product.highlights || []).map((item) => (
                <Row key={item} gap={10} align="flex-start">
                  <Icon name="check" size={15} color={t.up} style={{ marginTop: 3 }} />
                  <Txt size={14} color={t.fgMuted} style={{ flex: 1 }}>
                    {item}
                  </Txt>
                </Row>
              ))}
            </View>
            <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: t.bgRaised }}>
              <Txt size={13} color={t.fgMuted}>
                Access lasts{' '}
                <Txt size={13} weight="bold">
                  {durationLabel(product.durationDays)}
                </Txt>
                . If you already have time left, this is added on top.
              </Txt>
            </View>
          </Card>
        </Rise>

        <Rise index={1}>
          <Card>
            <Txt size={16} weight="semibold">
              Order summary
            </Txt>
            <Row justify="space-between" style={{ marginTop: 14 }}>
              <Txt size={14} color={t.fgMuted}>
                {product.name} · {durationLabel(product.durationDays)}
              </Txt>
              <Txt size={14} color={t.fgMuted} tabular>
                {money(quote.listPrice)}
              </Txt>
            </Row>
            {quote.discountPercent > 0 ? (
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Txt size={14} color={t.up}>
                  Coupon {quote.couponCode} (-{quote.discountPercent}%)
                </Txt>
                <Txt size={14} color={t.up} tabular>
                  -{money(quote.listPrice - quote.amount)}
                </Txt>
              </Row>
            ) : null}
            <Divider style={{ marginVertical: 14 }} />
            <Row justify="space-between">
              <Txt size={15} weight="semibold">
                Total
              </Txt>
              <Txt size={28} weight="bold" tabular>
                {cedis(quote.amount)}
              </Txt>
            </Row>
            <Txt size={12} color={t.fgSubtle} style={{ marginTop: 4 }}>
              Charged in Ghana cedis.
            </Txt>
          </Card>
        </Rise>

        <Rise index={2}>
          {quote.couponCode ? (
            <Button variant="ghost" size="sm" label="Remove coupon" onPress={removeCoupon} />
          ) : (
            <Field label="Coupon code" error={couponError}>
              <Row gap={8}>
                <Input
                  style={{ flex: 1 }}
                  value={coupon}
                  onChangeText={(v) => setCoupon(v.toUpperCase())}
                  placeholder="Optional"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={applyCoupon}
                />
                <Button variant="secondary" icon="tag" label="Apply" loading={couponBusy} disabled={!coupon.trim()} onPress={applyCoupon} />
              </Row>
            </Field>
          )}
        </Rise>

        {pending ? (
          <Alert tone="warn" title="Payment not confirmed yet">
            {`${pending.message} You will not be charged twice. Reference: ${pending.reference}`}
          </Alert>
        ) : null}
        {payError ? <Alert>{payError}</Alert> : null}
      </View>
    </Page>
  );
}
