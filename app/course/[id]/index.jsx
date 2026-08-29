import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCoursePreview, flattenCourseLessons } from '@/utils/catalog';
import { formatPriceCedi } from '@/utils/format';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isEnrolled, isSavedCourse, toggleSavedCourse, token } = useAppState();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState({});
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCoursePreview(String(id))
      .then((item) => {
        if (!alive) return;
        setCourse(item);
        setOpenModules({ [item.curriculum?.[0]?.id]: true });
        if (token && token !== 'local') {
          // ownership checked via purchased list / local enroll
        }
      })
      .catch(() => {
        if (alive) setCourse(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, token]);

  useEffect(() => {
    if (!course) return;
    setOwned(isEnrolled(course.id));
  }, [course, isEnrolled]);

  useEffect(() => {
    if (!course?.id || !token || token === 'local') return undefined;
    let alive = true;
    import('@/utils/catalog').then(({ fetchPurchasedCourses }) =>
      fetchPurchasedCourses(token)
        .then((list) => {
          if (alive && list.some((c) => c.id === course.id)) setOwned(true);
        })
        .catch(() => {})
    );
    return () => {
      alive = false;
    };
  }, [course?.id, token]);

  const lessons = useMemo(() => flattenCourseLessons(course), [course]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Course' }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Course' }} />
        <Text style={styles.missing}>Course not found.</Text>
      </View>
    );
  }

  const toggleModule = (moduleId) => {
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const onPrimary = () => {
    if (owned) {
      router.push(`/learn/${course.id}`);
      return;
    }
    router.push(`/course/${course.id}/checkout`);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Course details', headerBackTitle: 'Back' }} />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          {course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback]} />
          )}
          <LinearGradient colors={['transparent', 'rgba(7,21,47,0.88)']} style={styles.heroFade} />
          <View style={styles.heroMeta}>
            {course.category ? <Badge label={String(course.category).toUpperCase()} tone="warning" /> : null}
            <Text style={styles.heroTitle}>{course.title}</Text>
            {course.subtitle ? (
              <Text style={styles.heroSubtitle} numberOfLines={2}>
                {course.subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={14} color={colors.star} />
            <Text style={styles.ratingText}>
              {course.ratingLabel}
              {course.students ? ` · ${course.students.toLocaleString()} students` : ''}
            </Text>
          </View>

          <View style={styles.metaChips}>
            {course.level ? <Chip icon="signal" label={course.level} /> : null}
            {course.totalLessons ? <Chip icon="play-circle" label={`${course.totalLessons} lessons`} /> : null}
            {course.durationHours ? <Chip icon="clock-o" label={`${course.durationHours}h`} /> : null}
            {course.language ? <Chip icon="globe" label={course.language} /> : null}
            {course.hasCertificate ? <Chip icon="certificate" label="Certificate" /> : null}
          </View>

          {course.tutorName ? (
            <View style={styles.instructor}>
              {course.tutorAvatar ? (
                <Image source={{ uri: course.tutorAvatar }} style={styles.instructorAvatar} />
              ) : (
                <View style={[styles.instructorAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarLetter}>{course.tutorName.charAt(0)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.createdBy}>Created by</Text>
                <Text style={styles.instructorName}>{course.tutorName}</Text>
                {course.tutorHeadline ? (
                  <Text style={styles.instructorBio} numberOfLines={2}>
                    {course.tutorHeadline}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {course.materials?.length ? (
            <Section title="What you'll learn">
              {course.materials.map((item) => (
                <View key={item} style={styles.learnRow}>
                  <FontAwesome name="check" size={12} color={colors.success} style={{ marginTop: 3 }} />
                  <Text style={styles.learnText}>{item}</Text>
                </View>
              ))}
            </Section>
          ) : null}

          {course.requirements?.length ? (
            <Section title="Requirements">
              {course.requirements.map((item) => (
                <Text key={item} style={styles.bullet}>
                  • {item}
                </Text>
              ))}
            </Section>
          ) : null}

          {course.description ? (
            <Section title="Description">
              <Text style={styles.description}>{course.description}</Text>
            </Section>
          ) : null}

          <Section title="Course content" subtitle={`${course.curriculum.length} sections · ${lessons.length} lessons`}>
            {course.curriculum.map((mod) => {
              const open = Boolean(openModules[mod.id]);
              return (
                <View key={mod.id} style={styles.module}>
                  <Pressable style={styles.moduleHead} onPress={() => toggleModule(mod.id)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleMeta}>{mod.lessons.length} lessons</Text>
                    </View>
                    <FontAwesome name={open ? 'angle-up' : 'angle-down'} size={18} color={colors.muted} />
                  </Pressable>
                  {open
                    ? mod.lessons.map((lesson) => (
                        <View key={lesson.id} style={styles.lessonRow}>
                          <FontAwesome
                            name={
                              lesson.type === 'quiz'
                                ? 'question-circle'
                                : lesson.type === 'pdf' || lesson.type === 'resource'
                                  ? 'file-o'
                                  : 'play-circle'
                            }
                            size={15}
                            color={lesson.isPreview ? colors.primary : colors.muted}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.lessonTitle}>{lesson.title}</Text>
                            <Text style={styles.lessonMeta}>
                              {lesson.isPreview ? 'Preview · ' : ''}
                              {lesson.type}
                              {lesson.durationLabel ? ` · ${lesson.durationLabel}` : ''}
                            </Text>
                          </View>
                          {lesson.isPreview ? (
                            <Pressable
                              onPress={() =>
                                owned || lesson.videoUrl
                                  ? router.push(`/learn/${course.id}/lesson/${lesson.id}`)
                                  : null
                              }>
                              <Text style={styles.previewLink}>Preview</Text>
                            </Pressable>
                          ) : (
                            <FontAwesome name="lock" size={12} color={colors.tabInactive} />
                          )}
                        </View>
                      ))
                    : null}
                </View>
              );
            })}
          </Section>

          {course.reviews?.length ? (
            <Section title="Student reviews">
              {course.reviews.map((review) => (
                <View key={review.id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewUser}>{review.user}</Text>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FontAwesome
                          key={i}
                          name={i < Math.round(review.rating) ? 'star' : 'star-o'}
                          size={11}
                          color={colors.star}
                        />
                      ))}
                    </View>
                  </View>
                  {review.text ? <Text style={styles.reviewText}>{review.text}</Text> : null}
                </View>
              ))}
            </Section>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.buyBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.price}>{formatPriceCedi(course.price)}</Text>
          {course.originalPrice && course.originalPrice > course.price ? (
            <Text style={styles.oldPrice}>{formatPriceCedi(course.originalPrice)}</Text>
          ) : null}
        </View>
        <PrimaryButton
          label={owned ? 'Go to course' : 'Buy now'}
          onPress={onPrimary}
          style={styles.buyBtn}
        />
        <Pressable
          style={styles.saveBtn}
          onPress={() => toggleSavedCourse(course.id)}
          hitSlop={8}>
          <FontAwesome
            name={isSavedCourse(course.id) ? 'bookmark' : 'bookmark-o'}
            size={18}
            color={colors.primary}
          />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

function Chip({ icon, label }) {
  return (
    <View style={styles.chip}>
      <FontAwesome name={icon} size={11} color={colors.muted} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  missing: { color: colors.muted, fontWeight: '600' },
  scroll: { paddingBottom: 120 },
  heroWrap: { height: 240, backgroundColor: colors.navy },
  hero: { width: '100%', height: '100%' },
  heroFallback: { backgroundColor: colors.navyMid },
  heroFade: { ...StyleSheet.absoluteFillObject },
  heroMeta: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heroSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20 },
  body: { padding: spacing.lg },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  ratingText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  instructor: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  instructorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  avatarLetter: { color: colors.white, fontWeight: '800', fontSize: 18 },
  createdBy: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  instructorName: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
  instructorBio: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionSub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  learnRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  learnText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  bullet: { color: colors.text, marginBottom: 6, lineHeight: 20 },
  description: { color: colors.text, fontSize: 14, lineHeight: 22 },
  module: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  moduleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
  },
  moduleTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  moduleMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  lessonTitle: { color: colors.text, fontWeight: '600', fontSize: 13 },
  lessonMeta: { color: colors.muted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  previewLink: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  review: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUser: { fontWeight: '700', color: colors.text },
  stars: { flexDirection: 'row', gap: 2 },
  reviewText: { marginTop: 6, color: colors.muted, lineHeight: 19, fontSize: 13 },
  buyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  price: { fontSize: 22, fontWeight: '800', color: colors.text },
  oldPrice: {
    color: colors.muted,
    textDecorationLine: 'line-through',
    fontSize: 12,
    marginTop: 2,
  },
  buyBtn: { minWidth: 140, paddingHorizontal: spacing.lg },
  saveBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
