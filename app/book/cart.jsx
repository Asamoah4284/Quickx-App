import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PaymentCheckout } from '@/components/checkout/PaymentCheckout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchBooks } from '@/utils/catalog';
import { initializePurchase } from '@/utils/payments';
import { formatPriceCedi } from '@/utils/format';

export default function BookCartScreen() {
  const router = useRouter();
  const { token, user, cartBookIds, clearCart } = useAppState();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const cartBooks = useMemo(
    () => books.filter((b) => cartBookIds.includes(b.id) && b.type === 'digital'),
    [books, cartBookIds]
  );
  const total = cartBooks.reduce((sum, b) => sum + Number(b.price || 0), 0);

  const onPay = async ({ phone, email, amount, referralCode, network, onPending }) => {
    if (!token) return;
    setPaying(true);
    try {
      await initializePurchase({
        token,
        itemType: 'book_cart',
        items: cartBooks.map((b) => b.id),
        amount,
        phone,
        email,
        referralCode,
        network,
        onPending,
      });
      clearCart();
      Alert.alert('Purchase successful', 'Your ebooks are ready in your library.', [
        { text: 'Browse books', onPress: () => router.replace('/(tabs)/books') },
      ]);
    } catch (error) {
      Alert.alert('Payment failed', error.message || 'Try again.');
    } finally {
      setPaying(false);
    }
  };

  if (!token || token === 'local') {
    return (
      <Screen>
        <Text style={typography.h2}>Cart</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.md }}>Sign in to checkout your cart.</Text>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!cartBooks.length) {
    return (
      <Screen>
        <Text style={typography.h2}>Cart</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.md }}>Add digital books to your cart from the store.</Text>
        <PrimaryButton label="Browse books" onPress={() => router.push('/(tabs)/books')} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={typography.h2}>Cart ({cartBooks.length})</Text>
      {cartBooks.map((book) => (
        <Pressable key={book.id} style={styles.row} onPress={() => router.push(`/book/${book.id}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.meta}>{book.author}</Text>
          </View>
          <Text style={styles.price}>{formatPriceCedi(book.price)}</Text>
        </Pressable>
      ))}
      <Text style={styles.total}>Total: {formatPriceCedi(total)}</Text>
      <PaymentCheckout title="Checkout cart" subtitle={`${cartBooks.length} ebook(s)`} price={total} user={user} paying={paying} onPay={onPay} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  price: { fontWeight: '800', color: colors.primary },
  total: { fontSize: 18, fontWeight: '800', color: colors.text, marginVertical: spacing.lg },
});
