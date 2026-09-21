import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import {
  BOOK_STATUS_FILTERS,
  bookStatusLabel,
  bookStatusTone,
  deleteInstructorBook,
  fetchInstructorBooks,
  submitInstructorBook,
} from '@/utils/instructorBooks';
import { formatPriceCedi } from '@/utils/format';

export default function CreatorBooksScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const { approved, syncing, refresh } = useCreatorAccess();
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || token === 'local' || !approved) {
      setBooks([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError('');
    try {
      setBooks(await fetchInstructorBooks(token, filter));
    } catch (loadError) {
      setError(loadError.message || 'Could not load books');
      setBooks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, filter, token]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  const onRefresh = () => {
    setRefreshing(true);
    refresh().finally(() => load());
  };

  const runAction = async (bookId, action, title) => {
    try {
      if (action === 'submit') {
        await submitInstructorBook(token, bookId);
        Alert.alert('Submitted', 'Your book was sent for review.');
      } else if (action === 'delete') {
        await deleteInstructorBook(token, bookId);
        Alert.alert('Deleted', 'Book removed.');
      }
      load();
    } catch (actionError) {
      Alert.alert('Action failed', actionError.message || 'Try again.');
    }
  };

  const openActions = (book) => {
    const options = [{ text: 'Edit', onPress: () => router.push(`/creator/books/${book.id}`) }];
    if (['draft', 'rejected'].includes(book.listingStatus)) {
      options.push({ text: 'Submit for review', onPress: () => runAction(book.id, 'submit') });
    }
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () =>
        Alert.alert('Delete book?', `Remove "${book.title}" permanently?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => runAction(book.id, 'delete', book.title) },
        ]),
    });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(book.title, 'Choose an action', options);
  };

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <CreatorAccessGate approved={approved} syncing={syncing}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Text style={styles.lede}>Create and manage books for the QuickX store — same workflow as the web creator studio.</Text>
          <PrimaryButton label="Create new book" onPress={() => router.push('/creator/books/new')} />
          <FilterChips options={BOOK_STATUS_FILTERS} selected={filter} onSelect={setFilter} style={styles.filters} />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : books.length ? (
            books.map((book) => (
              <Pressable key={book.id} style={styles.card} onPress={() => router.push(`/creator/books/${book.id}`)}>
                {book.thumbnail ? (
                  <Image source={{ uri: book.thumbnail }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <FontAwesome name="book" size={22} color={colors.white} />
                  </View>
                )}
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Badge label={bookStatusLabel(book.listingStatus)} tone={bookStatusTone(book.listingStatus)} />
                  </View>
                  <Text style={styles.meta}>{book.author} · {book.type} · {formatPriceCedi(book.price)}</Text>
                  <View style={styles.actions}>
                    <Pressable style={styles.actionBtn} onPress={() => router.push(`/creator/books/${book.id}`)}>
                      <FontAwesome name="pencil" size={12} color={colors.primary} />
                      <Text style={styles.actionText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => openActions(book)}>
                      <FontAwesome name="ellipsis-h" size={12} color={colors.muted} />
                      <Text style={[styles.actionText, { color: colors.muted }]}>More</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <EmptyState icon="book" title="No books yet" subtitle="Tap Create new book to start your first draft." />
          )}
        </ScrollView>
      </CreatorAccessGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  lede: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  filters: { marginTop: spacing.sm },
  error: { color: colors.danger, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumb: { width: 88, height: 112, backgroundColor: colors.navy },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: spacing.md, gap: 6 },
  titleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  title: { flex: 1, fontWeight: '800', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});
