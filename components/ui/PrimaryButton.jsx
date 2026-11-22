import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radii, spacing } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}) {
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isOff = disabled || loading;
  const textColor = isSecondary || isGhost ? colors.primary : colors.white;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isOff}
      haptic={isGhost ? 'select' : 'press'}
      accessibilityRole="button"
      accessibilityState={{ disabled: isOff, busy: loading }}
      style={[
        styles.btn,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        isDanger && styles.danger,
        isOff && styles.off,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <FontAwesome name={icon} size={14} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    btn: {
      backgroundColor: colors.primary,
      borderRadius: radii.md,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    secondary: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.danger,
    },
    off: { opacity: 0.45 },
    label: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 15,
    },
  })
);
