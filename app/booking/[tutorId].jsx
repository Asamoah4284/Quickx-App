import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FilterChips } from '@/components/ui/FilterChips';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchTutorProfile } from '@/utils/catalog';
import { tutorWithBookingOptions } from '@/utils/bookingDefaults';
import { formatCurrency, formatPriceCedi } from '@/utils/format';

const DURATIONS = [
  { id: '30', label: '30 min' },
  { id: '45', label: '45 min' },
  { id: '60', label: '60 min' },
  { id: '90', label: '90 min' },
];

function nextDates(count = 6) {
  const out = [];
  const start = new Date();
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function BookingScreen() {
  const { tutorId, service: serviceParam } = useLocalSearchParams();
  const router = useRouter();
  const { createBooking, walletBalance, currency } = useAppState();
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState(null);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState(nextDates()[0]);
  const [time, setTime] = useState(null);
  const [duration, setDuration] = useState('60');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTutorProfile(String(tutorId))
      .then((profile) => {
        if (!alive) return;
        const withOptions = tutorWithBookingOptions(profile);
        setTutor(withOptions);
        setServiceId(String(serviceParam || withOptions.services[0]?.id));
        setTime(withOptions.availableSlots[0]);
      })
      .catch(() => {
        if (alive) setTutor(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tutorId, serviceParam]);

  const service = useMemo(
    () => tutor?.services?.find((s) => s.id === serviceId),
    [tutor, serviceId]
  );
  const dates = useMemo(() => nextDates(), []);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!tutor) {
    return (
      <Screen>
        <Text>Tutor not found.</Text>
      </Screen>
    );
  }

  const price = service?.price || 0;

  const confirm = async () => {
    const booking = await createBooking({
      tutorId: tutor.id,
      tutorName: tutor.name,
      serviceId: service.id,
      serviceName: service.name,
      date,
      time,
      durationMins: Number(duration),
      price,
    });
    if (!booking) {
      Alert.alert('Insufficient balance', 'Top up your QuickX Wallet to confirm this booking.');
      return;
    }
    Alert.alert(
      'Booking confirmed',
      `${tutor.name} will be notified. Reminder set before ${date} ${time}.`,
      [{ text: 'My bookings', onPress: () => router.replace('/bookings') }]
    );
  };

  return (
    <Screen>
      <Text style={typography.h2}>Book a session</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
        with {tutor.name} · Wallet {formatCurrency(walletBalance, currency)}
      </Text>

      <View style={styles.steps}>
        {['Service', 'Date', 'Time', 'Duration', 'Pay'].map((label, i) => (
          <View key={label} style={[styles.stepPill, step === i && styles.stepActive]}>
            <Text style={[styles.stepText, step === i && styles.stepTextActive]}>{label}</Text>
          </View>
        ))}
      </View>

      {step === 0 && (
        <>
          <Text style={styles.label}>Select service</Text>
          <FilterChips
            options={tutor.services.map((s) => ({
              id: s.id,
              label: `${s.name} · ₵${s.price}`,
            }))}
            selected={serviceId}
            onSelect={setServiceId}
          />
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.label}>Select date</Text>
          <FilterChips
            options={dates.map((d) => ({ id: d, label: d }))}
            selected={date}
            onSelect={setDate}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>Select time</Text>
          <FilterChips
            options={tutor.availableSlots.map((t) => ({ id: t, label: t }))}
            selected={time}
            onSelect={setTime}
          />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.label}>Duration</Text>
          <FilterChips options={DURATIONS} selected={duration} onSelect={setDuration} />
        </>
      )}

      {step === 4 && (
        <View style={styles.summary}>
          <SummaryRow label="Tutor" value={tutor.name} />
          <SummaryRow label="Service" value={service?.name} />
          <SummaryRow label="When" value={`${date} · ${time}`} />
          <SummaryRow label="Duration" value={`${duration} min`} />
          <SummaryRow label="Total" value={formatPriceCedi(price)} />
        </View>
      )}

      <View style={styles.nav}>
        {step > 0 ? (
          <PrimaryButton
            label="Back"
            variant="secondary"
            onPress={() => setStep((s) => s - 1)}
            style={{ flex: 1 }}
          />
        ) : null}
        {step < 4 ? (
          <PrimaryButton
            label="Continue"
            onPress={() => setStep((s) => s + 1)}
            style={{ flex: 1 }}
          />
        ) : (
          <PrimaryButton label={`Pay ${formatPriceCedi(price)}`} onPress={confirm} style={{ flex: 1 }} />
        )}
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xl },
  stepPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  stepActive: { backgroundColor: colors.primary },
  stepText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  stepTextActive: { color: colors.white },
  label: { ...typography.h3, marginBottom: spacing.md },
  summary: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { color: colors.muted },
  rowValue: { fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
  nav: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
});
