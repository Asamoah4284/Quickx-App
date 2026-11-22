import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CourseProgressRow, CourseTile } from '@/components/courses/CourseTile';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Input, Rise, SectionTitle, Tabs } from '@/components/ui/kit';
import { Page, RoundButton } from '@/components/ui/Page';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';

const LEVEL_TABS = [
  { value: 'all', label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function CoursesScreen() {
  const { isSignedIn } = useAppState();
  const list = useApi('/courses?courseType=forex');
  const mine = useApi(isSignedIn ? '/courses/user/purchased' : null, { refetchOnFocus: true });
  const [level, setLevel] = useState('all');
  const [query, setQuery] = useState('');

  const courses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (Array.isArray(list.data) ? list.data : [])
      .filter((c) => c.listingStatus !== 'archived' && c.listingStatus !== 'draft')
      .filter((c) => level === 'all' || c.level === level)
      .filter((c) => !q || `${c.title} ${c.shortDescription || ''}`.toLowerCase().includes(q));
  }, [list.data, level, query]);

  const started = (Array.isArray(mine.data) ? mine.data : []).slice(0, 3);

  return (
    <Page
      tabs
      eyebrow="Courses"
      title="Learn to trade, step by step"
      subtitle="Video lessons from the basics to advanced strategy. Start with the free previews."
      right={<RoundButton icon="download" label="Downloads" onPress={() => router.push('/downloads')} />}
      refreshing={list.refreshing}
      onRefresh={() => Promise.all([list.refresh(), mine.refresh()])}>
      {started.length ? (
        <View style={{ marginBottom: 26 }}>
          <SectionTitle title="Continue learning" />
          <View style={{ gap: 10 }}>
            {started.map((c, i) => (
              <Rise key={c.id} index={i}>
                <CourseProgressRow course={c} />
              </Rise>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 12, marginBottom: 18 }}>
        <Input icon="search" value={query} onChangeText={setQuery} placeholder="Search courses" returnKeyType="search" />
        <Tabs tabs={LEVEL_TABS} value={level} onChange={setLevel} />
      </View>

      {list.error ? <Alert>{list.error.message}</Alert> : null}
      {list.loading && !list.data ? <SkeletonList count={2} imageHeight={180} /> : null}
      {list.data && !courses.length ? <EmptyState icon="search" title="No courses match" subtitle="Try another level or search word." /> : null}
      <View style={{ gap: 16 }}>
        {courses.map((course, i) => (
          <Rise key={course._id} index={i}>
            <CourseTile course={course} />
          </Rise>
        ))}
      </View>
    </Page>
  );
}
