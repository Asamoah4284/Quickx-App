import { Tabs } from 'expo-router';

import { FloatingTabBar, TABS } from '@/components/ui/FloatingTabBar';
import { t } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        lazy: true,
        sceneStyle: { backgroundColor: t.bg },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
