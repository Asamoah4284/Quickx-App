import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function Badge({ label, tone = 'primary', style }) {
  const tones = {
    primary: { bg: '#1B5EF514', text: colors.primary },
    success: { bg: '#1EBE571A', text: colors.success },
    warning: { bg: '#F69C081A', text: colors.warning },
    muted: { bg: colors.border, text: colors.muted },
    accent: { bg: '#00B8FF1A', text: colors.accent },
  };
  const t = tones[tone] || tones.primary;

  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
