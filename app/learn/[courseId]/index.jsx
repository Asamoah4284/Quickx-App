import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  fetchCourseFull,
  fetchCoursePreview,
  flattenCourseLessons,
} from '@/utils/catalog';
import { getCachedCourseFull } from '@/utils/courseCache';

export default function LearningAreaScreen() {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const { enrolledCourses, isEnrolled, token, grantCourseAccess } = useAppState();
  const courseKey = String(courseId);
  const [course, setCourse] = useState(() => getCachedCourseFull(courseKey));
  const [loading, setLoading] = useState(() => !getCachedCourseFull(courseKey));
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const cached = getCachedCourseFull(courseKey);
    if (cached) {
      setCourse(cached);
      setLoading(false);
      setDenied(false);
    } else {
      setLoading(true);
    }
    setDenied(false);
    try {
      if (token && token !== 'local') {
        try {
          const full = await fetchCourseFull(courseKey, token);
          setCourse(full);
          grantCourseAccess(courseKey);
          return;
        } catch (err) {
          if (!String(err.message || '').toLowerCase().includes('access')) throw err;
        }
      }
      if (isEnrolled(courseKey)) {
        const preview = await fetchCoursePreview(courseKey);
        setCourse(preview);
        return;
      }
      if (!cached) {
        setDenied(true);
        setCourse(null);
      }
    } catch {
      if (!cached) {
        setDenied(true);
        setCourse(null);
      }
    } finally {
      setLoading(false);
    }
  }, [courseKey, token, isEnrolled, grantCourseAccess]);

  useEffect(() => {
    load();
  }, [load]);

  const lessons = useMemo(() => flattenCourseLessons(course), [course]);
  const enrollment = course ? enrolledCourses[course.id] || { progress: {}, lastLessonId: null } : null;
  const completedIds = new Set([
    ...Object.keys(enrollment?.progress || {}).filter((k) => enrollment.progress[k]),
    ...((course?.enrollment?.completedLessonIds || []).map(String)),
  ]);
  const completed = lessons.filter((l) => completedIds.has(l.id)).length;
  const pct = course?.enrollment?.progressPercent
    ? Math.round(course.enrollment.progressPercent)
    : Math.round((completed / Math.max(lessons.length, 1)) * 100);
  const resumeId =
    enrollment?.lastLessonId ||
    lessons.find((l) => !completedIds.has(l.id))?.id ||
    lessons[0]?.id;

  if (loading && !course) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'My course' }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (denied || !course) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'My course' }} />
        <Text style={typography.h3}>You don’t have access yet</Text>
        <Text style={[typography.caption, { marginTop: spacing.sm, lineHeight: 20 }]}>
          Get Courses access to watch every lesson in this course.
        </Text>
        <PrimaryButton
          label="See how to get access"
          onPress={() => router.replace(`/course/${courseId}`)}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Learning area' }} />
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={styles.cover} />
      ) : null}
      <Text style={typography.h2}>{course.title}</Text>
      <Text style={[typography.caption, { marginTop: 4 }]}>
        {course.tutorName ? `${course.tutorName} · ` : ''}
        Learning area
      </Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Your progress · {pct}%</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
        </View>
        <Text style={typography.caption}>
          {completed}/{lessons.length} lessons complete
        </Text>
      </View>

      {resumeId ? (
        <PrimaryButton
          label="Continue watching"
          onPress={() => router.push(`/learn/${course.id}/lesson/${resumeId}`)}
          style={{ marginBottom: spacing.lg }}
        />
      ) : null}


      <Text style={[typography.h3, { marginBottom: spacing.md }]}>Curriculum</Text>
      {course.curriculum.map((mod) => (
        <View key={mod.id} style={styles.module}>
          <Text style={styles.moduleTitle}>{mod.title}</Text>
          {mod.lessons.map((lesson) => {
            const done = completedIds.has(lesson.id);
            return (
              <Pressable
                key={lesson.id}
                style={styles.lesson}
                onPress={() => router.push(`/learn/${course.id}/lesson/${lesson.id}`)}>
                <FontAwesome
                  name={done ? 'check-circle' : lesson.type === 'video' ? 'play-circle' : 'circle-o'}
                  size={18}
                  color={done ? colors.success : colors.primary}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
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
});
