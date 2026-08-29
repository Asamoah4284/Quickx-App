import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatorStatusBadge } from '@/components/creator/CreatorOnboardingParts';
import { CameraBadge, UserAvatar } from '@/components/ui/UserAvatar';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import { formatCurrency } from '@/utils/format';
import { formatIntlPhone } from '@/utils/phone';
import { promptProfilePhoto } from '@/utils/profilePhoto';
import { creatorStatusLabel, fetchCreatorProfile } from '@/utils/creator';

const BASE_LEARNING = [
  { id: 'mycourses', label: 'My courses', hint: 'Watch courses you’ve bought', icon: 'play-circle', href: '/my-courses' },
  { id: 'learning', label: 'Browse catalog', hint: 'Explore all courses', icon: 'graduation-cap', href: '/(tabs)/learn' },
  { id: 'teaching', label: 'My teaching courses', hint: 'Create and manage your catalog', icon: 'book', href: '/creator/courses' },
  { id: 'programs', label: 'Creator programs', hint: 'Apply free to teach on QuickX', icon: 'trophy', href: '/programs' },
  { id: 'communities', label: 'Communities', hint: 'Tutor feeds, Q&A, and resources', icon: 'comments', href: '/communities' },
  { id: 'saved', label: 'Saved courses', hint: 'Pick up later', icon: 'bookmark-o', href: '/(tabs)/learn' },
  { id: 'bookings', label: 'Sessions', hint: 'Upcoming and past bookings', icon: 'calendar', href: '/bookings' },
  { id: 'tutors', label: 'Tutors', hint: 'People you follow and book', icon: 'users', href: '/tutors' },
];

