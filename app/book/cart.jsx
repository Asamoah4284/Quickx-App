import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Button, Card, Divider, Icon, Row, Txt } from '@/components/ui/kit';
import { Footer, Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { mapBook } from '@/utils/catalog';
import { formatPriceCedi } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { confirmAgain, confirmers, payWithPaystack } from '@/utils/paystack';

export default function BookCartScreen() {
  const { token, isSignedIn, requireSignIn, cartBookIds, toggleCartBook, clearCart } = useAppState();
  const { data, error: loadError } = useApi('/books');
  const [paying, setPaying] = useState(false);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const cartBooks = useMemo(() => {
    const list = (Array.isArray(data) ? data : data?.books || data?.data || []).map(mapBook);
    return list.filter((b) => cartBookIds.includes(b.id) && b.type !== 'physical');
  }, [data, cartBookIds]);
  const total = cartBooks.reduce((sum, b) => sum + Number(b.price || 0), 0);
  const order = { itemType: 'book_cart', items: cartBooks.map((b) => b.id), amount: total };

  const succeed = () => {
    haptics.success();
    setPending(null);
    clearCart();
    setDone(true);
  };

  const pay = async () => {
    setError('');
    let tk = token;
    if (!isSignedIn) {
      tk = await requireSignIn('Sign in to check out.');
      if (!tk) return;
    }
    setPaying(true);
    try {
      const outcome = await payWithPaystack({ token: tk, purpose: 'book', body: order, confirm: confirmers.book(tk, order) });
      if (outcome.status === 'paid') succeed();
      else if (outcome.status === 'pending') setPending(outcome);
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not start the payment.');
    } finally {
      setPaying(false);
    }
  };

  const checkAgain = async () => {
    setPaying(true);
    const outcome = await confirmAgain(pending.reference, confirmers.book(token, order));
    setPaying(false);
    if (outcome.status === 'paid') succeed();
    else setPending(outcome);
  };

  if (done) {
    return (
      <Page back title="Cart">
        <Animated.View entering={ZoomIn.springify()}>
          <EmptyState icon="check-circle" title="Your books are ready" subtitle="Open any of them from the books page to start reading.">
            <Button label="Go to books" onPress={() => router.replace('/books')} />
          </EmptyState>
        </Animated.View>
      </Page>
    );
  }

  if (!data && !loadError) {
    return (
      <Page back title="Cart">
        <Skeleton height={160} radius={20} />
      </Page>
    );
  }

  if (!cartBooks.length) {
    return (
      <Page back title="Cart">
        <EmptyState icon="shopping-bag" title="Your cart is empty" subtitle="Add e-books from the store to buy several at once.">
          <Button label="Browse books" onPress={() => router.replace('/books')} />
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page
      back
      title="Cart"
      subtitle={`${cartBooks.length} e-book${cartBooks.length === 1 ? '' : 's'}`}
      footer={
        <Footer>
          {pending ? (
            <Button size="lg" icon="refresh-cw" label="Check payment again" loading={paying} onPress={checkAgain} />
          ) : (
            <Button size="lg" label={`Pay ${formatPriceCedi(total)}`} loading={paying} onPress={pay} />
          )}
        </Footer>
      }>
      <View style={{ gap: 14 }}>
        <Card padded={false}>
          {cartBooks.map((book, i) => (
            <View key={book.id}>
              {i ? <Divider /> : null}
              <Row gap={12} style={{ padding: 12 }}>
                <PressableScale onPress={() => router.push(`/book/${book.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={styles.thumb}>
                    {book.cover ? <Image source={{ uri: assetUrl(book.cover) }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="book" size={18} color={t.fgSubtle} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={14.5} weight="semibold" numberOfLines={2}>
                      {book.title}
                    </Txt>
                    <Txt size={13} weight="bold" color={t.brand300} tabular style={{ marginTop: 2 }}>
                      {formatPriceCedi(book.price)}
                    </Txt>
                  </View>
                </PressableScale>
                <PressableScale haptic="select" hitSlop={10} onPress={() => toggleCartBook(book.id)} accessibilityLabel={`Remove ${book.title}`}>
                  <Icon name="x" size={18} color={t.fgSubtle} />
                </PressableScale>
              </Row>
            </View>
          ))}
        </Card>
        <Row justify="space-between">
          <Txt size={15} color={t.fgMuted}>
            Total
          </Txt>
          <Txt size={20} weight="bold" tabular>
            {formatPriceCedi(total)}
          </Txt>
        </Row>
        {error ? <Alert>{error}</Alert> : null}
        {pending ? (
          <Alert tone="warn" title="Waiting for your payment">
            {`${pending.message} You will not be charged twice. Reference: ${pending.reference}`}
          </Alert>
        ) : null}
        <Txt size={12} color={t.fgSubtle} center>
          Pay with Mobile Money or card through Paystack.
        </Txt>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 46, height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: t.ink700, alignItems: 'center', justifyContent: 'center' },
});
