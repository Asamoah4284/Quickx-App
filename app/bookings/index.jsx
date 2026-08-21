import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { getTutorById } from '@/data/tutors';
import { formatPriceCedi } from '@/utils/format';

export default function MyBookingsScreen() {
  const { bookings, cancelBooking, completeBooking } = useAppState();
  const [tab, setTab] = useState('upcoming');
  const router = useRouter();

  const filtered = useMemo(
    () => bookings.filter((b) => b.status === tab),
    [bookings, tab]
  );

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.md }]}>My Bookings</Text>
      <FilterChips
        options={[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ]}
        selected={tab}
        onSelect={setTab}
        style={{ marginBottom: spacing.lg }}
      />

      {!filtered.length ? (
        <EmptyState
          icon="calendar"
          title={`No ${tab} bookings`}
          subtitle="Book a tutor session from any tutor profile."
        />
      ) : (
        filtered.map((b) => {
          const tutor = getTutorById(b.tutorId);
          return (
            <View key={b.id} style={styles.card}>
              <Text style={styles.title}>{b.serviceName}</Text>
              <Text style={typography.caption}>
                {tutor?.name} · {b.date} · {b.time} · {b.durationMins} min
              </Text>
              <Text style={styles.price}>{formatPriceCedi(b.price)}</Text>
              {tab === 'upcoming' ? (
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Cancel"
                    variant="danger"
                    onPress={() => cancelBooking(b.id)}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    label="Mark done"
                    variant="secondary"
                    onPress={() => completeBooking(b.id)}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : null}
              <Pressable onPress={() => router.push(`/tutor/${b.tutorId}`)}>
                <Text style={styles.link}>View tutor</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  title: { fontWeight: '700', fontSize: 16, color: colors.text },
  price: { fontWeight: '800', color: colors.primary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  link: { color: colors.primary, fontWeight: '700', marginTop: spacing.sm },
});
