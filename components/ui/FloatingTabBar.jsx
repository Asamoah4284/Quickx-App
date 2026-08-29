import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii } from '@/constants/theme';

const TAB_ORDER = ['index', 'mentorship', 'learn', 'books', 'profile'];

const ICONS = {
  index: { set: 'fa', name: 'home' },
  mentorship: { set: 'fa', name: 'handshake-o' },
  learn: { set: 'fa', name: 'graduation-cap' },
  books: { set: 'ion', name: 'book-outline', activeName: 'book' },
  profile: { set: 'fa', name: 'user' },
};

function TabIcon({ tabKey, color, focused, size = 22 }) {
  const config = ICONS[tabKey] || ICONS.index;
  if (config.set === 'ion') {
    const name = focused && config.activeName ? config.activeName : config.name;
    return <Ionicons name={name} size={size} color={color} />;
  }
  return <FontAwesome name={config.name} size={size} color={color} />;
}

function routeKey(name) {
  return String(name).split('/')[0];
}

export function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  const visibleRoutes = TAB_ORDER.map((key) =>
    state.routes.find((route) => routeKey(route.name) === key)
  ).filter(Boolean);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const key = routeKey(route.name);
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title || key;

        const routeIndex = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === routeIndex;
        const isCenter = key === 'learn';
        const color = isFocused ? colors.navyMid : colors.tabInactive;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={styles.centerSlot}>
              <View style={[styles.centerBtn, isFocused && styles.centerBtnActive]}>
                <FontAwesome name="graduation-cap" size={22} color={colors.white} />
              </View>
              <Text style={[styles.centerLabel, isFocused && styles.centerLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            style={styles.tab}>
            <TabIcon tabKey={key} color={color} focused={isFocused} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    minHeight: 62,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerSlot: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -22,
    gap: 4,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  centerBtnActive: {
    backgroundColor: colors.goldDark,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.tabInactive,
  },
  centerLabelActive: {
    color: colors.navyMid,
    fontWeight: '700',
  },
});
