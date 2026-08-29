import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function WizardStepper({ steps, currentStep, onStepSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const active = currentStep === stepNumber;
        const done = currentStep > stepNumber;
        return (
          <Pressable
            key={step.label}
            onPress={() => onStepSelect?.(stepNumber)}
            style={[styles.chip, active && styles.chipActive, done && styles.chipDone]}>
            <Text style={[styles.number, (active || done) && styles.numberActive]}>{stepNumber}</Text>
            <View style={styles.textWrap}>
              <Text style={[styles.label, active && styles.labelActive]}>{step.label}</Text>
              <Text style={styles.description} numberOfLines={1}>
                {step.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    maxWidth: 220,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#EEF3FF' },
  chipDone: { borderColor: colors.success },
  number: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    fontSize: 13,
    color: colors.muted,
    overflow: 'hidden',
  },
  numberActive: { backgroundColor: colors.primary, color: colors.white },
  textWrap: { flexShrink: 1 },
  label: { fontWeight: '700', fontSize: 13, color: colors.text },
  labelActive: { color: colors.primary },
  description: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
