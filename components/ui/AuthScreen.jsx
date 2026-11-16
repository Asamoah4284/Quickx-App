import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

export function AuthScreen({ title, subtitle, onBack, backLabel = '‹ Back', top, children }) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#07152F', '#0C2340', '#1246C4']} locations={[0, 0.55, 1]} style={styles.heroBg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            <View style={styles.hero}>
              {top && !onBack ? <View style={styles.top}>{top}</View> : null}
              {onBack ? (
                <Pressable onPress={onBack} style={styles.back} hitSlop={12}>
                  <Text style={styles.backText}>{backLabel}</Text>
                </Pressable>
              ) : (
                <View style={styles.mark}>
                  <Text style={styles.markLetter}>Q</Text>
                </View>
              )}
              <Text style={styles.brand}>QuickXLearn</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.sheet}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    height: 360,
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  top: {
    marginBottom: spacing.xl,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  backText: {
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '700',
    fontSize: 15,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  markLetter: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 24,
  },
  brand: {
    color: colors.gold,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    minHeight: 420,
  },
});
