import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { fonts, radii, shadow, t } from '@/constants/theme';
import { initials } from '@/utils/format';
import { themed } from '@/utils/themedStyles';

export { Feather as Icon };

// ── Text ─────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  regular: fonts.regular,
  medium: fonts.medium,
  semibold: fonts.semibold,
  bold: fonts.bold,
  extrabold: fonts.extrabold,
};

/**
 * Text in the QuickX font. `size`, `weight`, `color` and `tabular` (lined-up numbers)
 * cover nearly every case; pass `style` for the rest.
 */
export function Txt({ size = 15, weight = 'regular', color = t.fg, tabular, center, style, children, ...rest }) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: size,
          fontFamily: WEIGHTS[weight] || fonts.regular,
          color,
          lineHeight: Math.round(size * 1.4),
        },
        tabular && { fontVariant: ['tabular-nums'] },
        center && { textAlign: 'center' },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, color = t.brand400, style }) {
  return (
    <Txt size={12} weight="bold" color={color} style={[{ letterSpacing: 1.2, textTransform: 'uppercase' }, style]}>
      {children}
    </Txt>
  );
}

export function Title({ children, size = 28, style }) {
  return (
    <Txt size={size} weight="bold" style={[{ letterSpacing: -0.6, lineHeight: Math.round(size * 1.18) }, style]}>
      {children}
    </Txt>
  );
}

// ── Motion ───────────────────────────────────────────────────────────────────

/** Fades and lifts content in. `index` staggers items in a list. Honours reduce motion. */
export function Rise({ index = 0, delay = 0, children, style }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420)
        .delay(delay + Math.min(index, 8) * 55)
        .springify()
        .damping(18)}
      style={style}>
      {children}
    </Animated.View>
  );
}

/** A number that counts up to `value`. */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', ...txt }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = Date.now();
    const duration = 900;
    let frame;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setShown(target * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <Txt tabular {...txt}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </Txt>
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────────────

export function Card({ children, style, onPress, tone, padded = true, ...rest }) {
  const toneStyle =
    tone === 'brand'
      ? { borderColor: 'rgba(91,143,255,0.45)', backgroundColor: t.focusBg }
      : tone === 'up'
        ? { borderColor: 'rgba(47,208,140,0.3)' }
        : tone === 'down'
          ? { borderColor: 'rgba(255,93,108,0.3)' }
          : tone === 'warn'
            ? { borderColor: 'rgba(245,184,74,0.3)', backgroundColor: 'rgba(245,184,74,0.06)' }
            : null;
  const body = [styles.card, padded && styles.cardPad, toneStyle, style];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} style={body} {...rest}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={body} {...rest}>
      {children}
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }, style]} />;
}

export function Row({ children, gap = 8, style, align = 'center', justify }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: align, gap }, justify && { justifyContent: justify }, style]}>
      {children}
    </View>
  );
}

/** Rounded square holding an icon. */
export function IconBox({ name, size = 44, tone = 'brand', iconSize }) {
  const bg = { brand: t.brandSoft, up: t.upSoft, down: t.downSoft, warn: t.warnSoft, neutral: t.glass }[tone] || t.brandSoft;
  const fg = { brand: t.brand300, up: t.up, down: t.down, warn: t.warn, neutral: t.fgSubtle }[tone] || t.brand300;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={name} size={iconSize || Math.round(size * 0.45)} color={fg} />
    </View>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

/**
 * variant: primary | secondary | ghost | danger. size: md | lg | sm.
 * `icon` is a Feather icon name.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  style,
  children,
  haptic,
}) {
  const off = disabled || loading;
  const color = variant === 'primary' || variant === 'danger' ? t.white : variant === 'ghost' ? t.brand300 : t.fg;
  const height = size === 'lg' ? 54 : size === 'sm' ? 38 : 48;
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      haptic={haptic || (variant === 'ghost' ? 'select' : 'press')}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      style={[
        styles.btn,
        { minHeight: height, paddingHorizontal: size === 'sm' ? 14 : 20 },
        variant === 'primary' && [styles.btnPrimary, shadow.glow],
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        off && { opacity: 0.45 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Row gap={8} justify="center">
          {icon ? <Feather name={icon} size={size === 'sm' ? 15 : 17} color={color} /> : null}
          {label ? (
            <Txt size={size === 'sm' ? 13 : 15} weight="bold" color={color} numberOfLines={1}>
              {label}
            </Txt>
          ) : null}
          {children}
          {iconRight ? <Feather name={iconRight} size={size === 'sm' ? 15 : 17} color={color} /> : null}
        </Row>
      )}
    </PressableScale>
  );
}

// ── Badge and alerts ─────────────────────────────────────────────────────────

const tones = () => ({
  brand: { bg: t.brandSoft, fg: t.brand300 },
  up: { bg: t.upSoft, fg: t.up },
  down: { bg: t.downSoft, fg: t.down },
  warn: { bg: t.warnSoft, fg: t.warn },
  neutral: { bg: t.tintStrong, fg: t.fgMuted },
});

export function Badge({ label, tone = 'neutral', dot, icon, style }) {
  const all = tones();
  const c = all[tone] || all.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      {dot ? <PulseDot color={c.fg} /> : null}
      {icon ? <Feather name={icon} size={11} color={c.fg} /> : null}
      <Txt size={11} weight="bold" color={c.fg}>
        {label}
      </Txt>
    </View>
  );
}

/** Small dot that softly pulses, used for "Live". */
export function PulseDot({ color = t.up, size = 7 }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      scale.value = withTiming(1.8, { duration: 900 }, () => {
        scale.value = withTiming(1, { duration: 900 });
      });
    };
    loop();
    const id = setInterval(loop, 1800);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [scale]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 2 - scale.value }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color, opacity: 0.35 }, ring]} />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

