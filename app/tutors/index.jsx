import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { TutorCard } from '@/components/ui/TutorCard';
import { colors, spacing, typography } from '@/constants/theme';
import { categories } from '@/data/categories';
import { fetchTutors } from '@/utils/catalog';

export default function TutorsScreen() {
  const params = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(params.category ? String(params.category) : 'all');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.category) setCategory(String(params.category));
  }, [params.category]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTutors()
      .then((list) => {
        if (alive) setTutors(list);
      })
      .catch(() => {
        if (alive) setTutors([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const cat = String(category).toLowerCase();
    return tutors.filter((t) => {
      const matchesQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.bio.toLowerCase().includes(q) ||
        t.expertise.some((e) => e.toLowerCase().includes(q));
      const matchesCat =
        category === 'all' ||
        String(t.category).toLowerCase() === cat ||
        t.expertise.some((e) => e.toLowerCase().includes(cat)) ||
        (t.teachingCategories || []).some((e) => String(e).toLowerCase().includes(cat));
      return matchesQ && matchesCat;
    });
  }, [tutors, query, category]);

  const chipOptions = useMemo(() => {
    const fromTutors = [
      ...new Set(
        tutors
          .flatMap((t) => [t.category, ...(t.teachingCategories || []), ...t.expertise])
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      ),
    ].slice(0, 10);
    const extras = fromTutors
      .filter((label) => !categories.some((c) => c.id === label.toLowerCase() || c.label === label))
      .map((label) => ({ id: label.toLowerCase(), label }));
    return [{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label })), ...extras];
  }, [tutors]);

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
        options={chipOptions}
        selected={category}
        onSelect={setCategory}
        style={{ marginBottom: spacing.lg }}
      />
      <Text style={[typography.caption, styles.count]}>
        {loading ? 'Loading tutors…' : `${filtered.length} tutors`}
      </Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length ? (
        filtered.map((t) => <TutorCard key={t.id} tutor={t} />)
      ) : (
        <EmptyState
          icon="users"
          title="No tutors found"
          subtitle="Try another search, or check back when more creators are approved."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { marginBottom: spacing.md },
  loader: { paddingVertical: spacing.xxxl, alignItems: 'center' },
});
