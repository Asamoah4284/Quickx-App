import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { colors, radii, spacing } from '@/constants/theme';

export function CourseCard({ course, horizontal = false, featured = false, subtitle, layout }) {
  const router = useRouter();
  const priceLabel = course.price === 0 ? 'Free' : `₵${course.price}`;
  const isRow = layout === 'row';
  const compact = horizontal && !featured && !isRow;

  if (isRow) {
    return (
      <Pressable onPress={() => router.push(`/course/${course.id}`)} style={styles.rowCard}>
        <Image source={{ uri: course.thumbnail }} style={styles.rowImage} />
        <View style={styles.rowBody}>
          <Text numberOfLines={2} style={styles.rowTitle}>
            {course.title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.rowSubtitle}>
              {subtitle}
            </Text>
          ) : null}
          <View style={styles.rowMeta}>
            <FontAwesome name="star" size={11} color={colors.star} />
            <Text style={styles.metaText}>{course.ratingLabel || course.rating}</Text>
            {course.durationHours ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.metaText}>{course.durationHours}h</Text>
              </>
            ) : null}
            {course.level ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.metaText}>{course.level}</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.rowPrice}>{priceLabel}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/course/${course.id}`)}
      style={[
        styles.card,
        horizontal && styles.horizontal,
        featured && styles.featured,
      ]}>
      <Image
        source={course.thumbnail ? { uri: course.thumbnail } : undefined}
        style={[
          styles.image,
          compact && styles.imageH,
          featured && styles.imageFeatured,
        ]}
      />
      <View style={[styles.body, compact && styles.bodyCompact]}>
        <View style={styles.badgeRow}>
          <Badge label={course.level} tone="accent" />
        </View>
        <Text
          numberOfLines={2}
          style={[styles.title, compact && styles.titleCompact, featured && styles.titleFeatured]}>
          {course.title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.meta}>
            <FontAwesome name="star" size={11} color={colors.star} />
            <Text style={styles.metaText}>{course.ratingLabel || course.rating}</Text>
          </View>
          <Text style={[styles.price, compact && styles.priceCompact]}>{priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  horizontal: {
    width: 188,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  featured: {
    marginBottom: 0,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.border,
  },
  imageH: {
    height: 92,
  },
  imageFeatured: {
    height: 148,
  },
  body: {
    padding: spacing.lg,
    gap: 6,
  },
  bodyCompact: {
    padding: spacing.md,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    minHeight: 40,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 13,
    minHeight: 34,
    lineHeight: 17,
  },
  titleFeatured: {
    fontSize: 17,
    minHeight: undefined,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    color: colors.muted,
  },
  price: {
    fontWeight: '800',
    color: colors.primary,
    fontSize: 16,
  },
  priceCompact: {
    fontSize: 13,
  },
  rowCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 10,
    gap: 12,
  },
  rowImage: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  rowBody: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  rowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  rowPrice: {
    marginTop: 6,
    fontWeight: '800',
    color: colors.primary,
    fontSize: 14,
  },
});
