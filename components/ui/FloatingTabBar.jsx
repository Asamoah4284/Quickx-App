import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/kit';
import { t } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import { themed } from '@/utils/themedStyles';

export const TABS = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'courses', label: 'Courses', icon: 'play-circle' },
  { name: 'signals', label: 'Signals', icon: 'activity' },
  { name: 'community', label: 'Community', icon: 'users' },
  { name: 'account', label: 'Account', icon: 'user' },
];

/** A floating bar with a pill that slides to the open tab. */
export function FloatingTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / TABS.length;
  const activeName = state.routes[state.index]?.name;
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.name === activeName));
  const x = useSharedValue(0);

  useEffect(() => {
    if (slot) x.value = withSpring(activeIndex * slot, { damping: 18, stiffness: 220, mass: 0.7 });
  }, [activeIndex, slot, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: slot }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 12)}>
        {slot ? (
          <Animated.View style={[styles.pillSlot, pill]}>
            <View style={styles.pill} />
          </Animated.View>
        ) : null}
        {TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const focused = activeName === tab.name;
          const color = focused ? t.fg : t.fgSubtle;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptics.select();
              navigation.navigate(route.name);
            }
          };
          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={focused ? { selected: true } : {}}
              style={styles.tab}>
              <Feather name={tab.icon} size={20} color={focused ? t.brand300 : color} />
              <Txt size={10.5} weight={focused ? 'bold' : 'semibold'} color={color} numberOfLines={1}>
                {tab.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
    bar: {
      flexDirection: 'row',
      padding: 6,
      borderRadius: 26,
      backgroundColor: t.tabBar,
      borderWidth: 1,
      borderColor: t.lineStrong,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 16,
    },
    pillSlot: { position: 'absolute', top: 6, bottom: 6, left: 6, paddingHorizontal: 2 },
    pill: { flex: 1, borderRadius: 20, backgroundColor: t.brandSoft, borderWidth: 1, borderColor: 'rgba(91,143,255,0.35)' },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8 },
  })
);
