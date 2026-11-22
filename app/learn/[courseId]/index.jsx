import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LessonRow } from '@/components/learn/LessonRow';
import { Button, Card, IconBox, Loading, ProgressBar, Row, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { layout, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCourseFull, fetchCoursePreview, flattenCourseLessons } from '@/utils/catalog';
import { getCachedCourseFull } from '@/utils/courseCache';
import { themed } from '@/utils/themedStyles';

/** The course you are taking: progress, Continue, and every lesson grouped by module. */
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
      <Page back title="My course">
        <Loading label="Opening your course" />
      </Page>
    );
  }

  if (denied || !course) {
    return (
      <Page back title="My course">
        <Card style={{ gap: 12 }}>
          <IconBox name="lock" tone="warn" />
          <Txt size={17} weight="bold">
            You do not have access yet
          </Txt>
          <Txt size={14} color={t.fgMuted} style={{ lineHeight: 21 }}>
            Get Courses access to watch every lesson in this course.
          </Txt>
          <Button label="See how to get access" onPress={() => router.replace(`/course/${courseId}`)} />
        </Card>
      </Page>
    );
  }

  let number = 0;
  return (
    <Page back eyebrow="My course" title={course.title} subtitle={course.tutorName ? `With ${course.tutorName}` : undefined}>
      {course.thumbnail ? <Image source={{ uri: course.thumbnail }} style={styles.cover} contentFit="cover" transition={150} /> : null}

      <Card style={{ marginTop: course.thumbnail ? layout.section : 0 }}>
        <Row justify="space-between">
          <Txt size={15} weight="bold">
            Your progress
          </Txt>
          <Txt size={15} weight="bold" color={t.up} tabular>
            {pct}%
          </Txt>
        </Row>
        <ProgressBar value={pct / 100} tone="up" height={8} style={{ marginTop: 12 }} />
        <Txt size={13} color={t.fgMuted} style={{ marginTop: 10 }} tabular>
          {completed} of {lessons.length} lessons complete
        </Txt>
        {resumeId ? (
          <Button
            label={completed ? 'Continue watching' : 'Start the first lesson'}
            icon="play"
            onPress={() => router.push(`/learn/${course.id}/lesson/${resumeId}`)}
            style={{ marginTop: 16 }}
          />
        ) : null}
      </Card>

      {course.curriculum.map((mod) => (
        <View key={mod.id} style={{ marginTop: layout.section }}>
          <Txt size={17} weight="bold" style={{ marginBottom: 12 }}>
            {mod.title}
          </Txt>
          <Card padded={false}>
            {mod.lessons.map((lesson, i) => {
              number += 1;
              return (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  number={number}
                  done={completedIds.has(lesson.id)}
                  current={lesson.id === resumeId && !completedIds.has(lesson.id)}
                  last={i === mod.lessons.length - 1}
                  onPress={() => router.push(`/learn/${course.id}/lesson/${lesson.id}`)}
                />
              );
            })}
          </Card>
        </View>
      ))}
    </Page>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, backgroundColor: t.ink700 },
  })
);
