import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

const LINKS = [
  { href: '/creator', label: 'Overview', icon: 'home', exact: true },
  { href: '/creator/courses', label: 'Courses', icon: 'graduation-cap' },
  { href: '/creator/books', label: 'Books', icon: 'book' },
  { href: '/creator/students', label: 'Students', icon: 'users' },
  { href: '/creator/reviews', label: 'Reviews', icon: 'star' },
  { href: '/creator/earnings', label: 'Earnings', icon: 'line-chart' },
  { href: '/creator/payouts', label: 'Payouts', icon: 'credit-card' },
  { href: '/creator/community', label: 'Community', icon: 'comments' },
  { href: '/creator/settings', label: 'Profile', icon: 'user' },
];

function isActive(pathname, href, exact) {
  if (exact) return pathname === href || pathname === `${href}/index`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CreatorHubNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}>
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        return (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={[styles.chip, active && styles.chipActive]}>
            <FontAwesome name={link.icon} size={12} color={active ? colors.white : colors.muted} />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{link.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function CreatorAccessGate({ approved, syncing, children, fallbackTitle = 'Creator studio' }) {
  if (syncing) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateText}>Checking creator access…</Text>
      </View>
    );
  }

  if (!approved) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>{fallbackTitle}</Text>
        <Text style={styles.gateText}>Complete creator onboarding and get approved to access this area.</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  wrap: {
    maxHeight: 44,
    marginBottom: spacing.md,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.white,
  },
  gate: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  gateTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  gateText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
