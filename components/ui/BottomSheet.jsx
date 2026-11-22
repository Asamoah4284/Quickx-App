import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

/** Slide-up sheet with a dimmed backdrop, grabber, title and keyboard handling. */
export function BottomSheet({ visible, onClose, title, subtitle, children }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Close">
              <FontAwesome name="times" size={16} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    flex: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      maxHeight: '88%',
    },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
    title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
    close: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.md,
    },
  })
);
