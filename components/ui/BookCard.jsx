import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { colors, radii, shadow, spacing } from '@/constants/theme';

export function BookCard({ book, horizontal = false }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/book/${book.id}`)}
      style={[styles.card, horizontal && styles.horizontal, shadow.card]}>
      <Image source={{ uri: book.cover }} style={[styles.cover, horizontal && styles.coverH]} />
      <View style={styles.body}>
        <Badge label={book.type} tone="muted" />
        <Text numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.meta}>
          <FontAwesome name="star" size={12} color={colors.star} />
          <Text style={styles.metaText}>{book.rating}</Text>
        </View>
        <Text style={styles.price}>₵{book.price}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  horizontal: {
    width: 220,
    marginRight: spacing.md,
    marginBottom: 0,
    flexDirection: 'column',
  },
  cover: {
    width: 90,
    height: 120,
    backgroundColor: colors.border,
  },
  coverH: {
    width: '100%',
    height: 120,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  author: { color: colors.muted, fontSize: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.muted },
  price: { fontWeight: '700', color: colors.primary, marginTop: 4 },
});
