import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { LessonVideoPlayer } from '@/components/learn/LessonVideoPlayer';
import { Badge, Button, Loading, Txt } from '@/components/ui/kit';
import { EmptyState } from '@/components/ui/EmptyState';
import { Page } from '@/components/ui/Page';
import { layout, t } from '@/constants/theme';
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
      <Page back>
        <Loading label="Opening your download" />
      </Page>
    );
  }

  if (!entry) {
    return (
      <Page back title="Download not found">
        <EmptyState
          icon="download"
          title="This download has expired or was removed"
          subtitle="Download the lesson again while you have internet.">
          <Button label="Back to downloads" variant="secondary" onPress={() => router.back()} />
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page back>
      <LessonVideoPlayer uri={entry.uri} />
      <View style={{ marginTop: layout.section, gap: 8 }}>
        <Badge label="Playing offline" tone="up" icon="wifi-off" style={{ alignSelf: 'flex-start' }} />
        <Txt size={22} weight="bold" style={{ letterSpacing: -0.4, lineHeight: 28 }}>
          {entry.lessonTitle}
        </Txt>
        <Txt size={14} color={t.fgMuted}>
          {entry.courseTitle}
        </Txt>
      </View>
      <Button
        label="Open course"
        variant="secondary"
        iconRight="arrow-right"
        onPress={() => router.push(`/learn/${entry.courseId}`)}
        style={{ marginTop: layout.section }}
      />
    </Page>
  );
}
