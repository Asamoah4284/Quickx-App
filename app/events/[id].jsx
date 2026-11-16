import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Avatar, Badge, Button, Card, Field, Icon, Input, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Footer, Page, RoundButton } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, assetUrl } from '@/constants/api';
import { LINKS } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { cedis } from '@/utils/currency';
import { eventEnded, priceLabel } from '@/utils/events';
import { formatDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { confirmAgain, confirmers, payWithPaystack } from '@/utils/paystack';

const FORMAT = { online: 'Online', 'in-person': 'In person', hybrid: 'Online and in person' };

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <Row gap={12} align="flex-start">
      <Icon name={icon} size={16} color={t.brand300} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Txt size={12} color={t.fgSubtle}>
          {label}
        </Txt>
        <Txt size={14.5} weight="medium" style={{ marginTop: 1 }}>
          {value}
        </Txt>
      </View>
    </Row>
  );
}

function TicketSheet({ event, onClose, onDone }) {
  const { token, user } = useAppState();
  const paid = !(event.isFree || !Number(event.price));
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);

  const attendee = { attendeeName: name.trim(), attendeeEmail: email.trim(), attendeePhone: phone.trim() };
  const valid = attendee.attendeeName && (attendee.attendeeEmail || attendee.attendeePhone);

  const finish = (result) => {
    haptics.success();
    onDone(result);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (!paid) {
        const data = await api(`/events/${event._id}/register`, { method: 'POST', token, body: attendee });
        finish(data);
        return;
      }
      const outcome = await payWithPaystack({ token, purpose: 'event', body: { id: event._id }, confirm: confirmers.event(token, event._id, attendee) });
      if (outcome.status === 'paid') finish(outcome.result);
      else if (outcome.status === 'pending') setPending(outcome);
    } catch (err) {
      haptics.error();
      setError(err.message || (paid ? 'Could not start the payment.' : 'Registration failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const checkAgain = async () => {
    setBusy(true);
    const outcome = await confirmAgain(pending.reference, confirmers.event(token, event._id, attendee));
    setBusy(false);
    if (outcome.status === 'paid') finish(outcome.result);
    else setPending(outcome);
  };

  return (
    <BottomSheet visible onClose={onClose} title={paid ? 'Get your ticket' : 'Reserve your seat'} subtitle={event.title}>
      <View style={{ gap: 14, paddingBottom: 12 }}>
        <Field label="Full name">
          <Input value={name} onChangeText={setName} autoComplete="name" icon="user" />
        </Field>
        <Field label="Email">
          <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" icon="mail" />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" icon="phone" />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        {pending ? (
          <>
            <Alert tone="warn" title="Waiting for your payment">
              {`${pending.message} You will not be charged twice. Reference: ${pending.reference}`}
            </Alert>
            <Button size="lg" icon="refresh-cw" label="Check payment again" loading={busy} onPress={checkAgain} />
          </>
        ) : (
          <Button size="lg" label={paid ? `Pay ${cedis(Number(event.price))}` : 'Confirm my seat'} loading={busy} disabled={!valid} onPress={submit} />
        )}
        {paid ? (
          <Txt size={12} color={t.fgSubtle} center>
            Pay with Mobile Money or card through Paystack.
          </Txt>
        ) : null}
      </View>
    </BottomSheet>
  );
}

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const { isSignedIn, requireSignIn } = useAppState();
  const { data, error, refresh, refreshing, reload } = useApi(`/events/${id}`);
  const [event, setEvent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [buying, setBuying] = useState(false);
  const [justBooked, setJustBooked] = useState(false);

  useEffect(() => {
    if (data?.event) {
      setEvent(data.event);
      if (data.event.ticket) setTicket(data.event.ticket);
    }
  }, [data]);

  if (!event) {
    return (
      <Page back>
        {error ? (
          <EmptyState icon="calendar" title="This event could not be found" subtitle={error.message}>
            <Button label="All events" onPress={() => router.replace('/events')} />
          </EmptyState>
        ) : (
          <View style={{ gap: 14 }}>
            <Skeleton height={200} radius={20} />
            <Skeleton height={30} width="80%" />
            <Skeleton height={120} radius={20} />
          </View>
        )}
      </Page>
    );
  }

  const ended = eventEnded(event);
  const soldOut = event.capacity > 0 && (event.ticketsSold || 0) >= event.capacity;
  const spotsLeft = event.capacity > 0 ? Math.max(0, event.capacity - (event.ticketsSold || 0)) : null;
  const hasTicket = Boolean(event.hasTicket || ticket);
  const ticketNumber = ticket?.ticketNumber || event.myTicketNumber;
  const paid = !(event.isFree || !Number(event.price));

  const start = async () => {
    if (!isSignedIn) {
      const ok = await requireSignIn(paid ? 'Sign in to buy your ticket.' : 'Sign in to reserve your seat.');
      if (!ok) return;
    }
    setBuying(true);
  };

  const footer = ended ? null : hasTicket ? (
    event.meetingLink && event.eventType !== 'in-person' ? (
      <Footer>
        <Button size="lg" icon="video" label="Open the meeting link" onPress={() => Linking.openURL(event.meetingLink).catch(() => {})} />
      </Footer>
    ) : null
  ) : (
    <Footer>
      <Row gap={14}>
        <View>
          <Txt size={11.5} color={t.fgSubtle}>
            {paid ? 'Ticket' : 'Entry'}
          </Txt>
          <Txt size={18} weight="bold" tabular>
            {priceLabel(event)}
          </Txt>
        </View>
        <Button size="lg" label={soldOut ? 'Sold out' : paid ? 'Get ticket' : 'Reserve my seat'} disabled={soldOut} onPress={start} style={{ flex: 1 }} />
      </Row>
    </Footer>
  );

  return (
    <>
      <Page
        back
        right={
          <RoundButton
            icon="share"
            label="Share event"
            onPress={() => Share.share({ message: `${event.title} on QuickX: ${LINKS.website}/events/${event._id}` }).catch(() => {})}
          />
        }
        refreshing={refreshing}
        onRefresh={refresh}
        footer={footer}>
        <View style={{ gap: 20 }}>
          {event.coverImage ? (
            <Rise>
              <Image source={{ uri: assetUrl(event.coverImage) }} style={styles.cover} contentFit="cover" transition={200} />
            </Rise>
          ) : null}
          <Rise index={1}>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Badge label={event.category || 'Masterclass'} tone="brand" />
              <Badge label={FORMAT[event.eventType] || 'Online'} />
              {ended ? <Badge label="Ended" /> : null}
            </Row>
            <Txt size={26} weight="bold" style={{ marginTop: 10, letterSpacing: -0.5, lineHeight: 32 }}>
              {event.title}
            </Txt>
            {event.shortDescription ? (
              <Txt size={15} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 22 }}>
                {event.shortDescription}
              </Txt>
            ) : null}
          </Rise>

          {hasTicket ? (
            <Animated.View entering={justBooked ? ZoomIn.springify() : undefined}>
              <Card tone="up">
                <Row gap={12}>
                  <Icon name="check-circle" size={22} color={t.up} />
                  <View style={{ flex: 1 }}>
                    <Txt size={15} weight="semibold">
                      {justBooked ? 'You are in. See you there!' : 'You have a ticket'}
                    </Txt>
                    {ticketNumber ? (
                      <Txt size={13} color={t.fgMuted} tabular style={{ marginTop: 2 }}>
                        Ticket #{ticketNumber}
                      </Txt>
                    ) : null}
                  </View>
                </Row>
              </Card>
            </Animated.View>
          ) : null}
          {ended && !hasTicket ? <Alert tone="brand">This event has ended. Check upcoming events for the next one.</Alert> : null}
          {!ended && spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 20 && !hasTicket ? <Alert tone="warn">Only {spotsLeft} spots left.</Alert> : null}

          <Card>
            <View style={{ gap: 14 }}>
              <InfoRow icon="calendar" label="Date" value={formatDate(event.startDate)} />
              <InfoRow icon="clock" label="Time" value={event.time} />
              <InfoRow icon={event.eventType === 'in-person' ? 'map-pin' : 'video'} label="Where" value={[event.venue, event.location].filter(Boolean).join(', ')} />
              <InfoRow icon="tag" label="Price" value={priceLabel(event)} />
            </View>
          </Card>

          {event.description ? (
            <View>
              <SectionTitle title="About this event" />
              <Txt size={15} color={t.fgMuted} style={{ lineHeight: 23 }}>
                {event.description}
              </Txt>
            </View>
          ) : null}

          {event.speakers?.length ? (
            <View>
              <SectionTitle title="Speakers" />
              <View style={{ gap: 10 }}>
                {event.speakers.map((spk, i) => (
                  <Card key={spk._id || i}>
                    <Row gap={12} align="flex-start">
                      <Avatar uri={assetUrl(spk.image || spk.photo)} name={spk.name} size={44} />
                      <View style={{ flex: 1 }}>
                        <Txt size={15} weight="semibold">
                          {spk.name}
                        </Txt>
                        {spk.title ? (
                          <Txt size={12.5} color={t.brand300} style={{ marginTop: 1 }}>
                            {spk.title}
                          </Txt>
                        ) : null}
                        {spk.bio ? (
                          <Txt size={13} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 19 }}>
                            {spk.bio}
                          </Txt>
                        ) : null}
                      </View>
                    </Row>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          {event.tags?.length ? (
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {event.tags.map((tag) => (
                <Badge key={tag} label={`#${tag}`} />
              ))}
            </Row>
          ) : null}
        </View>
      </Page>

      {buying ? (
        <TicketSheet
          event={event}
          onClose={() => setBuying(false)}
          onDone={(result) => {
            setBuying(false);
            setJustBooked(true);
            if (result?.ticket) setTicket(result.ticket);
            if (result?.event) setEvent(result.event);
            else setEvent((e) => ({ ...e, hasTicket: true }));
            reload({ quiet: true });
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, backgroundColor: t.ink700 },
});
