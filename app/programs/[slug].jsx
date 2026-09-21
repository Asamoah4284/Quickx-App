import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PaymentCheckout } from '@/components/checkout/PaymentCheckout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchProgram, joinProgram, formatProgramTrack, fetchMyProgramEnrollments } from '@/utils/programs';
import { formatPriceCedi } from '@/utils/format';

export default function ProgramDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { token, user } = useAppState();
  const [program, setProgram] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const item = await fetchProgram(String(slug));
        if (!alive) return;
        setProgram(item);
        if (token && token !== 'local') {
          const mine = await fetchMyProgramEnrollments(token);
          if (alive) {
            setEnrolled(mine.some((e) => e.program?.slug === item.slug || e.programId === item.id));
          }
        }
      } catch {
        if (alive) setProgram(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, token]);

  const onJoin = async ({ phone, email, amount, network, onPending }) => {
    if (!program) return;
    setPaying(true);
    try {
      await joinProgram({
        token,
        programId: program.id,
        amount,
        phone,
        email,
        network,
        onPending,
      });
      Alert.alert('Enrolled', `You joined ${program.name}.`, [
        { text: 'OK', onPress: () => router.replace('/programs') },
      ]);
    } catch (error) {
      Alert.alert('Enrollment failed', error.message || 'Try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!program) {
    return (
      <Screen>
        <Text>Program not found.</Text>
      </Screen>
    );
  }

  if (enrolled) {
    return (
      <Screen>
        <Text style={typography.h2}>{program.name}</Text>
        <Text style={[typography.caption, { marginVertical: spacing.lg }]}>
          You are already enrolled in this creator track.
        </Text>
        <PrimaryButton label="Back to programs" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.hero}>
          <Text style={styles.track}>{formatProgramTrack(program.courseType)}</Text>
          <Text style={typography.h2}>{program.name}</Text>
          <Text style={styles.price}>{formatPriceCedi(program.price)}</Text>
        </View>
        {program.description ? (
          <Text style={[typography.body, { lineHeight: 22, marginBottom: spacing.xl }]}>
            {program.description}
          </Text>
        ) : null}

        {!token || token === 'local' ? (
          <Text style={styles.signIn}>Sign in to enroll in this program.</Text>
        ) : (
          <PaymentCheckout
            title="Enroll"
            subtitle={program.name}
            price={program.price}
            user={user}
            paying={paying}
            allowCoupon={false}
            onPay={onJoin}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  track: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  price: { marginTop: spacing.sm, fontSize: 22, fontWeight: '800', color: colors.text },
  signIn: { color: colors.muted, fontSize: 14 },
});
