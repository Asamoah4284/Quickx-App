import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';

const PLANS = [
  { id: 'starter', label: 'Starter', price: '₵199/mo', perks: ['2 mentorship calls', 'Community access', 'Session recordings'] },
  { id: 'pro', label: 'Pro', price: '₵399/mo', perks: ['Weekly mentorship', 'Premium analysis', 'Priority support'] },
  { id: 'elite', label: 'Elite', price: '₵799/mo', perks: ['1-on-1 mentorship', 'Trading signals', 'Diamond tutor perks'] },
];

const INSIGHTS = [
  { title: 'Market outlook', body: 'Weekly macro and sector summaries for Ghana and global markets.' },
  { title: 'Forex setups', body: 'Curated trade ideas with risk management frameworks.' },
  { title: 'Creator coaching', body: 'Business and content strategy sessions with approved tutors.' },
];

export default function AnalysisScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Text style={typography.h2}>Analysis & mentorship</Text>
        <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
          Structured mentorship plans and market insights from QuickX creators.
        </Text>

        <PrimaryButton label="View mentorship sessions" onPress={() => router.push('/(tabs)/mentorship')} />
        <PrimaryButton
          label="Premium analysis"
          variant="secondary"
          onPress={() => router.push('/analysis/premium')}
          style={{ marginTop: spacing.sm }}
        />

        <Text style={styles.section}>Mentorship plans</Text>
        {PLANS.map((plan) => (
          <View key={plan.id} style={styles.card}>
            <Text style={styles.cardTitle}>{plan.label}</Text>
            <Text style={styles.price}>{plan.price}</Text>
            {plan.perks.map((perk) => (
              <Text key={perk} style={styles.perk}>· {perk}</Text>
            ))}
            <PrimaryButton
              label="Contact on WhatsApp"
              variant="secondary"
              onPress={() => router.push('/(tabs)/mentorship')}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ))}

        <Text style={styles.section}>What you get</Text>
        {INSIGHTS.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
  price: { color: colors.primary, fontWeight: '800', marginTop: 4, marginBottom: spacing.sm },
  perk: { color: colors.text, lineHeight: 20 },
  body: { color: colors.muted, lineHeight: 20, marginTop: 4 },
});
