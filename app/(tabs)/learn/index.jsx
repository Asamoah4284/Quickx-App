import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/components/ui/CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radii, spacing } from '@/constants/theme';
import { categories, levels, priceFilters } from '@/data/categories';
import { toGhs } from '@/utils/currency';
import { fetchCourses } from '@/utils/catalog';

const RATING_OPTIONS = [
  { id: 'all', label: 'Any rating' },
  { id: '4.5', label: '4.5+' },
  { id: '4.8', label: '4.8+' },
];

export default function CoursesScreen() {
  const params = useLocalSearchParams();
  const [query, setQuery] = useState(params.q ? String(params.q) : '');
  const [category, setCategory] = useState(params.category ? String(params.category) : 'all');
  const [level, setLevel] = useState('all');
  const [price, setPrice] = useState('all');
  const [rating, setRating] = useState('all');
  const [draft, setDraft] = useState({ level: 'all', price: 'all', rating: 'all' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchCourses()
      .then((list) => {
        if (alive) setCourses(list);
      })
      .catch(() => {
        if (alive) setCourses([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (params.q) setQuery(String(params.q));
    if (params.category) setCategory(String(params.category));
  }, [params.q, params.category]);

  const activeFilterCount = [level !== 'all', price !== 'all', rating !== 'all'].filter(Boolean).length;

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const q = String(query).toLowerCase();
      const matchesQ =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchesCat = category === 'all' || String(c.category).toLowerCase() === String(category).toLowerCase();
      const matchesLevel = level === 'all' || String(c.level).toLowerCase() === String(level).toLowerCase();
      const matchesRating = rating === 'all' || Number(c.rating) >= Number(rating);
      let matchesPrice = true;
      if (price === 'free') matchesPrice = c.price === 0;
      const ghs = toGhs(c.price); // filters are labelled in cedis
      if (price === 'under100') matchesPrice = ghs > 0 && ghs < 100;
      if (price === 'under300') matchesPrice = ghs > 0 && ghs < 300;
      if (price === 'premium') matchesPrice = ghs >= 300;
      return matchesQ && matchesCat && matchesLevel && matchesRating && matchesPrice;
    });
  }, [courses, query, category, level, price, rating]);

  const openFilters = () => {
    setDraft({ level, price, rating });
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setLevel(draft.level);
    setPrice(draft.price);
    setRating(draft.rating);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraft({ level: 'all', price: 'all', rating: 'all' });
    setLevel('all');
    setPrice('all');
    setRating('all');
    setFiltersOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Catalog</Text>
          <Text style={styles.title}>Courses</Text>
          <Text style={styles.lede}>Curated programs from practitioners — built to take you from first lesson to certificate.</Text>
        </View>

        <View style={styles.searchRow}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search the catalog"
            style={styles.search}
          />
          <Pressable
            onPress={openFilters}
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}>
            <FontAwesome
              name="sliders"
              size={16}
              color={activeFilterCount > 0 ? colors.white : colors.text}
            />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topics}>
          {[{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label }))].map(
            (item) => {
              const active = category === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  style={[styles.topic, active && styles.topicActive]}>
                  <Text style={[styles.topicText, active && styles.topicTextActive]}>{item.label}</Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        <View style={styles.countRow}>
          <Text style={styles.count}>{filtered.length} {filtered.length === 1 ? 'course' : 'courses'}</Text>
        </View>

        {loading ? (
          <Text style={styles.count}>Loading courses…</Text>
        ) : filtered.length ? (
          filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              layout="row"
              subtitle={course.tutorName}
            />
          ))
        ) : (
          <EmptyState
            icon="search"
            title="No matching courses"
            subtitle="Try another topic or clear your filters."
          />
        )}
      </ScrollView>

      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Refine</Text>
            <Text style={styles.sheetHint}>Narrow the catalog without leaving the page.</Text>

            <Text style={styles.sheetLabel}>Level</Text>
            <FilterChips
              options={[{ id: 'all', label: 'All levels' }, ...levels.map((l) => ({ id: l, label: l }))]}
              selected={draft.level}
              onSelect={(id) => setDraft((d) => ({ ...d, level: id }))}
            />

            <Text style={[styles.sheetLabel, { marginTop: spacing.lg }]}>Price</Text>
            <FilterChips
              options={priceFilters}
              selected={draft.price}
              onSelect={(id) => setDraft((d) => ({ ...d, price: id }))}
            />

            <Text style={[styles.sheetLabel, { marginTop: spacing.lg }]}>Rating</Text>
            <FilterChips
              options={RATING_OPTIONS}
              selected={draft.rating}
              onSelect={(id) => setDraft((d) => ({ ...d, rating: id }))}
            />

            <View style={styles.sheetActions}>
              <PrimaryButton label="Reset" variant="secondary" onPress={resetFilters} style={{ flex: 1 }} />
              <PrimaryButton label="Show results" onPress={applyFilters} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  search: {
    flex: 1,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.navy,
  },
  topics: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  topic: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  topicActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  topicTextActive: {
    color: colors.white,
  },
  countRow: {
    marginBottom: spacing.md,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  sheetHint: {
    marginTop: 4,
    marginBottom: spacing.xl,
    color: colors.muted,
    fontSize: 14,
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
});
