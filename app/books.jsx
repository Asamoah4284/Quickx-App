import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Badge, Icon, Input, Rise, Tabs, Txt } from '@/components/ui/kit';
import { Page, RoundButton } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { BOOK_TYPE, mapBook } from '@/utils/catalog';
import { formatPriceCedi } from '@/utils/format';
import { themed } from '@/utils/themedStyles';

function BookTile({ book }) {
  return (
    <PressableScale onPress={() => router.push(`/book/${book.id}`)} style={styles.tile} scaleTo={0.97}>
      <View style={styles.coverWrap}>
        {book.cover ? (
          <Image source={{ uri: assetUrl(book.cover) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Icon name="book" size={28} color={t.fgSubtle} />
        )}
      </View>
      <Badge label={BOOK_TYPE[book.type] || 'Book'} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
      <Txt size={14} weight="semibold" numberOfLines={2} style={{ marginTop: 6 }}>
        {book.title}
      </Txt>
      <Txt size={12} color={t.fgSubtle} numberOfLines={1}>
        {book.author}
      </Txt>
      <Txt size={14} weight="bold" color={t.brand300} tabular style={{ marginTop: 4 }}>
        {formatPriceCedi(book.price)}
      </Txt>
    </PressableScale>
  );
}

export default function BooksScreen() {
  const { cartBookIds } = useAppState();
  const { data, error, refresh, refreshing } = useApi('/books');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const books = useMemo(() => {
    const list = (Array.isArray(data) ? data : data?.books || data?.data || []).map(mapBook);
    const q = search.trim().toLowerCase();
    return list.filter((b) => (type === 'all' || b.type === type) && (!q || `${b.title} ${b.author}`.toLowerCase().includes(q)));
  }, [data, type, search]);

  return (
    <Page
      back
      eyebrow="Books"
      title="Read and level up"
      subtitle="E-books you can read in the app, and hardcopies delivered to you."
      right={
        cartBookIds.length ? <RoundButton icon="shopping-bag" label="Cart" badge={cartBookIds.length} onPress={() => router.push('/book/cart')} /> : null
      }
      refreshing={refreshing}
      onRefresh={refresh}>
      <View style={{ gap: 14 }}>
        <Input icon="search" value={search} onChangeText={setSearch} placeholder="Search books" returnKeyType="search" />
        <Tabs
          value={type}
          onChange={setType}
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'digital', label: 'E-books' },
            { value: 'physical', label: 'Hardcopies' },
          ]}
        />
        {error ? <Alert>{error.message}</Alert> : null}
        {!data && !error ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.tile}>
                <Skeleton height={200} radius={14} />
              </View>
            ))}
          </View>
        ) : null}
        {data && !books.length ? <EmptyState icon="book" title="No books found" subtitle={search ? 'Try another search.' : undefined} /> : null}
        <View style={styles.grid}>
          {books.map((book, i) => (
            <Rise key={book.id} index={i} style={styles.cell}>
              <BookTile book={book} />
            </Rise>
          ))}
        </View>
      </View>
    </Page>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    cell: { width: '50%', paddingHorizontal: 6, marginBottom: 18 },
    tile: { width: '100%' },
    coverWrap: { width: '100%', aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' },
  })
);
