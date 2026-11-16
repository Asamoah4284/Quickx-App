import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navyMid,
        tabBarInactiveTintColor: colors.tabInactive,
        animation: 'shift',
        // Mount tabs on first visit — avoids five screens fetching at once on app launch.
        lazy: true,
        freezeOnBlur: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mentorship"
        options={{
          title: 'Mentorship',
          tabBarLabel: 'Mentorship',
          tabBarIcon: ({ color }) => <FontAwesome name="handshake-o" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Courses',
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color }) => <FontAwesome name="graduation-cap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: 'Books',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
