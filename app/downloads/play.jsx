import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LessonVideoPlayer } from '@/components/learn/LessonVideoPlayer';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getOfflineLesson } from '@/utils/offlineLessons';

/** Plays a downloaded lesson straight from device storage, so it works with no connection at all. */
export default function OfflinePlayerScreen() {
  const { courseId, lessonId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAppState();
  const [entry, setEntry] = useState(undefined);

  useEffect(() => {
    getOfflineLesson(String(courseId), String(lessonId), user?.id || user?._id).then(setEntry);
  }, [courseId, lessonId, user?.id, user?._id]);

  if (entry === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>This download has expired or was removed.</Text>
        <PrimaryButton label="Back to downloads" variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LessonVideoPlayer uri={entry.uri} title={entry.lessonTitle} subtitle={entry.courseTitle} />
      <View style={styles.body}>
        <Text style={styles.title}>{entry.lessonTitle}</Text>
        <Text style={styles.sub}>{entry.courseTitle} · playing offline</Text>
        <PrimaryButton
          label="Open course"
          variant="secondary"
          onPress={() => router.push(`/learn/${entry.courseId}`)}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050B18' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050B18', padding: spacing.xl },
  missing: { color: colors.white, fontWeight: '700', textAlign: 'center' },
  body: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 4 },
});