const ACCOUNT = [
  { id: 'notifications', label: 'Notifications', hint: 'Reminders and offers', icon: 'bell-o', href: '/notifications' },
  { id: 'live', label: 'Live classes', hint: 'Upcoming broadcasts', icon: 'video-camera', href: '/live' },
  { id: 'ai', label: 'QuickX AI', hint: 'Study assistant', icon: 'magic', href: '/ai' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { walletBalance, currency, followedTutors, savedCourses, enrolledCourses, bookings, avatarUri, setAvatarUri, user, token, logout, updateUser } =
    useAppState();
  const { approved: approvedCreator, applied: creatorApplied, user: creatorUser } = useCreatorAccess();
  const [creatorHeadline, setCreatorHeadline] = useState('');

  useEffect(() => {
    if (!token || token === 'local') return;
    fetchCreatorProfile(token)
      .then((data) => {
        setCreatorHeadline(data.form.headline || '');
        if (data.user) updateUser(data.user);
      })
      .catch(() => setCreatorHeadline(''));
  }, [token, updateUser]);

  const displayUser = creatorUser || user;

  const learningItems = useMemo(() => {
    let programHint = 'Apply free to teach on QuickX';
    if (approvedCreator) {
      programHint = creatorHeadline ? `${creatorHeadline} · Approved` : 'Approved creator';
    } else if (creatorApplied) {
      programHint = `${creatorStatusLabel(displayUser?.creatorStatus)} · View application`;
    }

    return BASE_LEARNING.filter((item) => (item.id === 'teaching' ? approvedCreator : true)).map((item) =>
      item.id === 'programs' ? { ...item, hint: programHint } : item
    );
  }, [approvedCreator, creatorApplied, creatorHeadline, displayUser?.creatorStatus]);

  const enrolledCount = Object.keys(enrolledCourses).length;
  const upcomingCount = bookings.filter((b) => b.status === 'upcoming').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#07152F', '#0C2340']} style={styles.heroBg} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Text style={styles.eyebrow}>Account</Text>
              <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                <FontAwesome name="cog" size={16} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.identity}>
              <Pressable
                onPress={() =>
                  promptProfilePhoto({
                    hasPhoto: Boolean(avatarUri),
                    onPicked: setAvatarUri,
                    onRemoved: () => setAvatarUri(null),
                  })
                }
                style={styles.avatarPress}>
                <View style={styles.avatarRing}>
                  <UserAvatar size={80} fontSize={30} style={styles.avatarFill} />
                </View>
                <View style={styles.cameraWrap}>
                  <CameraBadge />
                </View>
              </Pressable>
              <Text style={styles.changeHint}>Tap to change photo</Text>
              <Text style={styles.name}>{user?.fullName || 'QuickX Learner'}</Text>
              {creatorApplied ? (
                <View style={styles.creatorBadgeWrap}>
                  <CreatorStatusBadge status={displayUser?.creatorStatus} />
                </View>
              ) : null}
              <Text style={styles.meta}>
                {user?.phone ? formatIntlPhone(user.phone) : user?.email || 'Accra · Member since 2026'}
              </Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <Pressable style={styles.wallet} onPress={() => router.push('/wallet')}>
              <LinearGradient
                colors={['#0C2340', '#1246C4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.walletInner}>
                <View style={styles.walletTop}>
                  <Text style={styles.walletLabel}>QuickX Wallet</Text>
                  <View style={styles.walletChip}>
                    <Text style={styles.walletChipText}>Open</Text>
                  </View>
                </View>
                <Text style={styles.walletBalance}>{formatCurrency(walletBalance, currency)}</Text>
                <Text style={styles.walletHint}>Available for courses, books, and sessions</Text>
              </LinearGradient>
            </Pressable>

            {creatorApplied ? (
              <Pressable style={styles.programsCard} onPress={() => router.push('/programs')}>
                <View style={styles.programsCardTop}>
                  <Text style={styles.programsCardLabel}>Creator application</Text>
                  <Text style={styles.programsCardLink}>View</Text>
                </View>
                <Text style={styles.programName}>
                  {creatorHeadline || displayUser?.creatorHeadline || 'QuickX Creator'}
                </Text>
                <Text style={styles.programMeta}>
                  {approvedCreator
                    ? 'Approved · manage your teaching courses below'
                    : `${creatorStatusLabel(displayUser?.creatorStatus)} · tap to view your submitted details`}
                </Text>
              </Pressable>
            ) : (
              <Pressable style={styles.applyCard} onPress={() => router.push('/programs')}>
                <Text style={styles.applyTitle}>Become a creator</Text>
                <Text style={styles.applyMeta}>
                  Apply for free — submit your tutor profile and start teaching on QuickX Learn.
                </Text>
              </Pressable>
            )}

            {approvedCreator ? (
              <Pressable style={styles.teachingCard} onPress={() => router.push('/creator/courses')}>
                <View style={styles.programsCardTop}>
                  <Text style={styles.programsCardLabel}>Teaching catalog</Text>
                  <Text style={styles.programsCardLink}>Open</Text>
                </View>
                <Text style={styles.programName}>My teaching courses</Text>
                <Text style={styles.programMeta}>Add, edit, and submit courses for review</Text>
              </Pressable>
            ) : null}

            <View style={styles.snapshot}>
              <Snap value={String(enrolledCount)} label="Enrolled" />
              <View style={styles.snapLine} />
              <Snap value={String(savedCourses.length)} label="Saved" />
              <View style={styles.snapLine} />
              <Snap value={String(upcomingCount)} label="Sessions" />
              <View style={styles.snapLine} />
              <Snap value={String(followedTutors.length)} label="Following" />
            </View>

            <Text style={styles.groupTitle}>Learning</Text>
            <View style={styles.group}>
              {learningItems.map((item, index) => (
                <Row
                  key={item.id}
                  item={item}
                  last={index === learningItems.length - 1}
                  onPress={() => router.push(item.href)}
                />
              ))}
            </View>

            <Text style={styles.groupTitle}>Account</Text>
            <View style={styles.group}>
              {ACCOUNT.map((item, index) => (
                <Row
                  key={item.id}
                  item={item}
                  last={index === ACCOUNT.length - 1}
                  onPress={() => router.push(item.href)}
                />
              ))}
            </View>

            <Pressable style={styles.signOut} onPress={logout}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Snap({ value, label }) {
  return (
    <View style={styles.snap}>
      <Text style={styles.snapValue}>{value}</Text>
      <Text style={styles.snapLabel}>{label}</Text>
    </View>
  );
}

function Row({ item, last, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <FontAwesome name={item.icon} size={15} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowHint}>{item.hint}</Text>
      </View>
      <FontAwesome name="chevron-right" size={11} color={colors.tabInactive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    height: 340,
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
  eyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    alignItems: 'center',
  },
  avatarPress: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: 'hidden',
  },
  avatarFill: {
    backgroundColor: 'transparent',
  },
  cameraWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  changeHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  name: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  creatorBadgeWrap: {
    marginTop: 8,
  },
  meta: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    minHeight: 520,
  },
  wallet: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  walletInner: {
    padding: spacing.xl,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  walletChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  walletChipText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  walletBalance: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  walletHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  programsCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#B8E6C8',
  },
  applyCard: {
    backgroundColor: '#EEF4FF',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C7D9FF',
  },
  applyTitle: {
    fontWeight: '800',
    color: colors.navyMid,
    fontSize: 15,
  },
  applyMeta: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
  teachingCard: {
    backgroundColor: '#F3F7FF',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C7D9FF',
  },
  programsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  programsCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  programsCardLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  programName: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  programMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  snapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  snap: { flex: 1, alignItems: 'center' },
  snapValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  snapLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  snapLine: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  signOut: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
});
