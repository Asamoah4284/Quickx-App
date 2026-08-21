import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

export function EmptyState({ icon = 'inbox', title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <FontAwesome name={icon} size={36} color={colors.primary} />
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      {subtitle ? <Text style={[typography.caption, styles.sub]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: { textAlign: 'center', marginTop: spacing.sm },
  sub: { textAlign: 'center', lineHeight: 20 },
});
