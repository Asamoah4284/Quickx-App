import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, radii, shadow, spacing } from '@/constants/theme';

export function TutorCard({ tutor }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/tutor/${tutor.id}`)}
      style={[styles.card, shadow.card]}>
      <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
      <View style={styles.body}>
        <Text style={styles.name}>{tutor.name}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {tutor.title}
        </Text>
        <View style={styles.meta}>
          <FontAwesome name="star" size={12} color={colors.star} />
          <Text style={styles.metaText}>{tutor.rating}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{tutor.students} students</Text>
        </View>
        <Text style={styles.expertise} numberOfLines={1}>
          {tutor.expertise.join(' · ')}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  body: { flex: 1, gap: 2 },
  name: { fontWeight: '700', fontSize: 16, color: colors.text },
  title: { color: colors.muted, fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: colors.muted },
  dot: { color: colors.muted },
  expertise: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' },
});
