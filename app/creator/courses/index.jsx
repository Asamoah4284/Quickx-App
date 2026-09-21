import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import {
  archiveInstructorCourse,
  deleteInstructorCourse,
  duplicateInstructorCourse,
  fetchInstructorCourses,
  LISTING_FILTERS,
  listingStatusLabel,
  listingStatusTone,
  submitInstructorCourse,
  unpublishInstructorCourse,
} from '@/utils/instructorCourses';

export default function CreatorCoursesScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const { approved, syncing, refresh, user } = useCreatorAccess();
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setCourses([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!approved) {
      setCourses([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError('');
    try {
      setCourses(await fetchInstructorCourses(token, filter));
    } catch (loadError) {
      setError(loadError.message || 'Could not load your courses');
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, filter, token]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  const onRefresh = () => {
    setRefreshing(true);
    refresh().finally(() => load());
  };

  const runAction = async (courseId, action) => {
    try {
      if (action === 'submit') {
        await submitInstructorCourse(token, courseId);
        Alert.alert('Submitted', 'Your course was submitted for review.');
      } else if (action === 'unpublish') {
        await unpublishInstructorCourse(token, courseId);
        Alert.alert('Unpublished', 'Course moved back to draft.');
      } else if (action === 'archive') {
        await archiveInstructorCourse(token, courseId);
        Alert.alert('Archived', 'Course archived.');
      } else if (action === 'duplicate') {
        const copy = await duplicateInstructorCourse(token, courseId);
        Alert.alert('Duplicated', 'A draft copy was created.');
        router.push(`/creator/courses/${copy.id}`);
        return;
      } else if (action === 'delete') {
        await deleteInstructorCourse(token, courseId);
        Alert.alert('Deleted', 'Course removed.');
      }
      load();
    } catch (actionError) {
      Alert.alert('Action failed', actionError.message || 'Try again.');
    }
  };

  const confirmDelete = (courseId, title) => {
    Alert.alert('Delete course?', `Remove "${title}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => runAction(courseId, 'delete') },
    ]);
  };

  const openActions = (course) => {
    const options = [{ text: 'Edit', onPress: () => router.push(`/creator/courses/${course.id}`) }];

    if (['draft', 'rejected', 'published'].includes(course.listingStatus)) {
      options.push({ text: 'Submit for review', onPress: () => runAction(course.id, 'submit') });
    }
    if (course.listingStatus === 'published') {
      options.push({ text: 'Unpublish', onPress: () => runAction(course.id, 'unpublish') });
    }
    options.push({ text: 'Duplicate', onPress: () => runAction(course.id, 'duplicate') });
    options.push({ text: 'Archive', onPress: () => runAction(course.id, 'archive') });
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => confirmDelete(course.id, course.title),
    });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(course.title, 'Choose an action', options);
  };

  if (syncing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.syncText}>Checking creator access...</Text>
      </View>
    );
  }

  if (!approved) {
    return (
      <View style={styles.root}>
        <CreatorHubNav />
        <View style={styles.center}>
          <EmptyState
            icon="lock"
            title="Creator access required"
            subtitle={
              user?.creatorStatus === 'approved' && user?.role !== 'tutor'
                ? 'Your account is approved but still syncing tutor role. Pull to refresh or sign out and back in.'
                : 'Complete creator onboarding and get approved before you can manage courses.'
            }
          />
          <PrimaryButton label="Creator onboarding" onPress={() => router.push('/programs')} style={{ marginTop: spacing.lg }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.lede}>
          Create drafts, edit your catalog, and submit courses for review — same workflow as the web creator studio.
        </Text>

        <PrimaryButton label="Create new course" onPress={() => router.push('/creator/courses/new')} />

        <FilterChips options={LISTING_FILTERS} selected={filter} onSelect={setFilter} style={styles.filters} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : courses.length ? (
          courses.map((course) => (
            <Pressable
              key={course.id}
              style={styles.card}
              onPress={() => router.push(`/creator/courses/${course.id}`)}>
              {course.thumbnail ? (
                <Image source={{ uri: course.thumbnail }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <FontAwesome name="book" size={22} color={colors.white} />
                </View>
              )}
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Badge label={listingStatusLabel(course.listingStatus)} tone={listingStatusTone(course.listingStatus)} />
                </View>
                {course.shortDescription ? (
                  <Text style={styles.meta} numberOfLines={2}>
                    {course.shortDescription}
                  </Text>
                ) : null}
                <Text style={styles.meta}>
                  {course.moduleCount} modules · {course.lessonCount} lessons · {String(course.courseType).toUpperCase()}
                </Text>
                <View style={styles.actions}>
                  <Pressable style={styles.actionBtn} onPress={() => router.push(`/creator/courses/${course.id}`)}>
                    <FontAwesome name="pencil" size={12} color={colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => openActions(course)}>
                    <FontAwesome name="ellipsis-h" size={12} color={colors.muted} />
                    <Text style={[styles.actionText, { color: colors.muted }]}>More</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon="book"
            title="No courses yet"
            subtitle="Tap Create new course to start your first draft."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, backgroundColor: colors.surface, justifyContent: 'center' },
  syncText: { marginTop: spacing.md, color: colors.muted, fontSize: 13 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  filters: { marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumb: { width: 96, height: 112, backgroundColor: colors.navy },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: spacing.md, gap: 6 },
  titleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  title: { flex: 1, fontWeight: '800', color: colors.text, fontSize: 15, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});
