import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { CourseWizard } from '@/components/creator/CourseWizard';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';

export default function CreatorCourseEditorScreen() {
  const { courseId } = useLocalSearchParams();
  const { token } = useAppState();
  const { approved, syncing } = useCreatorAccess();
  const id = String(courseId || '');
  const isNew = id === 'new';

  if (syncing) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: isNew ? 'New course' : 'Edit course' }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!approved) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Edit course' }} />
        <Text style={styles.muted}>Creator approval is required to manage courses.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: isNew ? 'New course' : 'Edit course' }} />
      <CourseWizard courseId={id} token={token} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  muted: { color: colors.muted, textAlign: 'center' },
});
