import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CourseCard } from '@/components/ui/CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchTutorProfile } from '@/utils/catalog';
import { fetchTutorSubscriptionMe } from '@/utils/community';

export default function TutorProfileScreen() {
  const { id, fromCourse } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollowTutor, token } = useAppState();
  const [tutor, setTutor] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTutorProfile(String(id))
      .then(async (item) => {
        if (!alive) return;
        setTutor(item);
        if (token && token !== 'local') {
          try {
            const me = await fetchTutorSubscriptionMe(String(id), token);
            if (alive) setAccess(me);
          } catch {
            if (alive) setAccess(null);
          }
        }
      })
      .catch(() => {
        if (alive) setTutor(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, token]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!tutor) {
    return (
      <Screen>
        <EmptyState icon="user" title="Tutor not found" subtitle="This tutor may no longer be available." />
      </Screen>
    );
  }

  const tutorCourses = tutor.courses || [];
  const linkedCourse = fromCourse ? String(fromCourse) : tutorCourses[0]?.id;
  const expertise = tutor.expertise?.length ? tutor.expertise : tutor.teachingCategories || [];

  return (
    <Screen>
      <View style={styles.header}>
        {tutor.avatar ? (
          <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{tutor.name.charAt(0)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>{tutor.name}</Text>
          <Text style={typography.caption}>{tutor.title}</Text>
          <View style={styles.meta}>
            <FontAwesome name="star" size={12} color={colors.star} />
            <Text style={styles.metaText}>
              {tutor.rating || 'New'}
              {tutor.students ? ` · ${tutor.students} students` : ''}
              {tutor.courseCount ? ` · ${tutor.courseCount} courses` : ''}
              {tutor.experience ? ` · ${tutor.experience}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {tutor.bio ? (
        <Text style={[typography.body, { lineHeight: 22, marginVertical: spacing.lg }]}>{tutor.bio}</Text>
      ) : (
        <View style={{ height: spacing.lg }} />
      )}

      {expertise.length ? (
        <>
          <Text style={typography.h3}>Expertise</Text>
          <View style={styles.tags}>
            {expertise.map((e) => (
              <View key={e} style={styles.tag}>
                <Text style={styles.tagText}>{e}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label={isFollowing(tutor.id) ? 'Following' : 'Follow'}
          variant="secondary"
          onPress={() => toggleFollowTutor(tutor.id)}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          label="Book a session"
          onPress={() => router.push(`/booking/${tutor.id}`)}
          style={{ flex: 1 }}
        />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={access?.subscribed ? 'Manage plan' : 'Subscribe'}
          onPress={() => router.push(`/subscribe/${tutor.id}`)}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          label={access?.canAccessCommunity ? 'Open community' : 'Community'}
          variant="secondary"
          onPress={() =>
            access?.canAccessCommunity
              ? router.push(`/community/${tutor.id}`)
              : router.push(`/subscribe/${tutor.id}`)
          }
          style={{ flex: 1 }}
        />
      </View>

      {linkedCourse ? (
        <PrimaryButton
          label="Preview this tutor’s course"
          variant="ghost"
          onPress={() => router.push(`/course/${linkedCourse}`)}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Courses</Text>
      {tutorCourses.length ? (
        tutorCourses.map((c) => <CourseCard key={c.id} course={c} layout="row" />)
      ) : (
        <Text style={styles.empty}>No published courses yet.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarLetter: { color: colors.white, fontWeight: '800', fontSize: 24 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: {
    backgroundColor: '#1B5EF514',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  tagText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  empty: { color: colors.muted, fontSize: 13 },
});
