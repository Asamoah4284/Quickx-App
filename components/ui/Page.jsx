import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { forwardRef } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Eyebrow, Rise, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { t } from '@/constants/theme';

/** Room left at the bottom so the floating tab bar never covers content. */
export const TAB_BAR_SPACE = 110;

export function BackButton({ onPress }) {
  return (
    <PressableScale
      haptic="select"
      hitSlop={10}
      onPress={onPress || (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={styles.round}
      accessibilityLabel="Go back">
      <Feather name="arrow-left" size={18} color={t.fg} />
    </PressableScale>
  );
}

export function RoundButton({ icon, onPress, label, badge }) {
  return (
    <PressableScale haptic="select" hitSlop={8} onPress={onPress} style={styles.round} accessibilityLabel={label}>
      <Feather name={icon} size={18} color={t.fg} />
      {badge ? (
        <View style={styles.badge}>
          <Txt size={9} weight="bold" color={t.white} tabular>
            {badge > 9 ? '9+' : badge}
          </Txt>
        </View>
      ) : null}
    </PressableScale>
  );
}

/**
 * The frame for every screen: dark background with a soft blue glow, a title block,
 * pull to refresh, and room for the tab bar.
 *
 * back: show a back button (screens opened from somewhere).
 * tabs: leave room for the floating tab bar.
 * header: replace the title block.
 * footer: pinned to the bottom (for example a Pay button).
 */
export const Page = forwardRef(function Page(
  {
    title,
    eyebrow,
    subtitle,
    right,
    back,
    tabs,
    header,
    footer,
    children,
    refreshing,
    onRefresh,
    scroll = true,
    contentStyle,
    keyboard,
  },
  ref
) {
  const head =
    header ||
    (title || back || right ? (
      <View style={styles.head}>
        {back || right ? (
          <View style={styles.bar}>
            {back ? <BackButton onPress={typeof back === 'function' ? back : undefined} /> : <View />}
            <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View>
          </View>
        ) : null}
        {title ? (
          <Rise>
            {eyebrow ? <Eyebrow style={{ marginBottom: 6 }}>{eyebrow}</Eyebrow> : null}
            <Txt size={28} weight="bold" style={{ letterSpacing: -0.7, lineHeight: 34 }}>
              {title}
            </Txt>
            {subtitle ? (
              <Txt size={15} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 22 }}>
                {subtitle}
              </Txt>
            ) : null}
          </Rise>
        ) : null}
      </View>
    ) : null);

  const bottom = tabs ? TAB_BAR_SPACE : footer ? 24 : 40;
  const body = scroll ? (
    <ScrollView
      ref={ref}
      contentContainerStyle={[styles.content, { paddingBottom: bottom }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={t.brand400} colors={[t.brand500]} progressBackgroundColor={t.card} />
        ) : undefined
      }>
      {head}
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1, paddingBottom: tabs ? TAB_BAR_SPACE - 30 : 0 }, contentStyle]}>
      {head}
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['rgba(47,107,255,0.16)', 'rgba(5,8,15,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.glow} pointerEvents="none" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {keyboard ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {body}
            {footer}
          </KeyboardAvoidingView>
        ) : (
          <>
            {body}
            {footer}
          </>
        )}
      </SafeAreaView>
    </View>
  );
});

/** A bar pinned to the bottom of a Page, for the main action. */
export function Footer({ children }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  content: { paddingHorizontal: 18 },
  head: { paddingTop: 8, marginBottom: 22, gap: 18 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: t.down,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: t.bg,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(9,13,24,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.line,
  },
});
