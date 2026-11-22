import { router } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';

export default function NotFoundScreen() {
  return (
    <Page back title="Page not found">
      <EmptyState icon="compass" title="This page does not exist" subtitle="The link may be old. Head back to the home screen.">
        <Button label="Go home" onPress={() => router.replace('/')} />
      </EmptyState>
    </Page>
  );
}
