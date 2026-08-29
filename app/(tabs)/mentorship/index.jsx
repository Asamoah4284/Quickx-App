import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { MentorshipCard } from '@/components/ui/MentorshipCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radii, spacing } from '@/constants/theme';
import { fetchMentorships } from '@/utils/community';

const FILTERS = [
  { id: 'all', label: 'All sessions' },
  { id: 'premium', label: 'Premium' },
  { id: 'open', label: 'Open access' },
];

export default function MentorshipScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchMentorships());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.mentor.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'premium' && item.isPremium) ||
        (filter === 'open' && !item.isPremium);
      return matchesQ && matchesFilter;
    });
  }, [items, query, filter]);

  const featured =
    filtered.find((item) => item.isPremium) || filtered[0] || null;
  const list = featured ? filtered.filter((item) => item.id !== featured.id) : filtered;

  const onSessionPress = (session) => {
    if (session.isPremium) {
      Alert.alert(session.title, `${session.summary}\n\n${session.date} · ${session.time}`, [
        { text: 'Browse tutors', onPress: () => router.push('/tutors') },
        { text: 'Close', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert(session.title, `${session.summary}\n\nMentor: ${session.mentor}\n${session.date} · ${session.time}`, [
      { text: 'OK' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>1-on-1 guidance</Text>
          <Text style={styles.title}>Mentorship</Text>
          <Text style={styles.lede}>
            Live mentorship from QuickX creators — Forex, business, career, and digital skills with structured sessions.
          </Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search sessions or mentors…"
          style={styles.search}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <FontAwesome name="handshake-o" size={14} color={colors.primary} />
            <Text style={styles.statText}>
              {loading ? 'Loading…' : `${filtered.length} session${filtered.length === 1 ? '' : 's'}`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <Text style={styles.statHint}>Diamond plans unlock premium mentorship</Text>
        </View>

        <View style={styles.perks}>
          <View style={styles.perk}>
            <FontAwesome name="video-camera" size={14} color={colors.primary} />
            <Text style={styles.perkText}>Live guidance</Text>
          </View>
          <View style={styles.perk}>
            <FontAwesome name="certificate" size={14} color={colors.gold} />
            <Text style={styles.perkText}>Premium tracks</Text>
          </View>
          <View style={styles.perk}>
            <FontAwesome name="users" size={14} color={colors.primary} />
            <Text style={styles.perkText}>Expert mentors</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : filtered.length ? (
          <>
            {featured ? (
              <MentorshipCard
                session={featured}
                variant="featured"
                onPress={() => onSessionPress(featured)}
              />
            ) : null}

            {list.length ? (
              <>
                <Text style={styles.section}>Upcoming sessions</Text>
                {list.map((session) => (
                  <MentorshipCard
                    key={session.id}
                    session={session}
                    onPress={() => onSessionPress(session)}
                  />
                ))}
              </>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="users"
            title="No sessions found"
            subtitle="Try another search or filter. Premium mentorship is also available through Diamond tutor plans."
          />
        )}

        <PrimaryButton
          label="Find a mentor"
          variant="secondary"
          onPress={() => router.push('/tutors')}
          style={{ marginTop: spacing.xl }}
        />
        <PrimaryButton
          label="My communities"
          variant="ghost"
          onPress={() => router.push('/communities')}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  lede: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    maxWidth: 340,
  },
  search: { marginBottom: spacing.lg },
  filters: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  statHint: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  perks: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  perk: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  perkText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
});
