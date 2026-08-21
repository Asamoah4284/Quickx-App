import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadow } from '@/constants/theme';

const TAB_ORDER = ['index', 'mentorship', 'learn', 'books', 'profile'];

const ICONS = {
  index: 'home',
  mentorship: 'handshake-o',
  learn: 'graduation-cap',
  books: 'book',
  profile: 'user',
};

function routeKey(name) {
  return String(name).split('/')[0];
}

export function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  const visibleRoutes = TAB_ORDER.map((key) =>
    state.routes.find((route) => routeKey(route.name) === key)
  ).filter(Boolean);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
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
                  <FontAwesome name="graduation-cap" size={24} color={colors.white} />
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
              <FontAwesome name={ICONS[key]} size={22} color={color} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    marginHorizontal: 14,
    marginBottom: Platform.OS === 'android' ? 4 : 0,
    backgroundColor: colors.card,
    borderRadius: 30,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 12,
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerSlot: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -34,
    gap: 5,
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C99212',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
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
