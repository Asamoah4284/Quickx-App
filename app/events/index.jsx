import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Badge, Card, Icon, Rise, Row, Tabs, Txt } from '@/components/ui/kit';
import { Page, RoundButton } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { eventEnded, priceLabel } from '@/utils/events';
import { themed } from '@/utils/themedStyles';


const FORMAT = { online: 'Online', 'in-person': 'In person', hybrid: 'Online and in person' };

function DateBlock({ value }) {
  const d = new Date(value);
  const ok = value && !Number.isNaN(d.getTime());
  return (
    <View style={styles.date}>
      <Txt size={11} weight="bold" color={t.brand300}>
        {ok ? d.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD'}
      </Txt>
      <Txt size={20} weight="bold" tabular>
        {ok ? d.getDate() : '--'}
      </Txt>
    </View>
  );
}

function EventCard({ event }) {
  const ended = eventEnded(event);
  return (
    <Card padded={false} onPress={() => router.push(`/events/${event._id}`)} style={{ overflow: 'hidden' }}>
      {event.coverImage ? <Image source={{ uri: assetUrl(event.coverImage) }} style={styles.cover} contentFit="cover" transition={200} /> : null}
      <Row gap={14} align="flex-start" style={{ padding: 16 }}>
        <DateBlock value={event.startDate} />
        <View style={{ flex: 1 }}>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            <Badge label={priceLabel(event)} tone={event.isFree ? 'up' : 'brand'} />
            {event.hasTicket ? <Badge label="You're going" tone="up" icon="check" /> : null}
            {ended ? <Badge label="Ended" /> : null}
          </Row>
          <Txt size={16} weight="semibold" numberOfLines={2} style={{ marginTop: 8 }}>
            {event.title}
          </Txt>
          <Row gap={6} style={{ marginTop: 6 }}>
            <Icon name={event.eventType === 'in-person' ? 'map-pin' : 'video'} size={13} color={t.fgSubtle} />
            <Txt size={12.5} color={t.fgSubtle} numberOfLines={1} style={{ flex: 1 }}>
              {[event.time, FORMAT[event.eventType] || event.venue].filter(Boolean).join(' · ')}
            </Txt>
          </Row>
        </View>
      </Row>
    </Card>
  );
}

export default function EventsScreen() {
  const { isSignedIn } = useAppState();
  const [tab, setTab] = useState('upcoming');
  const { data, error, refresh, refreshing } = useApi(`/events?status=published&timeFilter=${tab}`, { refetchOnFocus: true });
  const events = data?.events || [];

  return (
    <Page
      back
      eyebrow="Events"
      title="Masterclasses and meetups"
      subtitle="Live sessions with Maxwell, online and in person."
      right={isSignedIn ? <RoundButton icon="credit-card" label="My tickets" onPress={() => router.push('/events/my-tickets')} /> : null}
      refreshing={refreshing}
      onRefresh={refresh}>
      <View style={{ gap: 14 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
          ]}
        />
        {error ? <Alert>{error.message}</Alert> : null}
        {!data && !error ? (
          <>
            <Skeleton height={240} radius={20} />
            <Skeleton height={240} radius={20} />
          </>
        ) : null}
        {data && !events.length ? (
          <EmptyState
            icon="calendar"
            title={tab === 'upcoming' ? 'No events coming up' : 'No past events'}
            subtitle={tab === 'upcoming' ? 'New masterclasses are announced in the app and on Telegram.' : undefined}
          />
        ) : null}
        {events.map((event, i) => (
          <Rise key={event._id} index={i}>
            <EventCard event={event} />
          </Rise>
        ))}
      </View>
    </Page>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    cover: { width: '100%', aspectRatio: 16 / 8, backgroundColor: t.ink700 },
    date: { width: 52, paddingVertical: 8, borderRadius: 14, alignItems: 'center', backgroundColor: t.brandSoft },
  })
);
