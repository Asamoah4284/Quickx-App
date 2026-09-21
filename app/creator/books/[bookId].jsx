import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BookWizard } from '@/components/creator/BookWizard';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';

export default function CreatorBookEditorScreen() {
  const { bookId } = useLocalSearchParams();
  const { token } = useAppState();
  const { approved, syncing } = useCreatorAccess();
  const id = String(bookId || '');
  const isNew = id === 'new';

  if (syncing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!approved) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Creator approval is required to manage books.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BookWizard bookId={id} token={token} />
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
