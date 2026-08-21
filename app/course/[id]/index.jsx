import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getCourseById } from '@/data/courses';
import { getTutorById } from '@/data/tutors';
import { formatPriceCedi } from '@/utils/format';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isEnrolled, isSavedCourse, toggleSavedCourse } = useAppState();
  const course = getCourseById(String(id));
  const tutor = course ? getTutorById(course.tutorId) : null;

  if (!course || !tutor) {
    return (
      <Screen>
        <Text>Course not found.</Text>
      </Screen>
    );
  }

  const enrolled = isEnrolled(course.id);

  return (
    <Screen>
      <Image source={{ uri: course.thumbnail }} style={styles.hero} />
      <View style={styles.badges}>
        <Badge label={course.level} tone="accent" />
        <Badge label={course.category} tone="muted" />
      </View>
      <Text style={typography.h2}>{course.title}</Text>
      <Text style={[typography.caption, { marginTop: spacing.sm, lineHeight: 20 }]}>
        {course.description}
      </Text>

      <View style={styles.stats}>
        <Stat icon="star" label={`${course.rating} rating`} />
        <Stat icon="users" label={`${course.students} students`} />
        <Stat icon="clock-o" label={`${course.durationHours}h`} />
      </View>

      <Pressable style={styles.tutorRow} onPress={() => router.push(`/tutor/${tutor.id}`)}>
        <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tutorName}>{tutor.name}</Text>
          <Text style={typography.caption}>{tutor.title}</Text>
        </View>
        <Text style={styles.link}>View tutor</Text>
      </Pressable>

      <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        What you’ll get
      </Text>
      {course.materials.map((m) => (
        <Text key={m} style={styles.bullet}>
          • {m}
        </Text>
      ))}
      {course.hasCertificate ? (
        <Text style={styles.bullet}>• Certificate of completion</Text>
      ) : null}

      <View style={styles.actions}>
        {enrolled ? (
          <PrimaryButton
            label="Continue learning"
            onPress={() => router.push(`/learn/${course.id}`)}
          />
        ) : (
          <>
            <PrimaryButton
              label="Meet the tutor & preview"
              onPress={() => router.push(`/tutor/${tutor.id}?fromCourse=${course.id}`)}
            />
            <PrimaryButton
              label="Preview curriculum"
              variant="secondary"
              onPress={() => router.push(`/course/${course.id}/preview`)}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
        <PrimaryButton
          label={isSavedCourse(course.id) ? 'Saved' : 'Save course'}
          variant="ghost"
          onPress={() => toggleSavedCourse(course.id)}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <Text style={styles.price}>{formatPriceCedi(course.price)}</Text>
    </Screen>
  );
}

function Stat({ icon, label }) {
  return (
    <View style={styles.stat}>
      <FontAwesome name={icon} size={14} color={colors.primary} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  badges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  tutorRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  tutorName: { fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  bullet: { color: colors.text, marginBottom: 4, lineHeight: 20 },
  actions: { marginTop: spacing.xl },
  price: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
});