export function Alert({ tone = 'down', icon, title, children, style }) {
  const all = tones();
  const c = all[tone] || all.down;
  const name = icon || (tone === 'up' ? 'check-circle' : tone === 'brand' ? 'info' : tone === 'warn' ? 'alert-triangle' : 'alert-circle');
  return (
    <View style={[styles.alert, { backgroundColor: c.bg, borderColor: c.bg }, style]}>
      <Feather name={name} size={16} color={c.fg} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Txt size={14} weight="semibold" color={t.fg}>
            {title}
          </Txt>
        ) : null}
        {typeof children === 'string' ? (
          <Txt size={13} color={t.fgMuted} style={{ lineHeight: 19 }}>
            {children}
          </Txt>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

/** Segmented tabs with a sliding pill. tabs: [{ value, label, count }]. */
export function Tabs({ tabs, value, onChange, style }) {
  const [widths, setWidths] = useState({});
  const index = Math.max(0, tabs.findIndex((x) => x.value === value));
  const x = useSharedValue(0);
  const w = useSharedValue(0);

  useEffect(() => {
    let left = 4;
    for (let i = 0; i < index; i += 1) left += widths[tabs[i].value] || 0;
    const width = widths[tabs[index]?.value] || 0;
    if (!width) return;
    x.value = withSpring(left, { damping: 20, stiffness: 240 });
    w.value = withSpring(width, { damping: 20, stiffness: 240 });
  }, [index, widths, tabs, x, w]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: w.value }));

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={styles.tabs}>
      <Animated.View style={[styles.tabPill, pill]} />
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <PressableScale
            key={tab.value}
            haptic="select"
            scaleTo={0.95}
            onPress={() => onChange(tab.value)}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              setWidths((prev) => (prev[tab.value] === width ? prev : { ...prev, [tab.value]: width }));
            }}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Txt size={13} weight="semibold" color={active ? t.fg : t.fgMuted}>
              {tab.label}
            </Txt>
            {tab.count ? (
              <View style={[styles.count, active && { backgroundColor: t.brand600 }]}>
                <Txt size={10} weight="bold" color={t.white} tabular>
                  {tab.count}
                </Txt>
              </View>
            ) : null}
          </PressableScale>
        );
      })}
    </Animated.ScrollView>
  );
}

/** Scrollable chips for filters and rooms. */
export function Chips({ items, value, onChange, style }) {
  return (
    <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ flexGrow: 0 }, style]} contentContainerStyle={{ gap: 8 }}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <PressableScale
            key={item.value}
            haptic="select"
            onPress={() => onChange(item.value)}
            style={[styles.chip, active && styles.chipActive, item.icon && { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            {item.icon ? <Feather name={item.icon} size={12} color={active ? t.fg : t.fgSubtle} /> : null}
            <Txt size={13} weight="semibold" color={active ? t.fg : t.fgMuted}>
              {item.label}
            </Txt>
          </PressableScale>
        );
      })}
    </Animated.ScrollView>
  );
}

// ── Forms ────────────────────────────────────────────────────────────────────

export function Field({ label, hint, error, children, style }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? (
        <Txt size={13} weight="semibold" color={t.fg}>
          {label}
        </Txt>
      ) : null}
      {children}
      {error ? (
        <Txt size={12} color={t.down}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt size={12} color={t.fgSubtle}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function Input({ style, multiline, icon, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[styles.input, multiline && { minHeight: 96, alignItems: 'flex-start', paddingVertical: 12 }, focus && styles.inputFocus, style]}>
      {icon ? <Feather name={icon} size={16} color={t.fgSubtle} style={{ marginRight: 10 }} /> : null}
      <TextInput
        placeholderTextColor={t.fgSubtle}
        selectionColor={t.brand400}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        {...rest}
        style={[{ flex: 1, color: t.fg, fontFamily: fonts.medium, fontSize: 15, padding: 0 }, multiline && { minHeight: 72 }]}
      />
    </View>
  );
}

/** Tick box with a label. */
export function Check({ checked, onChange, children }) {
  return (
    <PressableScale haptic="select" scaleTo={0.99} onPress={() => onChange(!checked)} style={styles.check}>
      <View style={[styles.box, checked && { backgroundColor: t.brand500, borderColor: t.brand500 }]}>
        {checked ? <Feather name="check" size={13} color={t.white} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Txt size={13} color={t.fgMuted} style={{ lineHeight: 19 }}>
            {children}
          </Txt>
        ) : (
          children
        )}
      </View>
    </PressableScale>
  );
}

