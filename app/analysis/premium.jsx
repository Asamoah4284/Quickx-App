import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';

const SNAPSHOTS = [
  { pair: 'EUR/USD', bias: 'Bullish', note: 'Pullback to demand zone before continuation.' },
  { pair: 'GOLD', bias: 'Neutral', note: 'Range-bound ahead of macro data.' },
  { pair: 'BTC/USD', bias: 'Cautious', note: 'Volatility elevated; reduce position size.' },
  { pair: 'GHS pairs', bias: 'Watchlist', note: 'Local liquidity sessions highlighted in mentorship.' },
];

export default function PremiumAnalysisScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Text style={typography.h2}>Premium analysis</Text>
        <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
          Sample market snapshots. Full premium feed is included in Pro and Elite mentorship plans.
        </Text>

        {SNAPSHOTS.map((item) => (
          <View key={item.pair} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.pair}>{item.pair}</Text>
              <Text style={styles.bias}>{item.bias}</Text>
            </View>
            <Text style={styles.note}>{item.note}</Text>
          </View>
        ))}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pair: { fontWeight: '800', color: colors.text, fontSize: 16 },
  bias: { color: colors.primary, fontWeight: '800' },
  note: { color: colors.muted, marginTop: spacing.sm, lineHeight: 20 },
});
