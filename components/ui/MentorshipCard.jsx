import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadow, spacing } from '@/constants/theme';

const ICONS = {
  trading: 'line-chart',
  forex: 'line-chart',
  crypto: 'money',
  business: 'briefcase',
  career: 'suitcase',
  digital: 'laptop',
  webdev: 'code',
  users: 'users',
};

function iconFor(value) {
  const key = String(value || '').toLowerCase();
  return ICONS[key] || 'users';
}

function formatWhen(date, time) {
  const parts = [date, time].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Schedule announced soon';
}

export function MentorshipCard({ session, variant = 'card', onPress }) {
  if (variant === 'featured') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
        <LinearGradient
          colors={['#07152F', '#0C2340', '#1246C4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredBg}>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredEyebrow}>Featured session</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {session.title}
            </Text>
            <Text style={styles.featuredMentor} numberOfLines={1}>
              with {session.mentor}
            </Text>
            <View style={styles.featuredMeta}>
              {session.isPremium ? (
                <View style={styles.premiumLight}>
                  <FontAwesome name="certificate" size={10} color={colors.gold} />
                  <Text style={styles.premiumLightText}>Premium</Text>
                </View>
              ) : (
                <View style={styles.openLight}>
                  <Text style={styles.openLightText}>Open access</Text>
                </View>
              )}
              <Text style={styles.whenLight}>{formatWhen(session.date, session.time)}</Text>
            </View>
          </View>
          <View style={styles.featuredVisual}>
            {session.imageUrl ? (
              <Image source={{ uri: session.imageUrl }} style={styles.featuredImage} resizeMode="cover" />
            ) : (
              <View style={styles.featuredIconWrap}>
                <FontAwesome name={iconFor(session.icon)} size={28} color={colors.white} />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow.card, pressed && styles.pressed]}>
      <LinearGradient colors={['#F8FAFD', '#EEF2F8']} style={styles.visualStage}>
        <View style={styles.badges}>
          {session.isPremium ? (
            <View style={styles.premiumPill}>
              <FontAwesome name="certificate" size={10} color={colors.gold} />
              <Text style={styles.premiumPillText}>Premium</Text>
            </View>
          ) : (
            <View style={styles.openPill}>
              <Text style={styles.openPillText}>Open</Text>
            </View>
          )}
          <View style={styles.iconBadge}>
            <FontAwesome name={iconFor(session.icon)} size={12} color={colors.primary} />
          </View>
        </View>
        {session.imageUrl ? (
          <Image source={{ uri: session.imageUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.iconHero}>
            <FontAwesome name={iconFor(session.icon)} size={34} color={colors.primary} />
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {session.title}
        </Text>
        {session.summary ? (
          <Text style={styles.summary} numberOfLines={3}>
            {session.summary}
          </Text>
        ) : null}
        <View style={styles.mentorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{session.mentor.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mentorLabel}>Mentor</Text>
            <Text style={styles.mentorName} numberOfLines={1}>
              {session.mentor}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.whenRow}>
            <FontAwesome name="calendar" size={11} color={colors.muted} />
            <Text style={styles.when}>{formatWhen(session.date, session.time)}</Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Details</Text>
            <FontAwesome name="chevron-right" size={9} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },

  featured: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  featuredBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: 176,
    gap: spacing.md,
  },
  featuredCopy: { flex: 1 },
  featuredEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featuredTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  featuredMentor: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 6,
  },
  featuredMeta: {
    marginTop: spacing.md,
    gap: 8,
  },
  premiumLight: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232,176,32,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  premiumLightText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  openLight: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  openLightText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  whenLight: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredVisual: {
    width: 108,
    height: 132,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  visualStage: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.navy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  premiumPillText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  openPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  openPillText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '800',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  iconHero: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B5EF514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    gap: 6,
  },
  title: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  summary: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  mentorLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  mentorName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  when: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B5EF514',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  ctaText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});
