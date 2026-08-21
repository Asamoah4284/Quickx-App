import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookCard } from '@/components/ui/BookCard';
import { CourseCard } from '@/components/ui/CourseCard';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TutorCard } from '@/components/ui/TutorCard';
import { colors, radii, shadow, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { books } from '@/data/books';
import { hubTiles } from '@/data/categories';
import { courses } from '@/data/courses';
import { tutors } from '@/data/tutors';
import { formatCurrency } from '@/utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const { walletBalance, currency } = useAppState();
  const [query, setQuery] = useState('');

  const onSearchSubmit = () => {
    if (!query.trim()) return;
    router.push({ pathname: '/(tabs)/learn', params: { q: query.trim() } });
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>QuickXLearn</Text>
          <Text style={typography.caption}>Learn. Grow. Earn skills.</Text>
        </View>
        <Pressable style={styles.bell} onPress={() => router.push('/notifications')}>
          <FontAwesome name="bell-o" size={20} color={colors.text} />
        </Pressable>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search courses, tutors, books..."
        style={{ marginBottom: spacing.lg }}
        onSubmitEditing={onSearchSubmit}
      />

      <Pressable
        style={[styles.walletCard, shadow.card]}
        onPress={() => router.push('/wallet')}>
        <View>
          <Text style={styles.walletLabel}>QuickX Wallet</Text>
          <Text style={styles.walletBalance}>{formatCurrency(walletBalance, currency)}</Text>
        </View>
        <View style={styles.walletAction}>
          <Text style={styles.walletActionText}>Open</Text>
          <FontAwesome name="chevron-right" size={12} color={colors.white} />
        </View>
      </Pressable>

      <Text style={[typography.h3, { marginBottom: spacing.md }]}>Explore</Text>
      <View style={styles.hubGrid}>
        {hubTiles.map((tile) => (
          <Pressable
            key={tile.id}
            style={styles.hubTile}
            onPress={() => router.push(tile.href)}>
            <View style={styles.hubIcon}>
              <FontAwesome name={tile.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.hubLabel}>{tile.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader
        title="Recommended courses"
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/learn')}
        style={{ marginTop: spacing.xl }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {courses.slice(0, 4).map((c) => (
          <CourseCard key={c.id} course={c} horizontal />
        ))}
      </ScrollView>

      <SectionHeader
        title="Top tutors"
        actionLabel="See all"
        onAction={() => router.push('/tutors')}
        style={{ marginTop: spacing.xl }}
      />
      {tutors.slice(0, 2).map((t) => (
        <TutorCard key={t.id} tutor={t} />
      ))}

      <SectionHeader
        title="Bookstore picks"
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/books')}
        style={{ marginTop: spacing.lg }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {books.slice(0, 3).map((b) => (
          <BookCard key={b.id} book={b} horizontal />
        ))}
      </ScrollView>

      <Pressable style={styles.bookingsLink} onPress={() => router.push('/bookings')}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&q=60' }}
          style={styles.bookingsImg}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.bookingsTitle}>My Bookings</Text>
          <Text style={typography.caption}>Upcoming sessions & reminders</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={colors.muted} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  walletLabel: { color: '#7BA3FF', fontWeight: '600', marginBottom: 4 },
  walletBalance: { color: colors.white, fontSize: 26, fontWeight: '800' },
  walletAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletActionText: { color: colors.white, fontWeight: '700' },
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hubTile: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hubIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B5EF514',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  bookingsLink: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingsImg: { width: 48, height: 48, borderRadius: radii.sm },
  bookingsTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
});
