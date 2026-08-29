import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, radii, shadow, spacing } from '@/constants/theme';
import { formatPriceCedi } from '@/utils/format';

const TYPE_LABELS = {
  digital: 'E-book',
  physical: 'Hardcopy',
  bundle: 'Bundle',
};

export function BookCard({ book, variant = 'grid' }) {
  const router = useRouter();

  if (variant === 'featured') {
    return (
      <Pressable
        onPress={() => router.push(`/book/${book.id}`)}
        style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
        <LinearGradient
          colors={['#07152F', '#1246C4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredBg}>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredEyebrow}>Featured read</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.featuredAuthor} numberOfLines={1}>
              {book.author}
            </Text>
            <View style={styles.featuredMeta}>
              <View style={styles.ratingPillLight}>
                <FontAwesome name="star" size={10} color={colors.gold} />
                <Text style={styles.ratingTextLight}>{book.rating}</Text>
              </View>
              <Text style={styles.featuredPrice}>{formatPriceCedi(book.price)}</Text>
            </View>
          </View>
          <View style={styles.featuredCoverFrame}>
            {book.cover ? (
              <Image source={{ uri: book.cover }} style={styles.featuredCover} resizeMode="contain" />
            ) : (
              <View style={[styles.featuredCover, styles.coverFallback]}>
                <FontAwesome name="book" size={32} color={colors.muted} />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'row') {
    return (
      <Pressable
        onPress={() => router.push(`/book/${book.id}`)}
        style={({ pressed }) => [styles.rowCard, shadow.card, pressed && styles.pressed]}>
        <View style={styles.rowCoverWrap}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.rowCover} resizeMode="contain" />
          ) : (
            <View style={[styles.rowCover, styles.coverFallback]}>
              <FontAwesome name="book" size={22} color={colors.muted} />
            </View>
          )}
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.typeChip}>{TYPE_LABELS[book.type] || book.type}</Text>
          <Text numberOfLines={2} style={styles.rowTitle}>
            {book.title}
          </Text>
          <Text style={styles.rowAuthor} numberOfLines={1}>
            {book.author}
          </Text>
          <Text style={styles.rowPrice}>{formatPriceCedi(book.price)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/book/${book.id}`)}
      style={({ pressed }) => [styles.gridCard, shadow.card, pressed && styles.pressed]}>
      <LinearGradient
        colors={['#F8FAFD', '#EEF2F8']}
        style={styles.gridCoverStage}>
        <View style={styles.gridBadges}>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{TYPE_LABELS[book.type] || book.type}</Text>
          </View>
          <View style={styles.ratingPill}>
            <FontAwesome name="star" size={10} color={colors.star} />
            <Text style={styles.ratingText}>{book.rating}</Text>
          </View>
        </View>
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={styles.gridCover} resizeMode="contain" />
        ) : (
          <View style={[styles.gridCover, styles.coverFallback]}>
            <FontAwesome name="book" size={28} color={colors.muted} />
          </View>
        )}
      </LinearGradient>
      <View style={styles.gridBody}>
        <Text numberOfLines={2} style={styles.gridTitle}>
          {book.title}
        </Text>
        <Text style={styles.gridAuthor} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.gridFooter}>
          <Text style={styles.gridPrice}>{formatPriceCedi(book.price)}</Text>
          <View style={styles.shopBtn}>
            <Text style={styles.shopBtnText}>View</Text>
            <FontAwesome name="chevron-right" size={9} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
    borderRadius: radii.sm,
  },

  featured: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  featuredBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: 168,
    gap: spacing.md,
  },
  featuredCopy: { flex: 1 },
  featuredEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featuredTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  featuredAuthor: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 6,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  featuredPrice: {
    color: colors.gold,
    fontWeight: '800',
    fontSize: 16,
  },
  featuredCoverFrame: {
    width: 108,
    height: 148,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCover: {
    width: '100%',
    height: '100%',
  },

  gridCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  gridCoverStage: {
    height: 220,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBadges: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  typePill: {
    backgroundColor: 'rgba(7,21,47,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  typePillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  ratingPillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: colors.text },
  ratingTextLight: { fontSize: 11, fontWeight: '700', color: colors.white },
  gridCover: {
    width: '100%',
    height: '100%',
  },
  gridBody: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: 4,
  },
  gridTitle: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 19,
    minHeight: 38,
  },
  gridAuthor: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  gridPrice: {
    fontWeight: '800',
    fontSize: 15,
    color: colors.primary,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B5EF514',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  shopBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },

  rowCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowCoverWrap: {
    width: 96,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCover: { width: 72, height: 100 },
  rowBody: { flex: 1, padding: spacing.md, gap: 4 },
  typeChip: {
    alignSelf: 'flex-start',
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rowTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  rowAuthor: { color: colors.muted, fontSize: 12 },
  rowPrice: { fontWeight: '800', color: colors.primary, marginTop: 4 },
});
