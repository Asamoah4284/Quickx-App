import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radii, shadow, spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { deadlineLabel, fundingPercent, RISK_COLORS, STATUS_META } from '@/utils/ptrading';

export function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.funding;
  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <FontAwesome name={meta.icon} size={10} color={meta.color} />
      <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export function FundingBar({ pie, dark = false }) {
  const pct = fundingPercent(pie);
  return (
    <View>
      <View style={[styles.track, dark && styles.trackDark]}>
        <View style={[styles.fill, { width: `${Math.max(pct, 2)}%` }]} />
      </View>
      <View style={styles.barMeta}>
        <Text style={[styles.raised, dark && styles.textLight]}>
          {formatCurrency(pie.raisedAmount)} <Text style={[styles.of, dark && styles.mutedLight]}>of {formatCurrency(pie.targetAmount)}</Text>
        </Text>
        <Text style={[styles.pct, dark && styles.textLight]}>{pct}%</Text>
      </View>
    </View>
  );
}

function outcomeText(pie) {
  if (pie.status !== 'settled') return null;
  const pnl = Number(pie.finalPnlPercent) || 0;
  if (pie.outcome === 'win') return { text: `+${pnl}% ROI`, color: colors.success };
  if (pie.outcome === 'loss') return { text: `${pnl > 0 ? -pnl : pnl}%`, color: colors.danger };
  return { text: 'Break-even', color: colors.muted };
}

export function PieCard({ pie, onPress, footer }) {
  const owner = pie.ownerId?.fullName || 'QuickX trader';
  const outcome = outcomeText(pie);

  return (
    <PressableScale style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.top}>
        <View style={styles.pairBadge}>
          <Text style={styles.pairText}>{pie.pair}</Text>
        </View>
        <StatusPill status={pie.status} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {pie.title}
      </Text>
      <Text style={styles.owner} numberOfLines={1}>
        by {owner} · <Text style={{ textTransform: 'capitalize' }}>{pie.market}</Text>
      </Text>

      <View style={styles.metrics}>
        <Metric label="Target ROI" value={`${pie.targetRoiPercent ?? 20}%`} accent={colors.success} />
        <Metric label="Max loss" value={`${pie.maxLossPercent ?? 10}%`} accent={colors.danger} />
        <Metric label="Risk" value={pie.riskLevel || 'Moderate'} accent={RISK_COLORS[pie.riskLevel] || colors.primary} />
      </View>

      {pie.status === 'funding' ? <FundingBar pie={pie} /> : null}

      <View style={styles.bottom}>
        <View style={styles.bottomItem}>
          <FontAwesome name="users" size={11} color={colors.muted} />
          <Text style={styles.bottomText}>{pie.participantCount || 0} backers</Text>
        </View>
        {outcome ? (
          <Text style={[styles.outcome, { color: outcome.color }]}>{outcome.text}</Text>
        ) : (
          <View style={styles.bottomItem}>
            <FontAwesome name="clock-o" size={11} color={colors.muted} />
            <Text style={styles.bottomText}>
              {pie.status === 'funding' ? deadlineLabel(pie) : `Pool ${formatCurrency(pie.raisedAmount)}`}
            </Text>
          </View>
        )}
      </View>
      {footer}
    </PressableScale>
  );
}

function Metric({ label, value, accent }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pairBadge: { backgroundColor: colors.navy, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.sm },
  pairText: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  pillText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.2, lineHeight: 23 },
  owner: { fontSize: 12, color: colors.muted, marginTop: 3, fontWeight: '500' },
  metrics: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.md,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E6ECF5', overflow: 'hidden' },
  trackDark: { backgroundColor: 'rgba(255,255,255,0.18)' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  raised: { fontSize: 13, fontWeight: '800', color: colors.text },
  of: { fontWeight: '500', color: colors.muted },
  pct: { fontSize: 13, fontWeight: '800', color: colors.primary },
  textLight: { color: colors.white },
  mutedLight: { color: 'rgba(255,255,255,0.65)' },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bottomItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  outcome: { fontSize: 13, fontWeight: '800' },
});
