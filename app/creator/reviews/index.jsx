import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import { fetchCreatorReviews, formatShortDate, mapCreatorReview } from '@/utils/instructorDashboard';

export default function CreatorReviewsScreen() {
  const { token } = useAppState();
  const { approved, syncing, refresh } = useCreatorAccess();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local' || !approved) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchCreatorReviews(token);
      setItems(data.map(mapCreatorReview));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, token]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <CreatorAccessGate approved={approved} syncing={syncing}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refresh().finally(() => load());
              }}
            />
          }>
          <Text style={styles.lede}>Monitor learner sentiment and course quality feedback.</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.head}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.studentName}</Text>
                    <Text style={styles.meta}>{item.courseTitle}</Text>
                  </View>
                  <Text style={styles.rating}>{item.rating}/5</Text>
                </View>
                <Text style={styles.comment}>{item.comment || 'No written review provided.'}</Text>
                {item.createdAt ? <Text style={styles.date}>{formatShortDate(item.createdAt)}</Text> : null}
              </View>
            ))
          ) : (
            <EmptyState icon="star" title="No reviews yet" subtitle="Reviews from your students will show up here." />
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  rating: { color: '#D97706', fontWeight: '800', fontSize: 14 },
  comment: { color: colors.text, lineHeight: 20, marginTop: spacing.sm },
  date: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
});
