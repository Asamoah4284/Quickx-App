import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/ui/BookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radii, spacing } from '@/constants/theme';
import { fetchBooks } from '@/utils/catalog';

const TYPE_FILTERS = [
  { id: 'all', label: 'All books' },
  { id: 'digital', label: 'E-books' },
  { id: 'physical', label: 'Hardcopy' },
];

export default function BooksScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchBooks()
      .then((list) => {
        if (alive) setBooks(list);
      })
      .catch(() => {
        if (alive) setBooks([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q);
      const matchesType = type === 'all' || b.type === type;
      return matchesQ && matchesType;
    });
  }, [query, type, books]);

  const featured = filtered[0] || null;
  const gridBooks = featured ? filtered.slice(1) : filtered;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Marketplace</Text>
          <Text style={styles.title}>Books</Text>
          <Text style={styles.lede}>
            Premium reads from QuickX creators — digital downloads and hardcopy editions, curated for learners.
          </Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or author…"
          style={styles.search}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {TYPE_FILTERS.map((item) => {
            const active = type === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setType(item.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <FontAwesome name="book" size={14} color={colors.primary} />
            <Text style={styles.statText}>
              {loading ? 'Loading…' : `${filtered.length} title${filtered.length === 1 ? '' : 's'}`}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <Text style={styles.statHint}>Full cover preview · Instant wallet checkout</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : filtered.length ? (
          <>
            {featured ? <BookCard book={featured} variant="featured" /> : null}

            {gridBooks.length ? (
              <>
                <Text style={styles.section}>Browse collection</Text>
                <View style={styles.grid}>
                  {gridBooks.map((book) => (
                    <View key={book.id} style={styles.gridItem}>
                      <BookCard book={book} variant="grid" />
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="book"
            title="No books found"
            subtitle="Try another search or filter to discover more titles."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  lede: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    maxWidth: 340,
  },
  search: { marginBottom: spacing.lg },
  filters: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  statHint: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '47.5%',
  },
});
