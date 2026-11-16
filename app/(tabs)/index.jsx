import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/components/ui/CourseCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { SearchBar } from '@/components/ui/SearchBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { colors, radii, spacing } from '@/constants/theme';
import { hubTiles } from '@/data/categories';
import { useAppState } from '@/context/AppState';
import { fetchCourses, fetchPurchasedCourses } from '@/utils/catalog';
import { fetchNotifications } from '@/utils/notifications';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function titleCaseLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomeScreen() {
  const router = useRouter();
  const { bookings, user, token } = useAppState();
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [continueCourse, setContinueCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(
    async (isAlive = () => true) => {
      const signedIn = token && token !== 'local';
      // Fetch in parallel — the hero, carousel and badge don't depend on each other.
      const [courseList, purchased, noteData] = await Promise.all([
        fetchCourses().catch(() => []),
        signedIn ? fetchPurchasedCourses(token).catch(() => []) : Promise.resolve([]),
        signedIn ? fetchNotifications(token, { unreadOnly: true }).catch(() => null) : Promise.resolve(null),
      ]);
      if (!isAlive()) return;
      setCourses(courseList);
      setContinueCourse(purchased[0] || null);
      setUnreadCount(noteData?.unreadCount || 0);
      setLoading(false);
      setRefreshing(false);
    },
    [token]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load(() => alive);
    return () => {
      alive = false;
    };
  }, [load]);

  const recommended = courses.slice(0, 8);
  const topics = Array.from(
    new Map(
      courses
        .filter((course) => course.category)
        .map((course) => [String(course.category).toLowerCase(), titleCaseLabel(course.category)])
    )
  ).slice(0, 6);

  const nextBooking = bookings.find((b) => b.status === 'upcoming');

  const onSearchSubmit = () => {
    if (!query.trim()) return;
    router.push({ pathname: '/(tabs)/learn', params: { q: query.trim() } });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#07152F', '#0C2340', '#1246C4']} locations={[0, 0.55, 1]} style={styles.heroBg} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.white}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
                <UserAvatar size={40} fontSize={16} />
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                  <FontAwesome name="bell-o" size={16} color={colors.white} />
                  {unreadCount > 0 ? <View style={styles.dot} /> : null}
                </Pressable>
              </View>
            </View>

            <Text style={styles.kicker}>{greeting()}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</Text>
            <Text style={styles.heading}>Ready when you are.</Text>
            <Text style={styles.subhead}>Master trading, tech, and digital skills — one lesson at a time.</Text>

            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search courses and tutors"
              style={styles.search}
              onSubmitEditing={onSearchSubmit}
            />
          </View>

          <View style={styles.sheet}>
            {continueCourse ? (
              <PressableScale
                style={styles.continue}
                scaleTo={0.98}
                onPress={() => router.push(`/course/${continueCourse.id}`)}>
                <Image
                  source={continueCourse.thumbnail ? { uri: continueCourse.thumbnail } : undefined}
                  style={styles.continueImage}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(7,21,47,0.92)']}
                  style={styles.continueFade}
                />
                <View style={styles.continueBody}>
                  <View style={styles.resumePill}>
                    <FontAwesome name="play" size={9} color={colors.navy} />
                    <Text style={styles.resumeText}>Resume</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.continueTitle}>
                    {continueCourse.title}
                  </Text>
                  <Text style={styles.continueMeta} numberOfLines={1}>
                    {continueCourse.lastLessonTitle} · {continueCourse.pct}% complete
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${continueCourse.pct}%` }]} />
                  </View>
                </View>
              </PressableScale>
            ) : null}

            <Text style={styles.sectionEyebrow}>Explore</Text>
            <View style={styles.hubGrid}>
              {hubTiles.map((tile) => (
                <PressableScale
                  key={tile.id}
                  style={styles.hubTile}
                  scaleTo={0.94}
                  accessibilityRole="button"
                  accessibilityLabel={tile.label}
                  onPress={() => router.push(tile.href)}>
                  <View style={styles.hubIcon}>
                    <FontAwesome name={tile.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.hubLabel} numberOfLines={2}>
                    {tile.label}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionEyebrow}>For you</Text>
                <Text style={styles.sectionTitle}>Recommended</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/learn')} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              nestedScrollEnabled>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <View key={i} style={styles.loader}>
                    <Skeleton height={110} radius={radii.lg} />
                    <Skeleton width="80%" height={12} style={{ marginTop: spacing.sm }} />
                    <Skeleton width="50%" height={10} style={{ marginTop: 6 }} />
                  </View>
                ))
              ) : recommended.length ? (
                recommended.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    horizontal
                    subtitle={course.tutorName}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No courses yet.</Text>
              )}
            </ScrollView>

            {topics.length ? (
              <>
                <Text style={styles.sectionEyebrow}>Browse</Text>
                <View style={styles.topics}>
                  {topics.map(([id, label]) => (
                    <Pressable
                      key={id}
                      style={styles.topic}
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/learn', params: { category: id } })
                      }>
                      <Text style={styles.topicText}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {nextBooking ? (
              <Pressable style={styles.session} onPress={() => router.push('/bookings')}>
                <View style={styles.sessionAvatarFallback}>
                  <Text style={styles.sessionAvatarLetter}>
                    {(nextBooking.tutorName || 'T').charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionLabel}>Upcoming session</Text>
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {nextBooking.serviceName}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {nextBooking.tutorName || 'Tutor'} · {nextBooking.date} · {nextBooking.time}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    height: 420,
  },
  safe: { flex: 1 },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  kicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  heading: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subhead: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 300,
  },
  search: {
    marginTop: spacing.xl,
    borderWidth: 0,
    shadowColor: '#07152F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    minHeight: 520,
  },
  continue: {
    height: 168,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    backgroundColor: colors.navy,
  },
  continueImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  continueFade: {
    ...StyleSheet.absoluteFillObject,
  },
  continueBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
  },
  resumePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginBottom: 8,
  },
  resumeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 0.3,
  },
  continueTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  continueMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.gold,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  seeAll: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  carousel: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.lg,
    minHeight: 80,
  },
  loader: {
    width: 188,
    marginRight: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: spacing.lg,
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  topic: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  hubTile: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  hubIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sessionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
  },
  sessionAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionAvatarLetter: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  sessionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sessionTitle: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  sessionMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