/** Pick one option from a short list, shown as cards. */
export function Choice({ options, value, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            haptic="select"
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={[styles.choice, active && styles.choiceActive, o.disabled && { opacity: 0.45 }]}>
            {o.icon ? <Feather name={o.icon} size={18} color={active ? t.brand300 : t.fgSubtle} /> : null}
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="semibold">
                {o.label}
              </Txt>
              {o.detail ? (
                <Txt size={12} color={t.fgSubtle}>
                  {o.detail}
                </Txt>
              ) : null}
            </View>
            <View style={[styles.radio, active && { borderColor: t.brand400 }]}>{active ? <View style={styles.radioDot} /> : null}</View>
          </PressableScale>
        );
      })}
    </View>
  );
}

// ── People ───────────────────────────────────────────────────────────────────

export function Avatar({ uri, name, size = 40 }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.ink700 }}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Txt size={Math.round(size * 0.36)} weight="bold" color={t.brand300}>
        {initials(name) || '?'}
      </Txt>
    </View>
  );
}

// ── Layout helpers ───────────────────────────────────────────────────────────

/** Heading for a block of content, with an optional link on the right. */
export function SectionTitle({ title, action, onAction, style }) {
  return (
    <Row justify="space-between" style={[{ marginBottom: 12 }, style]}>
      <Txt size={18} weight="bold" style={{ letterSpacing: -0.3 }}>
        {title}
      </Txt>
      {action ? (
        <PressableScale haptic="select" onPress={onAction} hitSlop={8}>
          <Txt size={13} weight="semibold" color={t.brand400}>
            {action}
          </Txt>
        </PressableScale>
      ) : null}
    </Row>
  );
}

/** Label and value stacked, for small stat tiles. */
export function Stat({ label, value, tone, style, children }) {
  const color = tone === 'up' ? t.up : tone === 'down' ? t.down : t.fg;
  return (
    <View style={[styles.stat, style]}>
      <Txt size={11} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {label}
      </Txt>
      {children || (
        <Txt size={20} weight="bold" color={color} tabular style={{ marginTop: 4 }}>
          {value}
        </Txt>
      )}
    </View>
  );
}

/** Thin progress bar; value is 0 to 1. */
export function ProgressBar({ value = 0, tone = 'brand', height = 6, style }) {
  const fill = tone === 'up' ? t.up : t.brand500;
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: t.tintStrong, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: fill }} />
    </View>
  );
}

export function Loading({ label }) {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
      <ActivityIndicator color={t.brand400} />
      {label ? (
        <Txt size={13} color={t.fgMuted}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: t.line,
      overflow: 'hidden',
    },
    cardPad: { padding: 18 },
    btn: {
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimary: { backgroundColor: t.brand600 },
    btnSecondary: { backgroundColor: t.tint, borderWidth: 1, borderColor: t.lineStrong },
    btnGhost: { backgroundColor: 'transparent' },
    btnDanger: { backgroundColor: t.down },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radii.full,
      alignSelf: 'flex-start',
    },
    alert: {
      flexDirection: 'row',
      gap: 10,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
    },
    tabs: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: radii.full,
      backgroundColor: t.bgRaised,
      borderWidth: 1,
      borderColor: t.line,
    },
    tabPill: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 0,
      borderRadius: radii.full,
      backgroundColor: t.ink700,
      borderWidth: 1,
      borderColor: t.lineStrong,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    count: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 9,
      backgroundColor: t.ink600,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.line,
    },
    chipActive: { borderColor: 'rgba(91,143,255,0.6)', backgroundColor: t.brandSoft },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 50,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: t.bgRaised,
      borderWidth: 1,
      borderColor: t.lineStrong,
    },
    inputFocus: { borderColor: t.brand400 },
    check: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.line,
    },
    box: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: t.lineStrong,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    choice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.line,
    },
    choiceActive: { borderColor: 'rgba(91,143,255,0.6)', backgroundColor: 'rgba(47,107,255,0.1)' },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.lineStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.brand400 },
    stat: {
      flex: 1,
      padding: 14,
      borderRadius: 16,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.line,
    },
  })
);
