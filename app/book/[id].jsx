import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PaymentCheckout } from '@/components/checkout/PaymentCheckout';
import { HardcopyRequestModal } from '@/components/books/HardcopyRequestModal';
import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchBookOffers, fetchBookPreview } from '@/utils/catalog';
import { initializePurchase } from '@/utils/payments';
import { formatPriceCedi } from '@/utils/format';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token, user, isWishlisted, toggleWishlistBook, toggleCartBook, cartBookIds } = useAppState();
  const [book, setBook] = useState(null);
  const [offers, setOffers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHardcopy, setShowHardcopy] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [paying, setPaying] = useState(false);
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const item = await fetchBookPreview(String(id));
        if (!alive) return;
        setBook(item);
        const offerGroup = await fetchBookOffers(String(id)).catch(() => null);
        if (alive) setOffers(offerGroup);
        if (token && token !== 'local') {
          try {
            const { fetchBookContent } = await import('@/utils/catalog');
            await fetchBookContent(String(id), token);
            if (alive) setOwned(true);
          } catch {
            if (alive) setOwned(false);
          }
        }
      } catch {
        if (alive) setBook(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, token]);

  const purchasePrice = selectedOffer?.price ?? book?.price ?? 0;
  const inCart = book ? cartBookIds.includes(book.id) : false;
  const isPhysical = book?.type === 'physical';
  const isDigital = book?.type === 'digital' || book?.type === 'bundle';

  const onPay = async ({ phone, email, amount, referralCode }) => {
    if (!book || !token) return;
    setPaying(true);
    try {
      if (selectedOffer) {
        await initializePurchase({
          token,
          itemType: 'book_offer',
          itemId: book.id,
          offerOptionId: selectedOffer.id,
          amount,
          phone,
          email,
          referralCode,
        });
      } else {
        await initializePurchase({
          token,
          itemType: 'book',
          itemId: book.id,
          amount,
          phone,
          email,
          referralCode,
        });
      }
      setOwned(true);
      setShowCheckout(false);
      Alert.alert('Purchase successful', 'Your book is ready to read.', [
        { text: 'Read now', onPress: () => router.push(`/book/${book.id}/read`) },
      ]);
    } catch (error) {
      Alert.alert('Payment failed', error.message || 'Try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!book) {
    return (
      <Screen>
        <Text>Book not found.</Text>
      </Screen>
    );
  }

  if (showCheckout) {
    return (
      <Screen>
        <PrimaryButton
          label="← Back to details"
          variant="ghost"
          onPress={() => setShowCheckout(false)}
          style={{ marginBottom: spacing.md }}
        />
        {!token || token === 'local' ? (
          <Text style={{ color: colors.muted }}>Sign in to purchase this book.</Text>
        ) : (
          <PaymentCheckout
            title="Buy book"
            subtitle={selectedOffer ? selectedOffer.label : book.title}
            price={purchasePrice}
            user={user}
            paying={paying}
            onPay={onPay}
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <Image source={book.cover ? { uri: book.cover } : undefined} style={styles.cover} />
      <Badge label={book.type} tone="muted" />
      <Text style={[typography.h2, { marginTop: spacing.sm }]}>{book.title}</Text>
      <Text style={typography.caption}>by {book.author}</Text>
      <Text style={[typography.body, { marginTop: spacing.lg, lineHeight: 22 }]}>
        {book.description}
      </Text>

      {offers?.options?.length ? (
        <View style={styles.offers}>
          <Text style={styles.offersTitle}>Bundle options</Text>
          {offers.options.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.offerRow, selectedOffer?.id === opt.id && styles.offerActive]}
              onPress={() => setSelectedOffer(opt)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerLabel}>{opt.label}</Text>
                {opt.description ? <Text style={styles.offerDesc}>{opt.description}</Text> : null}
              </View>
              <Text style={styles.offerPrice}>{formatPriceCedi(opt.price)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.price}>{formatPriceCedi(selectedOffer?.price ?? book.price)}</Text>

      {owned ? (
        <>
          <PrimaryButton label="Read book" onPress={() => router.push(`/book/${book.id}/read`)} />
          <PrimaryButton label="Owned" disabled variant="secondary" style={{ marginTop: spacing.sm }} />
        </>
      ) : (
        <>
          {isDigital ? (
            <PrimaryButton
              label={`Buy · ${formatPriceCedi(selectedOffer?.price ?? book.price)}`}
              onPress={() => {
                if (!token || token === 'local') {
                  Alert.alert('Sign in required', 'Sign in to purchase this book.');
                  return;
                }
                setShowCheckout(true);
              }}
            />
          ) : null}
          {isPhysical ? (
            <PrimaryButton
              label="Request hardcopy"
              onPress={() => setShowHardcopy(true)}
            />
          ) : null}
          {isDigital && !owned ? (
            <PrimaryButton
              label={inCart ? 'In cart' : 'Add to cart'}
              variant="secondary"
              onPress={() => toggleCartBook(book.id)}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </>
      )}
      <PrimaryButton
        label={isWishlisted(book.id) ? 'In wishlist' : 'Add to wishlist'}
        variant="secondary"
        onPress={() => toggleWishlistBook(book.id)}
        style={{ marginTop: spacing.sm }}
      />
      <HardcopyRequestModal
        book={book}
        visible={showHardcopy}
        onClose={() => setShowHardcopy(false)}
        user={user}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: {
    width: '100%',
    height: 220,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  offers: { marginTop: spacing.xl, marginBottom: spacing.md },
  offersTitle: { fontWeight: '800', marginBottom: spacing.sm, color: colors.text },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  offerActive: { borderColor: colors.primary, backgroundColor: '#F6F9FF' },
  offerLabel: { fontWeight: '700', color: colors.text },
  offerDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  offerPrice: { fontWeight: '800', color: colors.primary },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
});
