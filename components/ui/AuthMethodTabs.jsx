import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

const METHODS = [
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
];

/** Phone / Email switcher rendered inside the dark auth hero (pass as AuthScreen `top`). */
export function AuthMethodTabs({ value, onChange }) {
  return (
    <View style={styles.switcher} accessibilityRole="tablist">
      {METHODS.map((m) => {
        const active = value === m.id;
        return (
          <Pressable
            key={m.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) haptics.select();
              onChange(m.id);
            }}
            style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{m.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.full,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radii.full,
  },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontWeight: '700', color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  tabTextActive: { color: colors.navy },
});
