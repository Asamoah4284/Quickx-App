import { useMemo, useState } from 'react';
import { Alert as NativeAlert, Linking, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import FeatureGate from '@/components/FeatureGate';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Badge, Button, Card, Chips, Field, Icon, Input, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/constants/api';
import { LINKS } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

const STATUS = {
  upcoming: { label: 'Upcoming', tone: 'brand' },
  completed: { label: 'Completed', tone: 'up' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

const TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00'];

function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The next 14 days, starting tomorrow. */
function nextDays() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const label = i === 0 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return { value: isoDay(d), label };
  });
}

function BookingForm({ onBooked }) {
  const { token } = useAppState();
  const days = useMemo(nextDays, []);
  const [date, setDate] = useState(days[0].value);
  const [time, setTime] = useState('18:00');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/bookings', { method: 'POST', token, body: { date, time, topic } });
      haptics.success();
      setTopic('');
      setSent(true);
      onBooked();
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not request that session.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Txt size={17} weight="semibold">
        Request a 1-on-1 session
      </Txt>
      <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 4, lineHeight: 19 }}>
        Pick a time that suits you. Maxwell will confirm or suggest another slot.
      </Txt>
      <View style={{ gap: 16, marginTop: 16 }}>
        <Field label="Day">
          <Chips items={days} value={date} onChange={setDate} />
        </Field>
        <Field label="Time (Ghana time)">
          <Chips items={TIMES.map((x) => ({ value: x, label: x }))} value={time} onChange={setTime} />
        </Field>
        <Field label="What do you want to work on?" hint="Optional, but it helps Maxwell prepare.">
          <Input multiline value={topic} onChangeText={setTopic} maxLength={500} placeholder="For example, reviewing my last five trades" />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        {sent ? (
          <Animated.View entering={ZoomIn.springify()}>
            <Alert tone="up" title="Request sent">
              You will get a notification when Maxwell confirms.
            </Alert>
          </Animated.View>
        ) : null}
        <Button size="lg" label="Request session" loading={busy} onPress={submit} />
      </View>
    </Card>
  );
}

function Sessions() {
  const { token } = useAppState();
  const { data, error, reload, refresh, refreshing } = useApi('/bookings', { refetchOnFocus: true });
  const [cancelling, setCancelling] = useState('');

  const cancel = (id) =>
    NativeAlert.alert('Cancel this session?', undefined, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel session',
        style: 'destructive',
        onPress: async () => {
          setCancelling(id);
          try {
            await api(`/bookings/${id}/cancel`, { method: 'PATCH', token, body: {} });
            await reload({ quiet: true });
          } catch (err) {
            NativeAlert.alert('Could not cancel', err.message);
          } finally {
            setCancelling('');
          }
        },
      },
    ]);

  const bookings = data?.bookings || [];

  return (
    <Page
      back
      eyebrow="Mentorship"
      title="Work 1-on-1 with Maxwell"
      subtitle="Book sessions, get your trades reviewed and build a plan that fits you."
      keyboard
      refreshing={refreshing}
      onRefresh={refresh}>
      <View style={{ gap: 16 }}>
        <Rise>
          <BookingForm onBooked={() => reload({ quiet: true })} />
        </Rise>
        <Rise index={1}>
          <Card onPress={() => Linking.openURL(LINKS.whatsappMaxwell).catch(() => {})}>
            <Row gap={12}>
              <Icon name="message-circle" size={20} color={t.up} />
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="semibold">
                  Message Maxwell on WhatsApp
                </Txt>
                <Txt size={13} color={t.fgMuted}>
                  Quick questions between sessions.
                </Txt>
              </View>
              <Icon name="external-link" size={16} color={t.fgSubtle} />
            </Row>
          </Card>
        </Rise>

        <View style={{ marginTop: 6 }}>
          <SectionTitle title="Your sessions" />
          {error ? <Alert>{error.message}</Alert> : null}
          {!data && !error ? (
            <View style={{ gap: 10 }}>
              <Skeleton height={76} radius={16} />
              <Skeleton height={76} radius={16} />
            </View>
          ) : null}
          {data && !bookings.length ? <EmptyState icon="calendar" title="No sessions yet" subtitle="Request your first session above." /> : null}
          <View style={{ gap: 10 }}>
            {bookings.map((b, i) => (
              <Rise key={b.id} index={i}>
                <Card>
                  <Row justify="space-between" gap={10}>
                    <View style={{ flex: 1 }}>
                      <Row gap={14} style={{ flexWrap: 'wrap' }}>
                        <Row gap={6}>
                          <Icon name="calendar" size={14} color={t.fgSubtle} />
                          <Txt size={15} weight="semibold">
                            {formatDate(b.date)}
                          </Txt>
                        </Row>
                        <Row gap={6}>
                          <Icon name="clock" size={14} color={t.fgSubtle} />
                          <Txt size={15} weight="semibold" tabular>
                            {b.time}
                          </Txt>
                        </Row>
                      </Row>
                      {b.topic ? (
                        <Txt size={13} color={t.fgMuted} numberOfLines={2} style={{ marginTop: 4 }}>
                          {b.topic}
                        </Txt>
                      ) : null}
                    </View>
                    <Badge tone={STATUS[b.status]?.tone} label={STATUS[b.status]?.label || b.status} />
                  </Row>
                  {b.status === 'upcoming' ? (
                    <Button variant="ghost" size="sm" label="Cancel" loading={cancelling === b.id} style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => cancel(b.id)} />
                  ) : null}
                </Card>
              </Rise>
            ))}
          </View>
        </View>
      </View>
    </Page>
  );
}

export default function MentorshipScreen() {
  const { isSignedIn, has } = useAppState();
  if (isSignedIn && has('mentorship')) return <Sessions />;
  return (
    <Page back eyebrow="Mentorship" title="Work 1-on-1 with Maxwell" subtitle="Book sessions, get your trades reviewed and build a plan that fits you.">
      <FeatureGate feature="mentorship" />
    </Page>
  );
}
