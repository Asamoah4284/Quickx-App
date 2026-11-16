import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { SkeletonList } from '@/components/ui/Skeleton';
import { colors, radii, shadow, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchMyEventTickets } from '@/utils/events';
import { formatCurrency } from '@/utils/format';
import { haptics } from '@/utils/haptics';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
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

  const visible = useMemo(
    () => tickets.filter((t) => t.eventId && (tab === 'past' ? isPast(t) : !isPast(t))),
    [tickets, tab]
  );

  const renderItem = ({ item }) => {
    const ev = item.eventId;
    const { month, day } = dateParts(ev.startDate);
    const cancelled = item.status === 'cancelled' || ev.status === 'cancelled';
    return (
      <PressableScale style={[styles.ticket, cancelled && { opacity: 0.6 }]} onPress={() => router.push(`/events/${ev._id}`)}>
        <View style={styles.stub}>
          <Text style={styles.month}>{month}</Text>
          <Text style={styles.day}>{day}</Text>
        </View>
        <View style={styles.perforation}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.hole} />
          ))}
        </View>
        <View style={styles.main}>
          <Text style={styles.title} numberOfLines={2}>
            {ev.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {ev.time || ''}
            {ev.time && ev.venue ? ' · ' : ''}
            {ev.venue || ''}
          </Text>
          <View style={styles.row}>
            <Text style={styles.number}>{item.ticketNumber}</Text>
            <Text style={[styles.status, cancelled && { color: colors.danger }]}>
              {cancelled ? 'Cancelled' : item.status === 'checked_in' ? 'Checked in' : item.isFree ? 'Free' : formatCurrency(item.pricePaid)}
            </Text>
          </View>
        </View>
      </PressableScale>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                if (!active) haptics.select();
                setTab(t.id);
              }}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonList count={3} imageHeight={0} gap={spacing.md} />
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <FontAwesome name="ticket" size={30} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>{error ? 'Couldn’t load tickets' : tab === 'past' ? 'No past events' : 'No upcoming tickets'}</Text>
              <Text style={styles.emptySub}>
                {error || 'Masterclasses, workshops and meetups you register for will show up here.'}
              </Text>
              <Pressable style={styles.cta} onPress={error ? load : () => router.push('/events')}>
                <Text style={styles.ctaText}>{error ? 'Try again' : 'Browse events'}</Text>
              </Pressable>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  tabs: {
    flexDirection: 'row',
    margin: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.full },
  tabActive: { backgroundColor: colors.navy },
  tabText: { fontWeight: '700', color: colors.muted, fontSize: 13 },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
  ticket: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  stub: { width: 74, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  month: { color: colors.gold, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  day: { color: colors.white, fontWeight: '900', fontSize: 26 },
  perforation: { width: 10, justifyContent: 'space-evenly', alignItems: 'center', marginLeft: -5 },
  hole: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface },
  main: { flex: 1, padding: spacing.md, paddingLeft: spacing.sm },
  title: { fontWeight: '800', color: colors.text, fontSize: 15, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  number: { fontWeight: '800', color: colors.primary, letterSpacing: 1, fontSize: 12 },
  status: { fontWeight: '700', color: colors.success, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(27,94,245,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  emptySub: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  cta: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.full },
  ctaText: { color: colors.white, fontWeight: '700' },
});
