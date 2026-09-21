import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { CourseCard } from '@/components/ui/CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCourses } from '@/utils/catalog';

export default function SavedCoursesScreen() {
  const { savedCourses } = useAppState();
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

  const saved = useMemo(
    () => courses.filter((course) => savedCourses.includes(String(course.id))),
    [courses, savedCourses]
  );

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.sm }]}>Saved courses</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        Courses you bookmarked to revisit later.
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : saved.length ? (
        saved.map((course) => (
          <CourseCard key={course.id} course={course} layout="row" subtitle={course.tutorName} />
        ))
      ) : (
        <EmptyState
          icon="bookmark-o"
          title="No saved courses yet"
          subtitle="Tap the bookmark icon on any course to save it here."
        />
      )}
    </Screen>
  );
}
