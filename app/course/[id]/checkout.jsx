import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getCourseById } from '@/data/courses';
import { formatCurrency, formatPriceCedi } from '@/utils/format';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { walletBalance, currency, enrollCourse, isEnrolled } = useAppState();
  const course = getCourseById(String(id));

  if (!course) {
    return (
      <Screen>
        <Text>Course not found.</Text>
      </Screen>
    );
  }

  if (isEnrolled(course.id)) {
    return (
      <Screen>
        <Text style={typography.h2}>You’re enrolled</Text>
        <PrimaryButton
          label="Open learning area"
          onPress={() => router.replace(`/learn/${course.id}`)}
          style={{ marginTop: spacing.xl }}
        />
      </Screen>
    );
  }

  const onPay = () => {
    const ok = enrollCourse(course.id, course.price, course.title);
    if (!ok) {
      Alert.alert('Insufficient balance', 'Deposit funds in QuickX Wallet and try again.');
      return;
    }
    Alert.alert('Success', 'Enrollment confirmed. Happy learning!', [
      { text: 'Start learning', onPress: () => router.replace(`/learn/${course.id}`) },
    ]);
  };

  return (
    <Screen>
      <Text style={typography.h2}>Subscribe / Purchase</Text>
      <Text style={[typography.caption, { marginTop: spacing.sm }]}>{course.title}</Text>

      <View style={styles.card}>
        <Row label="Course price" value={formatPriceCedi(course.price)} />
        <Row label="Wallet balance" value={formatCurrency(walletBalance, currency)} />
        <Row
          label="After payment"
          value={formatCurrency(Math.max(0, walletBalance - course.price), currency)}
        />
      </View>

      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        Payment is simulated with your QuickX Wallet (mock). No real charge is made.
      </Text>

      <PrimaryButton label={`Pay ${formatPriceCedi(course.price)}`} onPress={onPay} />
      <PrimaryButton
        label="Top up wallet"
        variant="secondary"
        onPress={() => router.push('/wallet')}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.muted },
  value: { fontWeight: '700', color: colors.text },
});
