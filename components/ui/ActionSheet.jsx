import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { t } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

let show = null;

/**
 * A list of actions sliding up from the bottom, the same on iPhone and Android
 * (Android dialogs only fit three buttons). items: [{ label, icon, danger, onPress }].
 */
export function showActions(title, items) {
  const visible = items.filter(Boolean);
  if (visible.length && show) show({ title, items: visible });
}

/** Mounted once in the root layout. */
export function ActionSheetHost() {
  const [sheet, setSheet] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    show = setSheet;
    return () => {
      show = null;
    };
  }, []);

  const close = () => setSheet(null);
  const pick = (item) => {
    setSheet(null);
    // Let this sheet close before the next thing (often another sheet or a dialog) opens.
    setTimeout(() => item.onPress?.(), 280);
  };

  return (
    <Modal visible={Boolean(sheet)} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      {sheet ? (
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
            <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
          </Animated.View>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            {sheet.title ? (
              <Txt size={13} weight="semibold" color={t.fgSubtle} center style={{ paddingVertical: 12 }}>
                {sheet.title}
              </Txt>
            ) : null}
            {sheet.items.map((item) => (
              <PressableScale key={item.label} haptic="select" scaleTo={0.98} onPress={() => pick(item)} style={styles.item}>
                {item.icon ? <Icon name={item.icon} size={18} color={item.danger ? t.down : t.fg} /> : null}
                <Txt size={16} weight="semibold" color={item.danger ? t.down : t.fg}>
                  {item.label}
                </Txt>
              </PressableScale>
            ))}
            <PressableScale haptic="select" onPress={close} style={[styles.item, styles.cancel]}>
              <Txt size={16} weight="bold" color={t.fgMuted}>
                Cancel
              </Txt>
            </PressableScale>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: t.overlay },
    sheet: {
      marginHorizontal: 10,
      marginBottom: 10,
      padding: 8,
      borderRadius: 24,
      backgroundColor: t.cardHi,
      borderWidth: 1,
      borderColor: t.lineStrong,
    },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 16 },
    cancel: { marginTop: 6, backgroundColor: t.tint },
  })
);
