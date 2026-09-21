import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function CreatorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.surface },
      }}>
      <Stack.Screen name="index" options={{ title: 'Creator studio' }} />
      <Stack.Screen name="courses/index" options={{ title: 'My teaching courses' }} />
      <Stack.Screen name="courses/[courseId]" options={{ title: 'Edit course' }} />
      <Stack.Screen name="books/index" options={{ title: 'My books' }} />
      <Stack.Screen name="books/[bookId]" options={{ title: 'Edit book' }} />
      <Stack.Screen name="students/index" options={{ title: 'Students' }} />
      <Stack.Screen name="reviews/index" options={{ title: 'Reviews' }} />
      <Stack.Screen name="earnings/index" options={{ title: 'Earnings' }} />
      <Stack.Screen name="payouts/index" options={{ title: 'Payouts' }} />
      <Stack.Screen name="community/index" options={{ title: 'Community' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Creator profile' }} />
    </Stack>
  );
}
