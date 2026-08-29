import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function OtpInput({ value, onChange, error }) {
  const inputRef = useRef(null);
  const digits = String(value || '').replace(/\D/g, '').slice(0, 6);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.wrap}>
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, index) => {
          const active = digits.length === index;
          const filled = Boolean(digits[index]);
          return (
            <View
              key={index}
              style={[
                styles.box,
                filled && styles.boxFilled,
                active && styles.boxActive,
                error && styles.boxError,
              ]}>
              <Text style={styles.digit}>{digits[index] || ''}</Text>
              {active && !filled ? <View style={styles.caret} /> : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    marginHorizontal: 4,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.navyMid,
  },
  boxActive: {
    borderColor: colors.gold,
    backgroundColor: '#FFFBF0',
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  caret: {
    width: 2,
    height: 22,
    backgroundColor: colors.gold,
    borderRadius: 1,
  },
  hidden: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    opacity: 0.02,
  },
});
