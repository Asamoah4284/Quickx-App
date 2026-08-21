import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { colors, radii, shadow, spacing } from '@/constants/theme';

export function CourseCard({ course, horizontal = false }) {
  const router = useRouter();
  const priceLabel = course.price === 0 ? 'Free' : `₵${course.price}`;

  return (
    <Pressable
      onPress={() => router.push(`/course/${course.id}`)}
      style={[styles.card, horizontal && styles.horizontal, shadow.card]}>
      <Image source={{ uri: course.thumbnail }} style={[styles.image, horizontal && styles.imageH]} />
      <View style={styles.body}>
        <Badge label={course.level} tone="accent" />
        <Text numberOfLines={2} style={styles.title}>
          {course.title}
        </Text>
        <View style={styles.meta}>
          <FontAwesome name="star" size={12} color={colors.star} />
          <Text style={styles.metaText}>{course.rating}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{course.students} students</Text>
        </View>
        <Text style={styles.price}>{priceLabel}</Text>
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
  },
  horizontal: {
    width: 240,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.border,
  },
  imageH: {
    height: 110,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    minHeight: 40,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.muted,
  },
  dot: { color: colors.muted },
  price: {
    marginTop: spacing.xs,
    fontWeight: '700',
    color: colors.primary,
    fontSize: 15,
  },
});
