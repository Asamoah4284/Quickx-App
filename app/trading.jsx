import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';

const MODULES = [
  { title: 'Risk management', body: 'Position sizing, stop-loss discipline, and journaling habits for new traders.' },
  { title: 'Market sessions', body: 'Understand London, New York, and local liquidity windows.' },
  { title: 'Signal literacy', body: 'How to evaluate tutor signals inside Premium and Diamond communities.' },
];

export default function TradingScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Text style={typography.h2}>AI Trading Academy</Text>
        <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
          Educational trading modules and community signal workflows — learn before you trade.
        </Text>

        {MODULES.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        ))}

        <PrimaryButton label="View premium analysis" onPress={() => router.push('/analysis/premium')} style={{ marginTop: spacing.lg }} />
        <PrimaryButton label="Find signal tutors" variant="secondary" onPress={() => router.push('/tutors')} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  body: { color: colors.muted, marginTop: spacing.sm, lineHeight: 20 },
});
