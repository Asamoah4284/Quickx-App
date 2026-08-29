import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCourseFull, fetchPurchasedCourses } from '@/utils/catalog';
import { getCachedPurchasedCourses } from '@/utils/courseCache';

export default function MyCoursesScreen() {
  const router = useRouter();
  const { token, enrolledCourses } = useAppState();
  const [courses, setCourses] = useState(() => getCachedPurchasedCourses() || []);
  const [loading, setLoading] = useState(() => !getCachedPurchasedCourses()?.length);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async ({ force = false } = {}) => {
      if (!token || token === 'local') {
        setCourses([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const cached = getCachedPurchasedCourses();
      if (cached?.length && !force) {
        setCourses(cached);
        setLoading(false);
      } else if (!cached?.length) {
        setLoading(true);
      }
      try {
        const list = await fetchPurchasedCourses(token, { force });
        setCourses(list);
      } catch {
        if (!cached?.length) setCourses([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const openCourse = (courseId) => {
    if (token && token !== 'local') {
      // Warm the full course cache while navigating so the first lesson opens faster.
      fetchCourseFull(courseId, token).catch(() => {});
    }
    const lastLessonId = enrolledCourses[courseId]?.lastLessonId;
    if (lastLessonId) {
      router.push(`/learn/${courseId}/lesson/${lastLessonId}`);
      return;
    }
    router.push(`/learn/${courseId}`);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'My courses' }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load({ force: true });
            }}
          />
        }>
        <Text style={styles.lede}>Courses you’ve bought — open any one to keep watching.</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : courses.length ? (
          courses.map((course) => {
            const localPct = (() => {
              const progress = enrolledCourses[course.id]?.progress || {};
              const keys = Object.keys(progress);
              if (!keys.length) return course.pct;
              const done = keys.filter((k) => progress[k]).length;
              return Math.max(course.pct, Math.round((done / keys.length) * 100));
            })();

            return (
              <Pressable key={course.id} style={styles.card} onPress={() => openCourse(course.id)}>
                {course.thumbnail ? (
                  <Image source={{ uri: course.thumbnail }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <FontAwesome name="play-circle" size={28} color={colors.white} />
                  </View>
                )}
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={2}>
                    {course.title}
                  </Text>
                  {course.instructor ? (
                    <Text style={styles.meta} numberOfLines={1}>
                      {course.instructor}
                    </Text>
                  ) : null}
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(100, localPct)}%` }]} />
                  </View>
                  <View style={styles.footer}>
                    <Text style={styles.pct}>{localPct}% complete</Text>
                    <View style={styles.watch}>
                      <FontAwesome name="play" size={10} color={colors.primary} />
                      <Text style={styles.watchText}>Watch</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            icon="graduation-cap"
            title="No purchased courses yet"
            subtitle="When you buy a course, it will show up here so you can watch anytime."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  lede: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumb: {
    width: 110,
    height: 110,
    backgroundColor: colors.navy,
  },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  title: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  barFill: { height: '100%', backgroundColor: colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pct: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  watch: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  watchText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
