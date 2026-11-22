import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { CourseProgressRow } from '@/components/courses/CourseTile';
import PieCard from '@/components/pie/PieCard';
import SignalCard from '@/components/signals/SignalCard';
import { SignalStats } from '@/components/signals/TrackRecord';
import { Badge, Button, Card, Icon, IconBox, PulseDot, Rise, Row, SectionTitle, Txt } from '@/components/ui/kit';
import { Logo } from '@/components/ui/Logo';
import { Page, RoundButton } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { FEATURE_LIST, LINKS } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { daysLeft, firstName, formatDate, greeting } from '@/utils/format';
import { fetchNotifications } from '@/utils/notifications';
import { eventEnded, priceLabel } from '@/utils/events';

const TELEGRAM = 'https://t.me/quickxtrading';

const EXPLORE = [
  { label: 'Plans', icon: 'award', route: '/pricing' },
  { label: 'Pie trading', icon: 'pie-chart', route: '/pie' },
  { label: 'Mentorship', icon: 'target', route: '/mentorship' },
  { label: 'Books', icon: 'book', route: '/books' },
  { label: 'Events', icon: 'calendar', route: '/events' },
  { label: 'Wallet', icon: 'credit-card', route: '/wallet', signedIn: true },
];

/** Big welcome for visitors who have not signed in. */
function Hero() {
  const { requireSignIn } = useAppState();
  return (
    <Rise>
      <Card padded={false} style={{ overflow: 'hidden', borderColor: 'rgba(91,143,255,0.3)' }}>
        <LinearGradient colors={['rgba(47,107,255,0.35)', 'rgba(13,19,34,0)']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ padding: 22 }}>
          <Badge label="Forex with Maxwell" tone="brand" dot />
          <Txt size={30} weight="extrabold" style={{ marginTop: 14, letterSpacing: -0.8, lineHeight: 36 }}>
            Learn to trade.{'\n'}Trade with confidence.
          </Txt>
          <Txt size={15} color={t.fgMuted} style={{ marginTop: 10, lineHeight: 22 }}>
            Courses, live signals, a free community and 1-on-1 mentorship, all in one app.
          </Txt>
          <View style={{ gap: 10, marginTop: 20 }}>
            <Button size="lg" label="See plans" iconRight="arrow-right" onPress={() => router.push('/pricing')} />
            <Button variant="secondary" label="I already have an account" onPress={() => requireSignIn()} />
          </View>
        </View>
      </Card>
    </Rise>
  );
}

/** What this member has, and what they could add. */
function Access() {
  const { has, expiryOf, isOwner, isSignedIn } = useAppState();
  return (
    <View>
      <SectionTitle title="Your access" action="Plans" onAction={() => router.push('/pricing')} />
      <View style={styles.grid}>
        {FEATURE_LIST.map((f, i) => {
          const on = f.free ? isSignedIn : isOwner || has(f.key);
          const left = f.free ? null : daysLeft(expiryOf(f.key));
          return (
            <Rise key={f.key} index={i} style={styles.cell}>
              <PressableScale onPress={() => router.push(f.route)} style={[styles.feature, on && styles.featureOn]}>
                <Row justify="space-between">
                  <IconBox name={f.icon} size={36} iconSize={17} tone={on ? 'brand' : 'neutral'} />
                  <Icon name={on ? 'check-circle' : 'lock'} size={15} color={on ? t.up : t.fgSubtle} />
                </Row>
                <Txt size={14.5} weight="semibold" style={{ marginTop: 12 }}>
                  {f.label}
                </Txt>
                <Txt size={12} color={on && left && left <= 7 ? t.warn : t.fgSubtle} style={{ marginTop: 2 }}>
                  {f.free
                    ? 'Free for members'
                    : on
                      ? isOwner
                        ? 'Owner'
                        : left
                          ? left <= 7
                            ? `Ends in ${left} day${left === 1 ? '' : 's'}`
                            : `Until ${formatDate(expiryOf(f.key))}`
                          : 'Active'
                      : 'Tap to unlock'}
                </Txt>
              </PressableScale>
            </Rise>
          );
        })}
      </View>
    </View>
  );
}

function SignalsTeaser() {
  const { isSignedIn, has } = useAppState();
  const member = isSignedIn && has('signals');
  const feed = useApi(member ? '/signals?page=1&limit=1' : null, { refetchOnFocus: true });
  const record = useApi(member ? null : '/signals/public');
  const latest = feed.data?.open?.[0];

  if (member) {
    return (
      <View>
        <SectionTitle title={latest ? 'Latest signal' : 'Signals'} action="All signals" onAction={() => router.push('/signals')} />
        {latest ? (
          <SignalCard signal={latest} />
        ) : (
          <Card onPress={() => router.push('/signals')}>
            <Row gap={12}>
              <IconBox name="activity" size={40} />
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="semibold">
                  No live signals right now
                </Txt>
                <Txt size={13} color={t.fgMuted} style={{ marginTop: 2 }}>
                  You will get a notification the moment one is posted.
                </Txt>
              </View>
            </Row>
          </Card>
        )}
      </View>
    );
  }

  if (!record.data?.stats?.total) return null;
  return (
    <View>
      <SectionTitle title="Signals track record" action="See more" onAction={() => router.push('/signals')} />
      <Card onPress={() => router.push('/signals')}>
        <Row gap={8} style={{ marginBottom: 12 }}>
          {record.data.openCount ? <PulseDot /> : null}
          <Txt size={13} color={t.fgMuted} style={{ flex: 1 }}>
            {record.data.openCount ? `${record.data.openCount} live now for members` : `Last ${record.data.stats.periodDays} days`}
          </Txt>
        </Row>
        <SignalStats stats={record.data.stats} />
      </Card>
    </View>
  );
}

