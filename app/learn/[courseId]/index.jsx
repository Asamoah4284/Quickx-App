import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { flattenLessons, getCourseById } from '@/data/courses';

export default function LearningAreaScreen() {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const { enrolledCourses, isEnrolled } = useAppState();
  const course = getCourseById(String(courseId));

  if (!course) {
    return (
      <Screen>
        <Text>Course not found.</Text>
      </Screen>
    );
  }

  if (!isEnrolled(course.id)) {
    return (
      <Screen>
        <Text style={typography.h3}>You’re not enrolled yet</Text>
        <PrimaryButton
          label="Preview & subscribe"
          onPress={() => router.replace(`/course/${course.id}/preview`)}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    );
  }

  const enrollment = enrolledCourses[course.id] || { progress: {}, lastLessonId: null };
  const lessons = flattenLessons(course);
  const completed = lessons.filter((l) => enrollment.progress[l.id]).length;
  const pct = Math.round((completed / Math.max(lessons.length, 1)) * 100);
  const resumeId = enrollment.lastLessonId || lessons[0]?.id;

  return (
    <Screen>
      <Text style={typography.h2}>{course.title}</Text>
      <Text style={[typography.caption, { marginTop: 4 }]}>Learning area</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Progress · {pct}%</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={typography.caption}>
          {completed}/{lessons.length} lessons complete
        </Text>
      </View>

      {resumeId ? (
        <PrimaryButton
          label="Resume where you stopped"
          onPress={() => router.push(`/learn/${course.id}/lesson/${resumeId}`)}
          style={{ marginBottom: spacing.lg }}
        />
      ) : null}

      {pct === 100 && course.hasCertificate ? (
        <View style={styles.cert}>
          <FontAwesome name="certificate" size={22} color={colors.warning} />
          <Text style={styles.certText}>Certificate unlocked — mock certificate ready</Text>
        </View>
      ) : null}

      <Text style={[typography.h3, { marginBottom: spacing.md }]}>Modules</Text>
      {course.curriculum.map((mod) => (
        <View key={mod.id} style={styles.module}>
          <Text style={styles.moduleTitle}>{mod.title}</Text>
          {mod.lessons.map((lesson) => {
            const done = enrollment.progress[lesson.id];
            return (
              <Pressable
                key={lesson.id}
                style={styles.lesson}
                onPress={() => router.push(`/learn/${course.id}/lesson/${lesson.id}`)}>
                <FontAwesome
                  name={done ? 'check-circle' : 'circle-o'}
                  size={18}
                  color={done ? colors.success : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Badge
                    label={lesson.type}
                    tone={lesson.type === 'quiz' ? 'warning' : 'muted'}
                    style={{ marginTop: 4 }}
                  />
                </View>
                <FontAwesome name="chevron-right" size={12} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      ))}

      <Text style={[typography.h3, { marginTop: spacing.lg }]}>Downloadable materials</Text>
      {course.materials.map((m) => (
        <View key={m} style={styles.material}>
          <FontAwesome name="download" size={14} color={colors.primary} />
          <Text style={styles.materialText}>{m} (mock)</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    marginVertical: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  progressLabel: { fontWeight: '700', color: colors.text },
  barTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primary },
  cert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F69C081A',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  certText: { flex: 1, fontWeight: '600', color: colors.text },
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
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  lessonTitle: { color: colors.text, fontWeight: '600' },
  material: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  materialText: { color: colors.primary, fontWeight: '600' },
});
