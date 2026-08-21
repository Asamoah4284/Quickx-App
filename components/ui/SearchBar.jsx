import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  onSubmitEditing,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <FontAwesome name="search" size={16} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
});
