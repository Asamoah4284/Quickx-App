import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LessonVideoPlayer } from '@/components/learn/LessonVideoPlayer';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  fetchCourseFull,
  fetchCoursePreview,
  flattenCourseLessons,
  updateCourseProgress,
} from '@/utils/catalog';
import { getCachedCourseFull } from '@/utils/courseCache';

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);
  const { markLessonComplete, setLastLesson, enrolledCourses, token, isEnrolled } = useAppState();
  const courseKey = String(courseId);
  const [course, setCourse] = useState(() => getCachedCourseFull(courseKey));
  const [loading, setLoading] = useState(() => !getCachedCourseFull(courseKey));

  const goToLearningArea = useCallback(() => {
    allowLeaveRef.current = true;
    router.replace(`/learn/${courseKey}`);
  }, [courseKey, router]);

  const goToLesson = useCallback(
    (targetLessonId) => {
      allowLeaveRef.current = true;
      router.replace(`/learn/${courseKey}/lesson/${targetLessonId}`);
    },
    [courseKey, router]
  );

  useEffect(() => {
    const onHardwareBack = () => {
      goToLearningArea();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [goToLearningArea]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current) return;
      const type = e.data?.action?.type;
      if (type === 'GO_BACK' || type === 'POP') {
        e.preventDefault();
        goToLearningArea();
      }
    });
    return unsub;
  }, [navigation, goToLearningArea]);

  const load = useCallback(async () => {
    const cached = getCachedCourseFull(courseKey);
    if (cached) {
      setCourse(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      if (token && token !== 'local') {
        try {
          setCourse(await fetchCourseFull(courseKey, token));
          return;
        } catch {
          // fall through to preview for free lessons
        }
      }
      setCourse(await fetchCoursePreview(courseKey));
    } catch {
      if (!cached) setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseKey, token]);

  useEffect(() => {
    load();
  }, [load]);

  const lessons = useMemo(() => flattenCourseLessons(course), [course]);
  const lesson = lessons.find((l) => l.id === String(lessonId));
  const idx = lessons.findIndex((l) => l.id === String(lessonId));
  const done = enrolledCourses[courseKey]?.progress?.[String(lessonId)];
  const next = lessons[idx + 1];
  const prev = lessons[idx - 1];

  useEffect(() => {
    if (course?.id && lesson?.id) setLastLesson(course.id, lesson.id);
  }, [course?.id, lesson?.id, setLastLesson]);

  const onComplete = async () => {
    if (!course || !lesson) return;
    markLessonComplete(course.id, lesson.id);
    if (token && token !== 'local' && isEnrolled(course.id)) {
      const completed = Object.keys(enrolledCourses[course.id]?.progress || {}).length + (done ? 0 : 1);
      const pct = Math.round((completed / Math.max(lessons.length, 1)) * 100);
      try {
        await updateCourseProgress(course.id, token, {
          progressPercent: pct,
          completedLessonId: lesson.id,
        });
      } catch {
        // local progress still saved
      }
    }
    if (lesson.type === 'quiz') {
      Alert.alert('Quiz complete', 'Nice work — keep going!');
    }
  };

  if (loading && !course) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Lesson', headerShown: false }} />
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingHint}>Opening lesson…</Text>
      </View>
    );
  }

  if (!course || !lesson) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Lesson', headerShown: false }} />
        <Text style={styles.missing}>Lesson not found.</Text>
      </View>
    );
  }

  const canPlay = Boolean(lesson.videoUrl);
  const subtitle = [lesson.moduleTitle, lesson.sectionTitle].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {canPlay ? (
          <LessonVideoPlayer
            uri={lesson.videoUrl}
            posterUri={course.thumbnail}
            title={lesson.title}
            subtitle={course.title}
            lessonIndex={idx + 1}
            lessonTotal={lessons.length}
          />
        ) : (
          <View style={styles.placeholderShell}>
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <FontAwesome
                  name={lesson.isLocked ? 'lock' : lesson.type === 'quiz' ? 'question' : 'file-text-o'}
                  size={22}
                  color={colors.white}
                />
              </View>
              <Text style={styles.placeholderText}>
                {lesson.isLocked
                  ? 'This lesson is locked. Buy the course to watch.'
                  : lesson.type === 'quiz'
                    ? 'Quiz lesson — mark complete when finished.'
                    : lesson.textContent
                      ? 'Reading lesson'
                      : 'No video available for this lesson yet.'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.body}>
          <Pressable style={styles.backRow} onPress={goToLearningArea}>
            <FontAwesome name="chevron-left" size={12} color={colors.primary} />
            <Text style={styles.backText}>Learning area</Text>
          </Pressable>

          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{lesson.type}</Text>
            </View>
            {lesson.durationLabel || lesson.durationMins ? (
              <Text style={styles.metaText}>
                {lesson.durationLabel || `${lesson.durationMins} min`}
              </Text>
            ) : null}
            {done ? (
              <View style={[styles.pill, styles.pillDone]}>
                <FontAwesome name="check" size={10} color={colors.success} />
                <Text style={[styles.pillText, { color: colors.success }]}>Done</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {subtitle ? <Text style={styles.lessonSub}>{subtitle}</Text> : null}

          {lesson.description || lesson.textContent ? (
            <Text style={styles.copy}>{lesson.description || lesson.textContent}</Text>
          ) : null}

          <View style={styles.navRow}>
            <Pressable
              style={[styles.navChip, !prev && styles.navChipDisabled]}
              disabled={!prev}
              onPress={() => {
                if (!prev) return;
                setLastLesson(course.id, prev.id);
                goToLesson(prev.id);
              }}>
              <FontAwesome name="step-backward" size={12} color={prev ? colors.navy : colors.muted} />
              <Text style={[styles.navChipText, !prev && { color: colors.muted }]}>Previous</Text>
            </Pressable>
            <Pressable
              style={[styles.navChip, !next && styles.navChipDisabled]}
              disabled={!next}
              onPress={() => {
                if (!next) return;
                setLastLesson(course.id, next.id);
                goToLesson(next.id);
              }}>
              <Text style={[styles.navChipText, !next && { color: colors.muted }]}>Next</Text>
              <FontAwesome name="step-forward" size={12} color={next ? colors.navy : colors.muted} />
            </Pressable>
          </View>

          <PrimaryButton
            label={done ? 'Completed' : 'Mark complete'}
            onPress={onComplete}
            disabled={done || lesson.isLocked}
            style={{ marginTop: spacing.lg }}
          />

          {next ? (
            <PrimaryButton
              label="Continue to next lesson"
              variant="secondary"
              style={{ marginTop: spacing.sm }}
              onPress={() => {
                setLastLesson(course.id, next.id);
                goToLesson(next.id);
              }}
            />
          ) : (
            <PrimaryButton
              label="Back to course"
              variant="secondary"
              style={{ marginTop: spacing.sm }}
              onPress={goToLearningArea}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050B18' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  loadingHint: { color: colors.muted, fontWeight: '600' },
  missing: { color: colors.muted, fontWeight: '600' },
  scroll: { paddingBottom: spacing.xxxl, flexGrow: 1 },
  placeholderShell: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: '#050B18',
  },
  placeholder: {
    aspectRatio: 16 / 9,
    borderRadius: radii.xl,
    backgroundColor: colors.navyMid,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  placeholderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  body: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    minHeight: 420,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B5EF514',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  pillDone: { backgroundColor: '#1EBE5714' },
  pillText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  metaText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  lessonTitle: {
    ...typography.h2,
    letterSpacing: -0.4,
  },
  lessonSub: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  copy: {
    marginTop: spacing.lg,
    color: colors.text,
    lineHeight: 22,
    fontSize: 15,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  navChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  navChipDisabled: { opacity: 0.55 },
  navChipText: { color: colors.navy, fontWeight: '700', fontSize: 13 },
});
