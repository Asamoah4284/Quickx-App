import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CourseCard } from '@/components/ui/CourseCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, spacing, typography } from '@/constants/theme';
import { categories, levels, priceFilters } from '@/data/categories';
import { courses } from '@/data/courses';

export default function LearnScreen() {
  const params = useLocalSearchParams();
  const [query, setQuery] = useState(params.q || '');
  const [category, setCategory] = useState(params.category || 'all');
  const [level, setLevel] = useState('all');
  const [price, setPrice] = useState('all');
  const [rating, setRating] = useState('all');

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const q = String(query).toLowerCase();
      const matchesQ =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.includes(q);
      const matchesCat = category === 'all' || c.category === category;
      const matchesLevel = level === 'all' || c.level === level;
      const matchesRating = rating === 'all' || c.rating >= Number(rating);
      let matchesPrice = true;
      if (price === 'free') matchesPrice = c.price === 0;
      if (price === 'under100') matchesPrice = c.price > 0 && c.price < 100;
      if (price === 'under300') matchesPrice = c.price > 0 && c.price < 300;
      if (price === 'premium') matchesPrice = c.price >= 300;
      return matchesQ && matchesCat && matchesLevel && matchesRating && matchesPrice;
    });
  }, [query, category, level, price, rating]);

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.md }]}>Discover courses</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search courses..."
        style={{ marginBottom: spacing.md }}
      />

      <Text style={styles.filterLabel}>Category</Text>
      <FilterChips
        options={[{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label }))]}
        selected={category}
        onSelect={setCategory}
        style={{ marginBottom: spacing.md }}
      />

      <Text style={styles.filterLabel}>Level</Text>
      <FilterChips
        options={[{ id: 'all', label: 'All levels' }, ...levels.map((l) => ({ id: l, label: l }))]}
        selected={level}
        onSelect={setLevel}
        style={{ marginBottom: spacing.md }}
      />

      <Text style={styles.filterLabel}>Price</Text>
      <FilterChips
        options={priceFilters}
        selected={price}
        onSelect={setPrice}
        style={{ marginBottom: spacing.md }}
      />

      <Text style={styles.filterLabel}>Rating</Text>
      <FilterChips
        options={[
          { id: 'all', label: 'Any' },
          { id: '4.5', label: '4.5+' },
          { id: '4.8', label: '4.8+' },
        ]}
        selected={rating}
        onSelect={setRating}
        style={{ marginBottom: spacing.lg }}
      />

      <Text style={typography.caption}>{filtered.length} courses</Text>
      <View style={{ marginTop: spacing.md }}>
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterLabel: {
    ...typography.small,
    color: colors.muted,
    marginBottom: spacing.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