function ContinueLearning() {
  const { isSignedIn } = useAppState();
  const mine = useApi(isSignedIn ? '/courses/user/purchased' : null, { refetchOnFocus: true });
  const list = Array.isArray(mine.data) ? mine.data : [];
  const next = list.find((c) => Number(c.progress ?? 0) < 100) || list[0];
  if (!next) return null;
  return (
    <View>
      <SectionTitle title="Continue learning" action="Courses" onAction={() => router.push('/courses')} />
      <CourseProgressRow course={next} />
    </View>
  );
}

function OpenPie() {
  const { data } = useApi('/ptrading?status=funding', { refetchOnFocus: true });
  const pie = data?.pies?.[0];
  if (!pie) return null;
  return (
    <View>
      <SectionTitle title="Pie open now" action="All Pies" onAction={() => router.push('/pie')} />
      <PieCard pie={pie} />
    </View>
  );
}

function NextEvent() {
  const { data } = useApi('/events?status=published&timeFilter=upcoming');
  const event = (data?.events || []).find((e) => !eventEnded(e));
  if (!event) return null;
  const d = new Date(event.startDate);
  return (
    <View>
      <SectionTitle title="Next event" action="All events" onAction={() => router.push('/events')} />
      <Card onPress={() => router.push(`/events/${event._id}`)}>
        <Row gap={14}>
          <View style={styles.date}>
            <Txt size={11} weight="bold" color={t.brand300}>
              {d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </Txt>
            <Txt size={20} weight="bold" tabular>
              {d.getDate()}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={15} weight="semibold" numberOfLines={2}>
              {event.title}
            </Txt>
            <Txt size={12.5} color={t.fgSubtle} style={{ marginTop: 3 }}>
              {[event.time, priceLabel(event), event.hasTicket ? "You're going" : null].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          <Icon name="chevron-right" size={18} color={t.fgSubtle} />
        </Row>
      </Card>
    </View>
  );
}

function Explore() {
  const { isSignedIn } = useAppState();
  const items = EXPLORE.filter((x) => !x.signedIn || isSignedIn);
  return (
    <View>
      <SectionTitle title="Explore" />
      <View style={styles.grid}>
        {items.map((item, i) => (
          <Rise key={item.route} index={i} style={styles.third}>
            <PressableScale onPress={() => router.push(item.route)} style={styles.explore}>
              <Icon name={item.icon} size={20} color={t.brand300} />
              <Txt size={12.5} weight="semibold" center style={{ marginTop: 8 }}>
                {item.label}
              </Txt>
            </PressableScale>
          </Rise>
        ))}
      </View>
    </View>
  );
}

function Socials() {
  return (
    <Row gap={10}>
      <Card style={{ flex: 1 }} onPress={() => Linking.openURL(TELEGRAM).catch(() => {})}>
        <Icon name="send" size={18} color={t.brand300} />
        <Txt size={14} weight="semibold" style={{ marginTop: 10 }}>
          Telegram
        </Txt>
        <Txt size={12} color={t.fgSubtle}>
          Free updates
        </Txt>
      </Card>
      <Card style={{ flex: 1 }} onPress={() => Linking.openURL(LINKS.whatsappMaxwell).catch(() => {})}>
        <Icon name="message-circle" size={18} color={t.up} />
        <Txt size={14} weight="semibold" style={{ marginTop: 10 }}>
          WhatsApp
        </Txt>
        <Txt size={12} color={t.fgSubtle}>
          Talk to Maxwell
        </Txt>
      </Card>
    </Row>
  );
}

export default function HomeScreen() {
  const { isSignedIn, user, token, refreshAccess } = useAppState();
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setUnread(0);
        return;
      }
      fetchNotifications(token, { unreadOnly: true })
        .then((r) => setUnread(r.unreadCount))
        .catch(() => {});
    }, [token])
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.resolve(refreshAccess?.()).catch(() => {});
    setKey((k) => k + 1);
    setRefreshing(false);
  };

  return (
    <Page
      tabs
      refreshing={refreshing}
      onRefresh={refresh}
      header={
        <View style={{ paddingTop: 8, marginBottom: 22, gap: 20 }}>
          <Row justify="space-between">
            <Logo size={30} />
            {isSignedIn ? (
              <RoundButton icon="bell" label="Notifications" badge={unread} onPress={() => router.push('/notifications')} />
            ) : null}
          </Row>
          {isSignedIn ? (
            <Rise>
              <Txt size={14} color={t.fgMuted}>
                {greeting()}
              </Txt>
              <Txt size={28} weight="bold" style={{ letterSpacing: -0.7, marginTop: 2 }}>
                {firstName(user?.fullName) || 'Trader'}
              </Txt>
            </Rise>
          ) : null}
        </View>
      }>
      <View key={key} style={{ gap: 28 }}>
        {isSignedIn ? <Access /> : <Hero />}
        <SignalsTeaser />
        <ContinueLearning />
        <OpenPie />
        <NextEvent />
        <Explore />
        <Socials />
        <Txt size={11.5} color={t.fgSubtle} center style={{ lineHeight: 17 }}>
          Trading carries risk. Signals, courses and Pies are for learning and are not financial advice.
        </Txt>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { width: '50%', padding: 5 },
  third: { width: '33.333%', padding: 5 },
  feature: { borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, padding: 14 },
  featureOn: { borderColor: 'rgba(91,143,255,0.35)' },
  explore: { borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, paddingVertical: 16, alignItems: 'center' },
  date: { width: 52, paddingVertical: 8, borderRadius: 14, alignItems: 'center', backgroundColor: t.brandSoft },
});
