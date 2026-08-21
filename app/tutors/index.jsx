import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { TutorCard } from '@/components/ui/TutorCard';
import { spacing, typography } from '@/constants/theme';
import { categories } from '@/data/categories';
import { tutors } from '@/data/tutors';

export default function TutorsScreen() {
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(params.category || 'all');

  const filtered = useMemo(() => {
    return tutors.filter((t) => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.expertise.some((e) => e.toLowerCase().includes(q));
      const matchesCat = category === 'all' || t.category === category;
      return matchesQ && matchesCat;
    });
  }, [query, category]);

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.md }]}>Find a tutor</Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search tutors or skills..."
        style={{ marginBottom: spacing.md }}
      />
      <FilterChips
        options={[{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label }))]}
        selected={category}
        onSelect={setCategory}
        style={{ marginBottom: spacing.lg }}
      />
      <Text style={[typography.caption, styles.count]}>{filtered.length} tutors</Text>
      {filtered.map((t) => (
        <TutorCard key={t.id} tutor={t} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { marginBottom: spacing.md },
});
