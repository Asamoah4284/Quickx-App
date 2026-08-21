import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { notifications } from '@/data/wallet';

export default function NotificationsScreen() {
  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Notifications</Text>
      {notifications.map((n) => (
        <View key={n.id} style={styles.card}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={typography.caption}>{n.body}</Text>
          <Text style={styles.time}>{n.time}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  time: { marginTop: spacing.sm, color: colors.primary, fontWeight: '600', fontSize: 12 },
});
