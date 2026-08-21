import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getCourseById } from '@/data/courses';
import { getTutorById } from '@/data/tutors';
import { formatPriceCedi } from '@/utils/format';

export default function CoursePreviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isEnrolled } = useAppState();
  const course = getCourseById(String(id));
  const tutor = course ? getTutorById(course.tutorId) : null;

  if (!course || !tutor) {
    return (
      <Screen>
        <Text>Course not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={typography.h2}>Course preview</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs }]}>{course.title}</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        by {tutor.name} · {course.students} students · {formatPriceCedi(course.price)}
      </Text>

      <Text style={[typography.h3, { marginBottom: spacing.md }]}>Curriculum</Text>
      {course.curriculum.map((mod) => (
        <View key={mod.id} style={styles.module}>
          <Text style={styles.moduleTitle}>{mod.title}</Text>
          {mod.lessons.map((lesson) => (
            <View key={lesson.id} style={styles.lesson}>
              <FontAwesome
                name={lesson.type === 'quiz' ? 'question-circle' : lesson.type === 'material' ? 'file-text-o' : 'play-circle'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.mins}>{lesson.durationMins}m</Text>
            </View>
          ))}
        </View>
      ))}

      <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
        Reviews
      </Text>
      {course.reviews.map((r) => (
        <View key={r.id} style={styles.review}>
          <Text style={styles.reviewUser}>
            {r.user} · {r.rating}★
          </Text>
          <Text style={typography.caption}>{r.text}</Text>
        </View>
      ))}

      {isEnrolled(course.id) ? (
        <PrimaryButton
          label="Go to learning area"
          onPress={() => router.push(`/learn/${course.id}`)}
          style={{ marginTop: spacing.xl }}
        />
      ) : (
        <PrimaryButton
          label={`Subscribe · ${formatPriceCedi(course.price)}`}
          onPress={() => router.push(`/course/${course.id}/checkout`)}
          style={{ marginTop: spacing.xl }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  module: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moduleTitle: { fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  lessonTitle: { flex: 1, color: colors.text, fontSize: 14 },
  mins: { color: colors.muted, fontSize: 12 },
  review: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewUser: { fontWeight: '700', marginBottom: 4, color: colors.text },
});
