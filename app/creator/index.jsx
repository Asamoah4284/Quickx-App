import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import { listingStatusLabel, listingStatusTone } from '@/utils/instructorCourses';
import {
  fetchCreatorDashboard,
  formatShortDate,
  mapDashboardCourse,
  mapCreatorPayout,
} from '@/utils/instructorDashboard';
import { formatPriceCedi } from '@/utils/format';

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <FontAwesome name={icon} size={14} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const { approved, syncing, refresh } = useCreatorAccess();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || token === 'local' || !approved) {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError('');
    try {
      setData(await fetchCreatorDashboard(token));
    } catch (loadError) {
      setError(loadError.message || 'Could not load dashboard');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, token]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  const onRefresh = () => {
    setRefreshing(true);
    refresh().finally(() => load());
  };

  const stats = data?.stats || {};
  const recentCourses = (data?.recentCourses || []).map(mapDashboardCourse);
  const recentPayouts = (data?.recentPayouts || []).map(mapCreatorPayout);

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <CreatorAccessGate approved={approved} syncing={syncing}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Text style={styles.lede}>
            Track your teaching business — courses, students, earnings, and payouts in one place.
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <StatCard label="Courses" value={String(stats.totalCourses || 0)} icon="graduation-cap" />
                <StatCard label="Students" value={String(stats.totalStudents || 0)} icon="users" />
                <StatCard label="Revenue" value={formatPriceCedi(stats.totalRevenue || 0)} icon="money" />
                <StatCard label="Rating" value={stats.averageRating ? `${stats.averageRating}/5` : '—'} icon="star" />
              </View>

              <View style={styles.quickRow}>
                <PrimaryButton label="New course" onPress={() => router.push('/creator/courses/new')} style={{ flex: 1 }} />
                <PrimaryButton
                  label="New book"
                  variant="secondary"
                  onPress={() => router.push('/creator/books/new')}
                  style={{ flex: 1 }}
                />
              </View>

              <Text style={styles.sectionTitle}>Recent courses</Text>
              {recentCourses.length ? (
                recentCourses.map((course) => (
                  <Pressable
                    key={course.id}
                    style={styles.rowCard}
                    onPress={() => router.push(`/creator/courses/${course.id}`)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={2}>
                        {course.title}
                      </Text>
                      <Text style={styles.rowMeta}>
                        Updated {formatShortDate(course.updatedAt) || 'recently'}
                      </Text>
                    </View>
                    <Badge
                      label={listingStatusLabel(course.listingStatus)}
                      tone={listingStatusTone(course.listingStatus)}
                    />
                  </Pressable>
                ))
              ) : (
                <EmptyState icon="book" title="No courses yet" subtitle="Create your first teaching course." />
              )}

              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Recent payouts</Text>
              {recentPayouts.length ? (
                recentPayouts.map((payout) => (
                  <View key={payout.id} style={styles.rowCard}>
                    <View>
                      <Text style={styles.rowTitle}>{formatPriceCedi(payout.amount)}</Text>
                      <Text style={styles.rowMeta}>{formatShortDate(payout.requestedAt)}</Text>
                    </View>
                    <Badge label={payout.status} tone={payout.status === 'paid' ? 'success' : 'warning'} />
                  </View>
                ))
              ) : (
                <Text style={styles.emptyLine}>No payouts yet.</Text>
              )}
            </>
          )}
        </ScrollView>
      </CreatorAccessGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  error: { color: colors.danger, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  emptyLine: { color: colors.muted, fontSize: 13 },
});
