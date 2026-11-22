import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonRow, lessonMeta } from '@/components/learn/LessonRow';
import { LessonVideoPlayer } from '@/components/learn/LessonVideoPlayer';
import { Badge, Button, Card, IconBox, Loading, ProgressBar, Row, Txt } from '@/components/ui/kit';
import { BackButton } from '@/components/ui/Page';
import { layout, radii, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCourseFull, fetchCoursePreview, flattenCourseLessons, updateCourseProgress } from '@/utils/catalog';
import { getCachedCourseFull } from '@/utils/courseCache';
import { haptics } from '@/utils/haptics';
import { downloadLesson, formatBytes, getOfflineLesson, offlineSupported, removeOfflineLesson } from '@/utils/offlineLessons';
import { themed } from '@/utils/themedStyles';

/** Back button, course name and "Lesson 3 of 12", under the status bar. */
function TopBar({ onBack, course, position }) {
  return (
    <View style={styles.bar}>
      <BackButton onPress={onBack} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={14} weight="semibold" numberOfLines={1}>
          {course || 'Lesson'}
        </Txt>
        {position ? (
          <Txt size={12} color={t.fgSubtle} tabular>
            {position}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/** Shown in place of the video for quizzes, reading lessons and locked lessons. */
function NoVideo({ lesson }) {
  const [icon, text] = lesson.isLocked
    ? ['lock', 'This lesson is locked. Get the course to watch it.']
    : lesson.type === 'quiz'
      ? ['help-circle', 'Quiz lesson. Mark it complete when you finish.']
      : lesson.textContent
        ? ['book-open', 'Reading lesson. The text is below.']
        : ['film', 'There is no video for this lesson yet.'];
  return (
    <View style={styles.noVideo}>
      <IconBox name={icon} size={52} tone={lesson.isLocked ? 'warn' : 'brand'} />
      <Txt size={14} weight="semibold" center color={t.fgMuted} style={{ maxWidth: 260 }}>
        {text}
      </Txt>
    </View>
  );
}

export default function LessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const allowLeaveRef = useRef(false);
  const { markLessonComplete, setLastLesson, enrolledCourses, token, isEnrolled, user } = useAppState();
  const courseKey = String(courseId);
  const [course, setCourse] = useState(() => getCachedCourseFull(courseKey));
  const [loading, setLoading] = useState(() => !getCachedCourseFull(courseKey));
  const [offline, setOffline] = useState(null);
  const [downloadPct, setDownloadPct] = useState(null); // null = idle, 0..1 = downloading
  const userId = user?.id || user?._id;

  useEffect(() => {
    let alive = true;
    getOfflineLesson(courseKey, String(lessonId), userId).then((entry) => alive && setOffline(entry));
    return () => {
      alive = false;
    };
  }, [courseKey, lessonId, userId]);

  const onDownload = async () => {
    setDownloadPct(0);
    try {
      const entry = await downloadLesson({
        courseId: courseKey,
        lessonId: String(lessonId),
        token,
        userId,
        onProgress: (p) => setDownloadPct(p),
      });
      setOffline(entry);
      haptics.success();
    } catch (error) {
      haptics.error();
      Alert.alert('Download unavailable', error.message || 'Downloads need Courses access.');
    } finally {
      setDownloadPct(null);
    }
  };

  const onRemoveDownload = () =>
    Alert.alert('Remove download?', 'You will need internet to watch this lesson again.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeOfflineLesson(courseKey, String(lessonId));
          setOffline(null);
        },
      },
    ]);

  // Lessons replace each other, so "back" always means the course's lesson list.
  const goToLearningArea = useCallback(() => {
    allowLeaveRef.current = true;
    router.replace(`/learn/${courseKey}`);
  }, [courseKey, router]);

  const goToLesson = useCallback(
    (target) => {
      if (!target) return;
      allowLeaveRef.current = true;
      setLastLesson(courseKey, target.id);
      router.replace(`/learn/${courseKey}/lesson/${target.id}`);
    },
    [courseKey, router, setLastLesson]
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToLearningArea();
      return true;
    });
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
          // fall through to the preview for free lessons
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
  const progress = enrolledCourses[courseKey]?.progress || {};
  const doneIds = new Set([
    ...Object.keys(progress).filter((k) => progress[k]),
    ...(course?.enrollment?.completedLessonIds || []).map(String),
  ]);
  const done = doneIds.has(String(lessonId));
  const doneCount = lessons.filter((l) => doneIds.has(l.id)).length;
  const next = lessons[idx + 1];
  const prev = lessons[idx - 1];
  const upNext = lessons.slice(idx + 1, idx + 4);

  useEffect(() => {
    if (course?.id && lesson?.id) setLastLesson(course.id, lesson.id);
  }, [course?.id, lesson?.id, setLastLesson]);

  const onComplete = async () => {
    if (!course || !lesson) return;
    haptics.success();
    markLessonComplete(course.id, lesson.id);
    if (token && token !== 'local' && isEnrolled(course.id)) {
      const pct = Math.round(((doneCount + (done ? 0 : 1)) / Math.max(lessons.length, 1)) * 100);
      try {
        await updateCourseProgress(course.id, token, { progressPercent: pct, completedLessonId: lesson.id });
      } catch {
        // progress is still saved on the phone
      }
    }
  };

  const frame = (content, bar = {}) => (
    <View style={styles.root}>
      <StatusBar style={t.statusBar} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <TopBar onBack={goToLearningArea} {...bar} />
        {content}
      </SafeAreaView>
    </View>
  );

  if (loading && !course) return frame(<Loading label="Opening lesson" />);

  if (!course || !lesson) {
    return frame(
      <View style={styles.side}>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <IconBox name="alert-circle" tone="warn" />
          <Txt size={16} weight="semibold" center>
            We could not find this lesson
          </Txt>
          <Button label="Back to the course" variant="secondary" onPress={goToLearningArea} />
        </Card>
      </View>,
      { course: course?.title }
    );
  }

  // A saved copy plays without internet; otherwise stream.
  const videoUri = offline?.uri || lesson.videoUrl;
  const subtitle = [lesson.moduleTitle, lesson.sectionTitle].filter(Boolean).join(' · ');
  const body = lesson.description || lesson.textContent;
  const canDownload = offlineSupported && token && token !== 'local' && !lesson.isLocked && lesson.videoUrl;

  return frame(
    <>
      <View style={styles.side}>{videoUri && !lesson.isLocked ? <LessonVideoPlayer uri={videoUri} /> : <NoVideo lesson={lesson} />}</View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Badge label={lessonMeta(lesson)} tone="brand" icon={lesson.type === 'video' ? 'play' : lesson.type === 'quiz' ? 'help-circle' : 'book-open'} />
          {done ? <Badge label="Completed" tone="up" icon="check" /> : null}
          {offline ? <Badge label="Saved offline" tone="neutral" icon="download" /> : null}
        </Row>

        <Txt size={22} weight="bold" style={{ marginTop: 12, letterSpacing: -0.4, lineHeight: 28 }}>
          {lesson.title}
        </Txt>
        {subtitle ? (
          <Txt size={13} color={t.fgMuted} style={{ marginTop: 4 }}>
            {subtitle}
          </Txt>
        ) : null}

        <View style={styles.progress}>
          <Row justify="space-between">
            <Txt size={12} weight="semibold" color={t.fgMuted}>
              Course progress
            </Txt>
            <Txt size={12} weight="semibold" color={t.fgMuted} tabular>
              {doneCount} of {lessons.length} done
            </Txt>
          </Row>
          <ProgressBar value={doneCount / Math.max(lessons.length, 1)} tone="up" style={{ marginTop: 8 }} />
        </View>

        {lesson.isLocked ? (
          <Button label="Unlock this course" icon="unlock" onPress={() => router.push(`/course/${courseKey}`)} style={{ marginTop: layout.section }} />
        ) : (
          <Button
            label={done ? 'Completed' : 'Mark as complete'}
            icon={done ? 'check-circle' : 'check'}
            variant={done ? 'secondary' : 'primary'}
            disabled={done}
            onPress={onComplete}
            style={{ marginTop: layout.section }}
          />
        )}
        <Row gap={10} style={{ marginTop: 10 }}>
          <Button label="Previous" icon="chevron-left" variant="secondary" disabled={!prev} onPress={() => goToLesson(prev)} style={{ flex: 1 }} />
          <Button label="Next" iconRight="chevron-right" variant="secondary" disabled={!next} onPress={() => goToLesson(next)} style={{ flex: 1 }} />
        </Row>

        {body ? (
          <Card style={{ marginTop: layout.section }}>
            <Txt size={15} weight="bold">
              About this lesson
            </Txt>
            <Txt size={14.5} color={t.fgMuted} style={{ marginTop: 8, lineHeight: 22 }}>
              {body}
            </Txt>
          </Card>
        ) : null}

        {offline ? (
          <Card style={[styles.offline, { marginTop: layout.section }]}>
            <IconBox name="check-circle" tone="up" size={40} />
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="semibold">
                Saved for offline
              </Txt>
              <Txt size={12} color={t.fgSubtle} style={{ marginTop: 2 }}>
                {offline.size ? `${formatBytes(offline.size)} · ` : ''}
                {offline.expiresAt
                  ? `available until ${new Date(offline.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                  : 'plays without internet'}
              </Txt>
            </View>
            <Pressable onPress={onRemoveDownload} hitSlop={12} accessibilityLabel="Remove download" style={styles.trash}>
              <Feather name="trash-2" size={17} color={t.fgMuted} />
            </Pressable>
          </Card>
        ) : canDownload ? (
          downloadPct != null ? (
            <Card style={[styles.offline, { marginTop: layout.section }]}>
              <ActivityIndicator color={t.brand400} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="semibold" tabular>
                  Downloading {Math.round(downloadPct * 100)}%
                </Txt>
                <ProgressBar value={Math.max(0.03, downloadPct)} style={{ marginTop: 8 }} />
              </View>
            </Card>
          ) : (
            <Button label="Download to watch offline" icon="download" variant="ghost" onPress={onDownload} style={{ marginTop: 12 }} />
          )
        ) : null}

        {upNext.length ? (
          <View style={{ marginTop: layout.section }}>
            <Txt size={17} weight="bold" style={{ marginBottom: 12 }}>
              Up next
            </Txt>
            <Card padded={false}>
              {upNext.map((l, i) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  number={idx + i + 2}
                  done={doneIds.has(l.id)}
                  last={i === upNext.length - 1}
                  onPress={() => goToLesson(l)}
                />
              ))}
            </Card>
          </View>
        ) : (
          <Button label="Back to the course" variant="secondary" icon="list" onPress={goToLearningArea} style={{ marginTop: layout.section }} />
        )}
      </ScrollView>
    </>,
    { course: course.title, position: lessons.length ? `Lesson ${idx + 1} of ${lessons.length}` : '' }
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: layout.side, paddingTop: 6, paddingBottom: 12 },
    side: { paddingHorizontal: layout.side },
    noVideo: {
      aspectRatio: 16 / 9,
      borderRadius: radii.xl,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.line,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 20,
    },
    scroll: { paddingHorizontal: layout.side, paddingTop: 20, paddingBottom: 48 },
    progress: { marginTop: 16 },
    offline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    trash: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tint },
  })
);
