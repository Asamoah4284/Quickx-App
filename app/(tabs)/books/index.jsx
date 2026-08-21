import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { BookCard } from '@/components/ui/BookCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { spacing, typography } from '@/constants/theme';
import { books } from '@/data/books';
import { categories } from '@/data/categories';

export default function BooksScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q);
      const matchesType = type === 'all' || b.type === type;
      const matchesCat = category === 'all' || b.category === category;
      return matchesQ && matchesType && matchesCat;
    });
  }, [query, type, category]);

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.md }]}>Book marketplace</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search books..."
        style={{ marginBottom: spacing.md }}
      />
      <FilterChips
        options={[
          { id: 'all', label: 'All types' },
          { id: 'digital', label: 'Digital' },
          { id: 'physical', label: 'Physical' },
          { id: 'bundle', label: 'Bundles' },
        ]}
        selected={type}
        onSelect={setType}
        style={{ marginBottom: spacing.sm }}
      />
      <FilterChips
        options={[{ id: 'all', label: 'All topics' }, ...categories.map((c) => ({ id: c.id, label: c.label }))]}
        selected={category}
        onSelect={setCategory}
        style={{ marginBottom: spacing.lg }}
      />
      <Text style={[typography.caption, styles.count]}>{filtered.length} books</Text>
      {filtered.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { marginBottom: spacing.md },
});
