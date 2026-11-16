import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  formatBytes,
  listOfflineLessons,
  offlineSupported,
  removeAllOfflineLessons,
  removeOfflineLesson,
} from '@/utils/offlineLessons';

export default function DownloadsScreen() {
  const router = useRouter();
  const { user } = useAppState();
  const userId = user?.id || user?._id;
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setItems(await listOfflineLessons(userId));
    setLoaded(true);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalBytes = useMemo(() => items.reduce((sum, i) => sum + (Number(i.size) || 0), 0), [items]);

  const remove = (item) =>
    Alert.alert('Remove download?', item.lessonTitle || 'This lesson', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeOfflineLesson(item.courseId, item.lessonId);
          load();
        },
      },
    ]);

  const removeAll = () =>
    Alert.alert('Remove all downloads?', `Frees ${formatBytes(totalBytes)} on this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove all',
        style: 'destructive',
        onPress: async () => {
          await removeAllOfflineLessons(userId);
          load();
        },
      },
    ]);

  if (!offlineSupported) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Downloads are available in the mobile app</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={items}
      keyExtractor={(i) => `${i.courseId}:${i.lessonId}`}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListHeaderComponent={
        items.length ? (
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{items.length} lesson{items.length === 1 ? '' : 's'} saved</Text>
              <Text style={styles.headerMeta}>{formatBytes(totalBytes)} on this device · watch without internet</Text>
            </View>
            <Pressable onPress={removeAll} hitSlop={8}>
              <Text style={styles.clear}>Remove all</Text>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <PressableScale
          style={styles.row}
          onPress={() => router.push({ pathname: '/downloads/play', params: { courseId: item.courseId, lessonId: item.lessonId } })}>
          <View style={styles.play}>
            <FontAwesome name="play" size={14} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {item.lessonTitle || 'Lesson'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.courseTitle}
              {item.size ? ` · ${formatBytes(item.size)}` : ''}
              {item.expiresAt ? ` · until ${new Date(item.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => remove(item)} hitSlop={10} accessibilityLabel="Remove download">
            <FontAwesome name="trash-o" size={18} color={colors.muted} />
          </Pressable>
        </PressableScale>
      )}
      ListEmptyComponent={
        loaded ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <FontAwesome name="download" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptySub}>Open a lesson in a course you own and tap “Download for offline” to watch it anywhere.</Text>
            <Pressable style={styles.cta} onPress={() => router.push('/courses')}>
              <Text style={styles.ctaText}>Browse courses</Text>
            </Pressable>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  clear: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  play: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.lg, flex: 1 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(27,94,245,0.08)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  emptySub: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  cta: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.full },
  ctaText: { color: colors.white, fontWeight: '700' },
});
