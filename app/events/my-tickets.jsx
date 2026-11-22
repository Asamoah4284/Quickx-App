import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, Button, Tabs, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { SkeletonList } from '@/components/ui/Skeleton';
import { layout, radii, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchMyEventTickets } from '@/utils/events';
import { formatCurrency } from '@/utils/format';
import { themed } from '@/utils/themedStyles';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

function isPast(ticket) {
  const start = ticket.eventId?.endDate || ticket.eventId?.startDate;
  if (!start) return false;
  const d = new Date(start);
  // Treat the event as past at the end of its day.
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now() || ticket.eventId?.status === 'completed';
}

function dateParts(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return { month: 'TBD', day: '--' };
  return { month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(), day: String(d.getDate()) };
}

function Ticket({ item, onPress }) {
  const ev = item.eventId;
  const { month, day } = dateParts(ev.startDate);
  const cancelled = item.status === 'cancelled' || ev.status === 'cancelled';
  const status = cancelled ? 'Cancelled' : item.status === 'checked_in' ? 'Checked in' : item.isFree ? 'Free' : formatCurrency(item.pricePaid);
  return (
    <PressableScale style={[styles.ticket, cancelled && { opacity: 0.6 }]} onPress={onPress}>
      <View style={styles.stub}>
        <Txt size={12} weight="bold" color={t.brand300} style={{ letterSpacing: 1 }}>
          {month}
        </Txt>
        <Txt size={26} weight="extrabold" tabular style={{ lineHeight: 30 }}>
          {day}
        </Txt>
      </View>
      <View style={styles.main}>
        <Txt size={15} weight="bold" numberOfLines={2} style={{ lineHeight: 20 }}>
          {ev.title}
        </Txt>
        <Txt size={12} color={t.fgSubtle} numberOfLines={1} style={{ marginTop: 3 }}>
          {[ev.time, ev.venue].filter(Boolean).join(' · ') || 'Details on the event page'}
        </Txt>
        <View style={styles.foot}>
          <Txt size={12} weight="bold" color={t.brand300} tabular style={{ letterSpacing: 0.8 }}>
            {item.ticketNumber}
          </Txt>
          <Badge label={status} tone={cancelled ? 'down' : 'up'} />
        </View>
      </View>
    </PressableScale>
  );
}

export default function MyTicketsScreen() {
  const router = useRouter();
  const { token } = useAppState();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  const load = useCallback(async () => {
    try {
      setError('');
      setTickets(await fetchMyEventTickets(token));
    } catch (err) {
      setError(err.message || 'Could not load your tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(() => tickets.filter((x) => x.eventId && (tab === 'past' ? isPast(x) : !isPast(x))), [tickets, tab]);

  return (
    <Page
      back
      title="My tickets"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <View style={{ marginTop: layout.section, gap: 12 }}>
        {loading ? <SkeletonList count={3} imageHeight={0} gap={12} /> : null}
        {!loading && !visible.length ? (
          <EmptyState
            icon="ticket"
            title={error ? 'Could not load your tickets' : tab === 'past' ? 'No past events' : 'No upcoming tickets'}
            subtitle={error || 'Masterclasses, workshops and meetups you register for show up here.'}>
            <Button label={error ? 'Try again' : 'Browse events'} onPress={error ? load : () => router.push('/events')} />
          </EmptyState>
        ) : null}
        {!loading
          ? visible.map((item) => <Ticket key={String(item._id)} item={item} onPress={() => router.push(`/events/${item.eventId._id}`)} />)
          : null}
      </View>
    </Page>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    ticket: {
      flexDirection: 'row',
      backgroundColor: t.card,
      borderRadius: radii.card,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.line,
      minHeight: 104,
    },
    stub: {
      width: 76,
      backgroundColor: t.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: t.line,
      borderStyle: 'dashed',
    },
    main: { flex: 1, padding: layout.card, justifyContent: 'center' },
    foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8 },
  })
);
