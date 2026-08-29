import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getBookById } from '@/data/books';
import { fetchBookPreview } from '@/utils/catalog';
import { formatPriceCedi } from '@/utils/format';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { buyBook, isBookOwned, isWishlisted, toggleWishlistBook } = useAppState();
  const mock = getBookById(String(id));
  const [book, setBook] = useState(mock || null);
  const [loading, setLoading] = useState(!mock);

  useEffect(() => {
    if (mock) return undefined;
    let alive = true;
    fetchBookPreview(String(id))
      .then((item) => {
        if (alive) setBook(item);
      })
      .catch(() => {
        if (alive) setBook(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, mock]);

  if (loading) {
    return (
      <Screen>
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

  const owned = isBookOwned(book.id);

  const onBuy = () => {
    const ok = buyBook(book);
    if (!ok) {
      Alert.alert('Insufficient balance', 'Top up your QuickX Wallet first.');
      return;
    }
    Alert.alert(
      'Purchase successful',
      book.type === 'physical' || book.type === 'bundle'
        ? 'Order placed. Track it from Wallet → Orders (mock).'
        : 'Digital book added to your library.'
    );
  };

  return (
    <Screen>
      <Image source={book.cover ? { uri: book.cover } : undefined} style={styles.cover} />
      <Badge label={book.type} tone="muted" />
      <Text style={[typography.h2, { marginTop: spacing.sm }]}>{book.title}</Text>
      <Text style={typography.caption}>by {book.author}</Text>
      <Text style={[typography.body, { marginTop: spacing.lg, lineHeight: 22 }]}>
        {book.description}
      </Text>

      {book.preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={typography.caption}>{book.preview}</Text>
        </View>
      ) : null}

      {(book.reviews || []).length ? (
        <>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Reviews</Text>
          {book.reviews.map((r) => (
            <View key={r.id} style={{ marginBottom: spacing.md }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {r.user} · {r.rating}★
              </Text>
              <Text style={typography.caption}>{r.text}</Text>
            </View>
          ))}
        </>
      ) : null}

      <Text style={styles.price}>{formatPriceCedi(book.price)}</Text>

      {owned ? (
        <PrimaryButton label="Owned" disabled />
      ) : (
        <PrimaryButton label={`Buy · ${formatPriceCedi(book.price)}`} onPress={onBuy} />
      )}
      <PrimaryButton
        label={isWishlisted(book.id) ? 'In wishlist' : 'Add to wishlist'}
        variant="secondary"
        onPress={() => toggleWishlistBook(book.id)}
        style={{ marginTop: spacing.sm }}
      />
      {book.tutorId ? (
        <PrimaryButton
          label="View author / tutor"
          variant="ghost"
          onPress={() => router.push(`/tutor/${book.tutorId}`)}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 220,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  preview: {
    marginVertical: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: { fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
});
