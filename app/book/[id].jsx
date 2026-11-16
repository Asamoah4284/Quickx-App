import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { HardcopyRequestModal } from '@/components/books/HardcopyRequestModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Badge, Button, Choice, Icon, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Footer, Page, RoundButton } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { BOOK_TYPE, fetchBookContent, fetchBookOffers, fetchBookPreview } from '@/utils/catalog';
import { formatPriceCedi } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { confirmAgain, confirmers, payWithPaystack } from '@/utils/paystack';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const { token, user, isSignedIn, requireSignIn, isWishlisted, toggleWishlistBook, toggleCartBook, cartBookIds } = useAppState();
  const [book, setBook] = useState(null);
  const [offers, setOffers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState(false);
  const [option, setOption] = useState('single');
  const [showHardcopy, setShowHardcopy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [justBought, setJustBought] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const item = await fetchBookPreview(String(id));
        if (!alive) return;
        setBook(item);
        fetchBookOffers(String(id))
          .then((group) => alive && setOffers(group))
          .catch(() => {});
      } catch {
        if (alive) setBook(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Do they own it already? Reading the content only works for owners.
  useEffect(() => {
    if (!token || !book) return;
    fetchBookContent(book.id, token)
      .then(() => setOwned(true))
      .catch(() => setOwned(false));
  }, [token, book]);

  if (loading) {
    return (
      <Page back>
        <View style={{ gap: 14, alignItems: 'center' }}>
          <Skeleton width={180} height={240} radius={16} />
          <Skeleton height={28} width="80%" />
          <Skeleton height={90} radius={16} />
        </View>
      </Page>
    );
  }
  if (!book) {
    return (
      <Page back>
        <EmptyState icon="book" title="This book could not be found">
          <Button label="All books" onPress={() => router.replace('/books')} />
        </EmptyState>
      </Page>
    );
  }

  const selectedOffer = offers?.options?.find((o) => o.id === option) || null;
  const price = selectedOffer?.price ?? book.price;
  const isPhysical = book.type === 'physical';
  const isDigital = book.type === 'digital' || book.type === 'bundle';
  const inCart = cartBookIds.includes(book.id);
  const order = selectedOffer
    ? { itemType: 'book_offer', itemId: book.id, offerOptionId: selectedOffer.id }
    : { itemType: 'book', itemId: book.id, amount: book.price, shippingAddress: { email: user?.email, phone: user?.phone } };

  const succeed = () => {
    haptics.success();
    setPending(null);
    setOwned(true);
    setJustBought(true);
  };

  const buy = async () => {
    setError('');
    let tk = token;
    if (!isSignedIn) {
      tk = await requireSignIn('Sign in to buy this book.');
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

  const footer = owned ? (
    <Footer>
      <Button size="lg" icon="book-open" label="Read now" onPress={() => router.push(`/book/${book.id}/read`)} />
    </Footer>
  ) : isDigital ? (
    <Footer>
      {pending ? (
        <Button size="lg" icon="refresh-cw" label="Check payment again" loading={paying} onPress={checkAgain} />
      ) : (
        <Row gap={10}>
          {!selectedOffer ? (
            <Button
              variant="secondary"
              size="lg"
              icon={inCart ? 'check' : 'shopping-bag'}
              label={inCart ? 'In cart' : 'Cart'}
              onPress={() => {
                haptics.select();
                toggleCartBook(book.id);
              }}
            />
          ) : null}
          <Button size="lg" label={`Buy · ${formatPriceCedi(price)}`} loading={paying} onPress={buy} style={{ flex: 1 }} />
        </Row>
      )}
    </Footer>
  ) : isPhysical ? (
    <Footer>
      <Button size="lg" icon="truck" label={`Request a hardcopy · ${formatPriceCedi(book.price)}`} onPress={() => setShowHardcopy(true)} />
    </Footer>
  ) : null;

  return (
    <>
      <Page
        back
        right={
          <RoundButton
            icon={isWishlisted(book.id) ? 'check' : 'heart'}
            label={isWishlisted(book.id) ? 'Remove from wishlist' : 'Add to wishlist'}
            onPress={() => {
              haptics.select();
              toggleWishlistBook(book.id);
            }}
          />
        }
        footer={footer}>
        <View style={{ gap: 20 }}>
          <Rise style={{ alignItems: 'center' }}>
            <View style={styles.cover}>
              {book.cover ? <Image source={{ uri: assetUrl(book.cover) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <Icon name="book" size={40} color={t.fgSubtle} />}
            </View>
          </Rise>
          <Rise index={1}>
            <Row gap={6} style={{ justifyContent: 'center' }}>
              <Badge label={BOOK_TYPE[book.type] || 'Book'} tone="brand" />
              {owned ? <Badge label="Owned" tone="up" icon="check" /> : null}
            </Row>
            <Txt size={24} weight="bold" center style={{ marginTop: 10, letterSpacing: -0.4, lineHeight: 30 }}>
              {book.title}
            </Txt>
            <Txt size={14} color={t.fgMuted} center style={{ marginTop: 4 }}>
              by {book.author}
            </Txt>
            {!owned ? (
              <Txt size={22} weight="bold" color={t.brand300} center tabular style={{ marginTop: 10 }}>
                {formatPriceCedi(price)}
              </Txt>
            ) : null}
          </Rise>

          {justBought ? (
            <Animated.View entering={ZoomIn.springify()}>
              <Alert tone="up" title="It's yours">
                Your book is ready to read in the app.
              </Alert>
            </Animated.View>
          ) : null}
          {error ? <Alert>{error}</Alert> : null}
          {pending ? (
            <Alert tone="warn" title="Waiting for your payment">
              {`${pending.message} You will not be charged twice. Reference: ${pending.reference}`}
            </Alert>
          ) : null}

          {offers?.options?.length && isDigital && !owned ? (
            <View>
              <SectionTitle title={offers.title || 'Bundle options'} />
              <Choice
                value={option}
                onChange={setOption}
                options={[
                  { value: 'single', label: 'Just this book', detail: formatPriceCedi(book.price), icon: 'book' },
                  ...offers.options.map((o) => ({ value: o.id, label: o.label, detail: `${formatPriceCedi(o.price)}${o.description ? ` · ${o.description}` : ''}`, icon: 'layers' })),
                ]}
              />
            </View>
          ) : null}

          {book.description ? (
            <View>
              <SectionTitle title="About this book" />
              <Txt size={15} color={t.fgMuted} style={{ lineHeight: 23 }}>
                {book.description}
              </Txt>
            </View>
          ) : null}

          {book.reviews?.length ? (
            <View>
              <SectionTitle title="What readers say" />
              <View style={{ gap: 10 }}>
                {book.reviews.slice(0, 5).map((r) => (
                  <View key={r.id} style={styles.review}>
                    <Txt size={14} color={t.fg} style={{ lineHeight: 21 }}>
                      {r.text}
                    </Txt>
                    <Txt size={12} color={t.fgSubtle} style={{ marginTop: 6 }}>
                      {r.user}
                    </Txt>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Page>
      <HardcopyRequestModal book={book} visible={showHardcopy} onClose={() => setShowHardcopy(false)} user={user} />
    </>
  );
}

const styles = StyleSheet.create({
  cover: { width: 180, aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' },
  review: { borderRadius: 16, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, padding: 14 },
});
