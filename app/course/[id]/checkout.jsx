import { Alert, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { PaymentCheckout } from '@/components/checkout/PaymentCheckout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchCoursePreview } from '@/utils/catalog';
import { initializePurchase, repairCourseAccess } from '@/utils/payments';
import { invalidatePurchasedCoursesCache } from '@/utils/courseCache';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token, user, grantCourseAccess, isEnrolled } = useAppState();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCoursePreview(String(id))
      .then((item) => {
        if (alive) setCourse(item);
      })
      .catch(() => {
        if (alive) setCourse(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!course) {
    return (
      <Screen>
        <Text>Course not found.</Text>
      </Screen>
    );
  }

  if (course.price <= 0) {
    return (
      <Screen>
        <Text style={typography.h2}>Free course</Text>
        <PrimaryButton
          label="Open learning area"
          onPress={() => router.replace(`/learn/${course.id}`)}
          style={{ marginTop: spacing.xl }}
        />
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

  if (!token || token === 'local') {
    return (
      <Screen>
        <Text style={typography.h2}>Sign in required</Text>
        <Text style={{ marginTop: spacing.sm, color: '#64748b' }}>
          Sign in with your phone to purchase this course.
        </Text>
      </Screen>
    );
  }

  const onPay = async ({ phone, email, amount, referralCode }) => {
    setPaying(true);
    try {
      await initializePurchase({
        token,
        itemType: 'course',
        itemId: course.id,
        amount,
        phone,
        email,
        referralCode,
      });
      grantCourseAccess(course.id);
      invalidatePurchasedCoursesCache();
      try {
        await repairCourseAccess(token);
      } catch {
        // non-blocking
      }
      Alert.alert('Payment successful', 'You now have full access to this course.', [
        { text: 'Start learning', onPress: () => router.replace(`/learn/${course.id}`) },
      ]);
    } catch (error) {
      Alert.alert('Payment failed', error.message || 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Screen>
      <PaymentCheckout
        title="Checkout"
        subtitle={course.title}
        price={course.price}
        user={user}
        paying={paying}
        onPay={onPay}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
