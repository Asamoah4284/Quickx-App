import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) {
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isOff = disabled || loading;
  const textColor = isSecondary || isGhost ? colors.primary : colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.btn,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        isDanger && styles.danger,
        (pressed || isOff) && { opacity: isOff ? 0.45 : 0.85 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: isDanger ? colors.white : textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  label: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
