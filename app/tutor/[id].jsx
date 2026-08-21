import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BookCard } from '@/components/ui/BookCard';
import { CourseCard } from '@/components/ui/CourseCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getBooksByTutor } from '@/data/books';
import { getCoursesByTutor } from '@/data/courses';
import { getTutorById } from '@/data/tutors';

export default function TutorProfileScreen() {
  const { id, fromCourse } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollowTutor } = useAppState();
  const tutor = getTutorById(String(id));

  if (!tutor) {
    return (
      <Screen>
        <Text>Tutor not found.</Text>
      </Screen>
    );
  }

  const tutorCourses = getCoursesByTutor(tutor.id);
  const tutorBooks = getBooksByTutor(tutor.id);
  const linkedCourse = fromCourse ? String(fromCourse) : tutorCourses[0]?.id;

  return (
    <Screen>
      <View style={styles.header}>
        <Image source={{ uri: tutor.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>{tutor.name}</Text>
          <Text style={typography.caption}>{tutor.title}</Text>
          <View style={styles.meta}>
            <FontAwesome name="star" size={12} color={colors.star} />
            <Text style={styles.metaText}>
              {tutor.rating} · {tutor.students} students · {tutor.experience}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[typography.body, { lineHeight: 22, marginVertical: spacing.lg }]}>
        {tutor.bio}
      </Text>

      <Text style={typography.h3}>Expertise</Text>
      <View style={styles.tags}>
        {tutor.expertise.map((e) => (
          <View key={e} style={styles.tag}>
            <Text style={styles.tagText}>{e}</Text>
          </View>
        ))}
      </View>

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

      {linkedCourse ? (
        <PrimaryButton
          label="Preview this tutor’s course"
          variant="ghost"
          onPress={() => router.push(`/course/${linkedCourse}/preview`)}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Courses
      </Text>
      {tutorCourses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}

      {tutorBooks.length ? (
        <>
          <Text style={[typography.h3, { marginTop: spacing.md, marginBottom: spacing.md }]}>
            Books
          </Text>
          {tutorBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </>
      ) : null}

      <Text style={[typography.h3, { marginTop: spacing.md, marginBottom: spacing.md }]}>
        Mentorship services
      </Text>
      {tutor.services.map((s) => (
        <Pressable
          key={s.id}
          style={styles.service}
          onPress={() => router.push(`/booking/${tutor.id}?service=${s.id}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={typography.caption}>
              {s.durationMins} min · ₵{s.price}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.muted} />
        </Pressable>
      ))}

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Reviews
      </Text>
      {tutor.reviews.map((r) => (
        <View key={r.id} style={styles.review}>
          <Text style={styles.reviewUser}>
            {r.user} · {r.rating}★
          </Text>
          <Text style={typography.caption}>{r.text}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { color: colors.muted, fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: {
    backgroundColor: '#1B5EF514',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  tagText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceName: { fontWeight: '700', color: colors.text },
  review: { marginBottom: spacing.md },
  reviewUser: { fontWeight: '700', marginBottom: 4, color: colors.text },
});
