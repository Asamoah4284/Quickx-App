import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/kit';
import { LogoMark } from '@/components/ui/Logo';
import { PressableScale } from '@/components/ui/PressableScale';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';

/** Shared frame for the sign-in and sign-up screens. Opens as a sheet over whatever the person was doing. */
export function AuthScreen({ title, subtitle, onBack, backLabel = 'Back', top, children }) {
  const { signInPrompt } = useAppState();

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(47,107,255,0.28)', 'rgba(5,8,15,0)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.6, y: 0.9 }}
        style={styles.glow}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.bar}>
              {onBack ? (
                <PressableScale onPress={onBack} hitSlop={12} style={styles.round} accessibilityLabel={backLabel}>
                  <Feather name="arrow-left" size={18} color={t.fg} />
                </PressableScale>
              ) : (
                <LogoMark size={40} />
              )}
              <PressableScale onPress={close} hitSlop={12} style={styles.round} accessibilityLabel="Close">
                <Feather name="x" size={18} color={t.fg} />
              </PressableScale>
            </View>

            {signInPrompt?.reason && !onBack ? (
              <View style={styles.reason}>
                <Feather name="lock" size={14} color={t.brand300} />
                <Txt size={13} color={t.fgMuted} style={{ flex: 1 }}>
                  {signInPrompt.reason}
                </Txt>
              </View>
            ) : null}

            <Txt size={30} weight="bold" style={{ letterSpacing: -0.7, lineHeight: 36 }}>
              {title}
            </Txt>
            {subtitle ? (
              <Txt size={15} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 22 }}>
                {subtitle}
              </Txt>
            ) : null}

            {top && !onBack ? <View style={{ marginTop: 24 }}>{top}</View> : null}
            <View style={{ marginTop: 24 }}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 28 },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: t.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: t.brandSoft,
    marginBottom: 20,
  },
});
