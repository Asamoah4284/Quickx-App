import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { SkeletonList } from '@/components/ui/Skeleton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchMyCertificates } from '@/utils/certificates';

function formatDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CertificatesScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const [data, setData] = useState({ certificates: [], completedWithoutCertificate: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await fetchMyCertificates(token));
    } catch (err) {
      setError(err.message || 'Could not load certificates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <FlatList
      style={styles.root}
      data={loading ? [] : data.certificates}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
      renderItem={({ item }) => (
        <PressableScale style={styles.card} onPress={() => router.push(`/certificates/${item.code}`)}>
          <View style={styles.badge}>
            <FontAwesome name="certificate" size={22} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {item.courseTitle}
            </Text>
            <Text style={styles.meta}>
              Completed {formatDate(item.completedAt)} · {item.instructorName}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={colors.muted} />
        </PressableScale>
      )}
      ListEmptyComponent={
        loading ? (
          <SkeletonList count={2} imageHeight={0} gap={spacing.md} />
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <FontAwesome name="certificate" size={30} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>{error ? 'Couldn’t load certificates' : 'No certificates yet'}</Text>
            <Text style={styles.emptySub}>
              {error ||
                (data.completedWithoutCertificate > 0
                  ? `You’ve finished ${data.completedWithoutCertificate} course${data.completedWithoutCertificate === 1 ? '' : 's'} that don’t offer certificates. Finish a course marked “Certificate” to earn one.`
                  : 'Finish every lesson in a course marked “Certificate” to earn one you can share.')}
            </Text>
            <Pressable style={styles.cta} onPress={error ? load : () => router.push('/my-courses')}>
              <Text style={styles.ctaText}>{error ? 'Try again' : 'Continue learning'}</Text>
            </Pressable>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF7E0', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF7E0', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  emptySub: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  cta: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.full },
  ctaText: { color: colors.white, fontWeight: '700' },
});
