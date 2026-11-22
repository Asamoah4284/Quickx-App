import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Button, Card, IconBox, Row, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { layout, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatBytes, listOfflineLessons, offlineSupported, removeAllOfflineLessons, removeOfflineLesson } from '@/utils/offlineLessons';
import { themed } from '@/utils/themedStyles';

const shortDate = (value) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

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
    Alert.alert('Remove all downloads?', `Frees ${formatBytes(totalBytes)} on this phone.`, [
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
      <Page back title="Downloads">
        <EmptyState icon="download" title="Downloads work in the phone app" subtitle="Install QuickX Learn on your phone to save lessons." />
      </Page>
    );
  }

  return (
    <Page
      back
      title="Downloads"
      subtitle={items.length ? `${items.length} lesson${items.length === 1 ? '' : 's'} · ${formatBytes(totalBytes)} on this phone` : 'Watch lessons without internet.'}>
      {loaded && !items.length ? (
        <EmptyState icon="download" title="No downloads yet" subtitle="Open a lesson in a course you have and tap Download to watch it anywhere.">
          <Button label="Browse courses" onPress={() => router.push('/courses')} />
        </EmptyState>
      ) : null}

      {items.length ? (
        <>
          <Card padded={false}>
            {items.map((item, i) => (
              <PressableScale
                key={`${item.courseId}:${item.lessonId}`}
                haptic="select"
                style={[styles.row, i < items.length - 1 && styles.divider]}
                onPress={() => router.push({ pathname: '/downloads/play', params: { courseId: item.courseId, lessonId: item.lessonId } })}>
                <IconBox name="play" size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={14.5} weight="semibold" numberOfLines={2}>
                    {item.lessonTitle || 'Lesson'}
                  </Txt>
                  <Txt size={12} color={t.fgSubtle} numberOfLines={1} style={{ marginTop: 2 }}>
                    {[item.courseTitle, item.size ? formatBytes(item.size) : '', item.expiresAt ? `until ${shortDate(item.expiresAt)}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </Txt>
                </View>
                <Pressable onPress={() => remove(item)} hitSlop={8} accessibilityLabel="Remove download" style={styles.trash}>
                  <Feather name="trash-2" size={17} color={t.fgMuted} />
                </Pressable>
              </PressableScale>
            ))}
          </Card>
          <Row justify="center" style={{ marginTop: layout.section }}>
            <Button label="Remove all downloads" variant="ghost" icon="trash-2" onPress={removeAll} />
          </Row>
        </>
      ) : null}
    </Page>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: layout.card, paddingVertical: 12 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
    trash: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tint },
  })
);
