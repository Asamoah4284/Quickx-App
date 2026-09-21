import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchBookContent } from '@/utils/catalog';
import { openExternalUrl } from '@/utils/openUrl';

export default function BookReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAppState();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || token === 'local') {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    fetchBookContent(String(id), token)
      .then((item) => {
        if (alive) setBook(item);
      })
      .catch(() => {
        if (alive) setBook(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, token]);

  if (!token || token === 'local') {
    return (
      <Screen>
        <Text style={typography.h2}>Sign in required</Text>
        <Text style={{ marginTop: spacing.sm, color: colors.muted }}>
          Sign in to read books you have purchased.
        </Text>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!book) {
    return (
      <Screen>
        <Text style={typography.h2}>Access denied</Text>
        <Text style={{ marginTop: spacing.sm, color: colors.muted }}>
          Purchase this book to unlock the full content.
        </Text>
        <PrimaryButton
          label="View book"
          onPress={() => router.replace(`/book/${id}`)}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    );
  }

  const openFile = () => {
    if (!book.fileUrl) {
      Alert.alert('No file', 'This book does not have a downloadable file yet.');
      return;
    }
    openExternalUrl(book.fileUrl).catch(() => Linking.openURL(book.fileUrl));
  };

  return (
    <Screen>
      <Text style={typography.h2}>{book.title}</Text>
      <Text style={typography.caption}>by {book.author}</Text>

      {book.whatYoullLearn?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you'll learn</Text>
          {book.whatYoullLearn.map((line) => (
            <Text key={line} style={styles.bullet}>• {line}</Text>
          ))}
        </View>
      ) : null}

      <Text style={[typography.body, { lineHeight: 22, marginVertical: spacing.lg }]}>
        {book.description}
      </Text>

      {book.fileUrl ? (
        <PrimaryButton label="Open book file" onPress={openFile} />
      ) : (
        <Text style={styles.note}>Digital file will appear here once available.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  bullet: { color: colors.muted, marginBottom: 4, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 13 },
});
