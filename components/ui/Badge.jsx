import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, t } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

export function Badge({ label, tone = 'primary', style }) {
  const tones = {
    primary: { bg: t.brandSoft, text: colors.primary },
    success: { bg: t.upSoft, text: colors.success },
    warning: { bg: t.warnSoft, text: colors.warning },
    muted: { bg: colors.border, text: colors.muted },
    accent: { bg: t.brandSoft, text: colors.accent },
  };
  const t = tones[tone] || tones.primary;

  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
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
  })
);
