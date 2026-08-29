import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchTutorProfile } from '@/utils/catalog';
import {
  fetchTutorSubscriptionMe,
  planPriceFromTutor,
  subscribeToTutor,
  SUBSCRIPTION_PLANS,
} from '@/utils/community';
import { formatCurrency, formatPriceCedi } from '@/utils/format';

export default function SubscribeTutorScreen() {
  const { tutorId } = useLocalSearchParams();
  const id = String(tutorId);
  const router = useRouter();
  const { token, user, walletBalance, currency, pay } = useAppState();
  const [tutor, setTutor] = useState(null);
  const [access, setAccess] = useState(null);
  const [planId, setPlanId] = useState('premium');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await fetchTutorProfile(id);
      setTutor(profile);
      if (token && token !== 'local') {
        try {
          setAccess(await fetchTutorSubscriptionMe(id, token));
        } catch {
          setAccess(null);
        }
      }
    } catch {
      setTutor(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubscribe = async () => {
    if (!tutor) return;
    if (!token || token === 'local') {
      Alert.alert('Sign in required', 'Sign in to subscribe to this tutor.');
      return;
    }
    const amount = planPriceFromTutor(tutor, planId);
    if (amount == null) {
      Alert.alert('Unavailable', 'This plan is not available.');
      return;
    }
    if (!pay(amount, `Subscribe ${tutor.name} · ${planId}`)) {
      Alert.alert('Insufficient balance', 'Top up your QuickX Wallet first.');
      return;
    }
    setPaying(true);
    try {
      await subscribeToTutor({
        token,
        instructorId: id,
        planId,
        amount,
        phone: user?.phone,
        email: user?.email,
      });
      Alert.alert('Subscribed', 'Your plan is active.', [
        {
          text: 'Open community',
          onPress: () => router.replace(`/community/${id}`),
        },
        { text: 'Done', style: 'cancel' },
      ]);
      await load();
    } catch (err) {
      Alert.alert('Could not subscribe', err.message || 'Try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Subscribe' }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!tutor) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Subscribe' }} />
        <EmptyState icon="user" title="Tutor not found" />
      </Screen>
    );
  }

  const currentPlan = access?.subscription?.planId;

  return (
    <Screen>
      <Stack.Screen options={{ title: `Subscribe · ${tutor.name}` }} />
      <Text style={typography.h2}>{tutor.name}</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Choose a plan. Premium and Diamond unlock community access.
      </Text>

      {currentPlan ? (
        <View style={styles.current}>
          <FontAwesome name="check-circle" size={16} color={colors.success} />
          <Text style={styles.currentText}>
            Active · {currentPlan}
            {access?.canAccessCommunity ? ' · community unlocked' : ' · video only'}
          </Text>
        </View>
      ) : null}

      {SUBSCRIPTION_PLANS.map((plan) => {
        const price = planPriceFromTutor(tutor, plan.id);
        const selected = planId === plan.id;
        return (
          <Pressable
            key={plan.id}
            onPress={() => setPlanId(plan.id)}
            style={[styles.plan, selected && styles.planSelected]}>
            <View style={styles.planTop}>
              <Text style={styles.planLabel}>{plan.label}</Text>
              {plan.badge ? <Text style={styles.badge}>{plan.badge}</Text> : null}
              <Text style={styles.planPrice}>{formatPriceCedi(price)}</Text>
            </View>
            <Text style={styles.period}>{plan.periodNote}</Text>
            {plan.benefits.map((b) => (
              <Text key={b} style={styles.benefit}>
                · {b}
              </Text>
            ))}
          </Pressable>
        );
      })}

      <Text style={styles.wallet}>Wallet · {formatCurrency(walletBalance, currency)}</Text>

      <PrimaryButton
        label={`Subscribe · ${formatPriceCedi(planPriceFromTutor(tutor, planId))}`}
        onPress={onSubscribe}
        loading={paying}
        style={{ marginTop: spacing.lg }}
      />
      {access?.canAccessCommunity ? (
        <PrimaryButton
          label="Open community"
          variant="secondary"
          onPress={() => router.push(`/community/${id}`)}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
      <PrimaryButton
        label="Top up wallet"
        variant="ghost"
        onPress={() => router.push('/wallet')}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  current: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#E8F8EE',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  currentText: { color: colors.text, fontWeight: '600', flex: 1 },
  plan: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planSelected: { borderColor: colors.primary },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  planLabel: { fontWeight: '800', fontSize: 16, color: colors.text, flex: 1 },
  badge: {
    backgroundColor: '#E8B02022',
    color: '#9A6B00',
    fontWeight: '800',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    borderRadius: 99,
  },
  planPrice: { fontWeight: '800', color: colors.primary },
  period: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  benefit: { color: colors.text, fontSize: 13, lineHeight: 20 },
  wallet: { color: colors.muted, marginTop: spacing.md, fontWeight: '600' },
});
