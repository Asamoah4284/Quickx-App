import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import { fetchCreatorStudents, mapStudentEnrollment } from '@/utils/instructorDashboard';

export default function CreatorStudentsScreen() {
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
      const data = await fetchCreatorStudents(token);
      setItems(data.map(mapStudentEnrollment));
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
          <Text style={styles.lede}>See who is enrolled in your courses and how far they have progressed.</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.title}>{item.studentName}</Text>
                <Text style={styles.meta}>{item.courseTitle}</Text>
                {item.studentEmail ? <Text style={styles.meta}>{item.studentEmail}</Text> : null}
                <Text style={styles.progress}>{item.progressPercent}% complete</Text>
              </View>
            ))
          ) : (
            <EmptyState icon="users" title="No enrolled students yet" subtitle="Students appear here after they enroll in your courses." />
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
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  progress: { color: colors.primary, fontWeight: '700', marginTop: 8 },
});
