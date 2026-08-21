import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, radii, shadow, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatCurrency } from '@/utils/format';

const LINKS = [
  { id: 'wallet', label: 'QuickX Wallet', icon: 'credit-card', href: '/wallet' },
  { id: 'bookings', label: 'My Bookings', icon: 'calendar', href: '/bookings' },
  { id: 'tutors', label: 'Find Tutors', icon: 'users', href: '/tutors' },
  { id: 'notifications', label: 'Notifications', icon: 'bell-o', href: '/notifications' },
  { id: 'saved', label: 'Saved courses', icon: 'bookmark-o', href: '/(tabs)/learn' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { walletBalance, currency, followedTutors, savedCourses } = useAppState();

  return (
    <Screen contentStyle={{ paddingBottom: 110 }}>
      <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Profile</Text>

      <View style={[styles.hero, shadow.card]}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={32} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>QuickX Learner</Text>
          <Text style={typography.caption}>learner@quickxlearn.com</Text>
          <Text style={styles.balance}>{formatCurrency(walletBalance, currency)}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Following" value={String(followedTutors.length)} />
        <Stat label="Saved" value={String(savedCourses.length)} />
      </View>

      {LINKS.map((item) => (
        <Pressable
          key={item.id}
          style={styles.row}
          onPress={() => router.push(item.href)}>
          <View style={styles.rowIcon}>
            <FontAwesome name={item.icon} size={16} color={colors.primary} />
          </View>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <FontAwesome name="chevron-right" size={12} color={colors.muted} />
        </Pressable>
      ))}
    </Screen>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1B5EF514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  balance: { marginTop: 6, fontWeight: '700', color: colors.primary },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.navyMid },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1B5EF514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontWeight: '600', color: colors.text },
});
