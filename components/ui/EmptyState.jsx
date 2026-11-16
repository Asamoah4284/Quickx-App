import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/kit';
import { t } from '@/constants/theme';

/** Friendly "nothing here yet" block. `icon` is a FontAwesome name. */
export function EmptyState({ icon = 'inbox', title, subtitle, children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <FontAwesome name={icon} size={24} color={t.brand300} />
      </View>
      <Txt size={16} weight="semibold" center style={{ marginTop: 14 }}>
        {title}
      </Txt>
      {subtitle ? (
        <Txt size={13.5} color={t.fgMuted} center style={{ marginTop: 6, lineHeight: 20, maxWidth: 300 }}>
          {subtitle}
        </Txt>
      ) : null}
      {children ? <View style={{ marginTop: 16 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: t.line },
  icon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.brandSoft },
});
