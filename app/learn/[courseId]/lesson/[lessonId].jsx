import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { flattenLessons, getCourseById } from '@/data/courses';

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams();
  const router = useRouter();
  const { markLessonComplete, setLastLesson, enrolledCourses } = useAppState();
  const course = getCourseById(String(courseId));
  const lessons = course ? flattenLessons(course) : [];
  const lesson = lessons.find((l) => l.id === String(lessonId));
  const idx = lessons.findIndex((l) => l.id === String(lessonId));
  const done = enrolledCourses[String(courseId)]?.progress?.[String(lessonId)];

  if (!course || !lesson) {
    return (
      <Screen>
        <Text>Lesson not found.</Text>
      </Screen>
    );
  }

  const onComplete = () => {
    markLessonComplete(course.id, lesson.id);
    if (lesson.type === 'quiz') {
      Alert.alert('Quiz complete', 'Mock score: 80%. Keep going!');
    }
  };

  const onOpen = () => setLastLesson(course.id, lesson.id);

  // mark as last viewed when opening
  if (!done) {
    // intentional no-op in render; call via button / effect pattern avoided for simplicity
  }

  const next = lessons[idx + 1];

  return (
    <Screen>
      <Text style={typography.caption}>
        {lesson.moduleTitle} · {lesson.type}
      </Text>
      <Text style={[typography.h2, { marginTop: spacing.xs }]}>{lesson.title}</Text>
      <Text style={[typography.caption, { marginTop: spacing.sm }]}>
        Duration · {lesson.durationMins} min
      </Text>

      <View style={styles.player}>
        <Text style={styles.playerText}>
          {lesson.type === 'video'
            ? 'Video player placeholder'
            : lesson.type === 'quiz'
              ? 'Quiz placeholder — answer mock questions'
              : 'Material preview placeholder'}
        </Text>
      </View>

      <Text style={[typography.body, { lineHeight: 22, marginBottom: spacing.xl }]}>
        This is mock lesson content for QuickXLearn. In production this would stream video,
        render quizzes, or open downloadable files.
      </Text>

      <PrimaryButton
        label={done ? 'Completed' : 'Mark complete'}
        onPress={() => {
          onOpen();
          onComplete();
        }}
        disabled={done}
      />

      {next ? (
        <PrimaryButton
          label="Next lesson"
          variant="secondary"
          style={{ marginTop: spacing.sm }}
          onPress={() => {
            setLastLesson(course.id, next.id);
            router.replace(`/learn/${course.id}/lesson/${next.id}`);
          }}
        />
      ) : (
        <PrimaryButton
          label="Back to learning area"
          variant="secondary"
          style={{ marginTop: spacing.sm }}
          onPress={() => router.replace(`/learn/${course.id}`)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: {
    marginVertical: spacing.xl,
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  playerText: {
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
});
