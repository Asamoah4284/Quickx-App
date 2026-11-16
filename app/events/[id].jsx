import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { buyEventTicket, fetchEventDetails, registerForEvent } from '@/utils/events';
import { formatCurrency } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { completeMoolrePayment, detectMomoNetwork } from '@/utils/moolre';
import { normalizeMomoPhone } from '@/utils/payments';

function formatLongDate(value) {
  if (!value) return 'Date to be announced';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date to be announced';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function typeLabel(type) {
  if (type === 'online') return 'Online';
  if (type === 'hybrid') return 'Hybrid';
  return 'In-person';
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user, walletBalance, loadWallet } = useAppState();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState('wallet'); // 'wallet' | 'momo'
  const [momoPhone, setMomoPhone] = useState(user?.phone || '');
  const [awaitingMomo, setAwaitingMomo] = useState(false);
  const [attendee, setAttendee] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const load = useCallback(async () => {
    try {
      setError('');
      setEvent(await fetchEventDetails(id, token));
    } catch (err) {
      setError(err.message || 'Could not load this event.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <FontAwesome name="calendar-times-o" size={32} color={colors.muted} />
        <Text style={styles.emptyTitle}>{error || 'Event not found'}</Text>
        <PrimaryButton label="Go back" variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </SafeAreaView>
    );
  }

  const isFree = event.isFree || !(Number(event.price) > 0);
  const price = Number(event.price) || 0;
  const soldOut = event.capacity > 0 && event.spotsRemaining <= 0;
  const isOpen = event.status === 'published';
  const ticket = event.ticket;

  const share = () => {
    Share.share({
      message: `${event.title} — ${formatLongDate(event.startDate)}${event.time ? `, ${event.time}` : ''}. Join me on QuickX Learn!`,
    }).catch(() => {});
  };

  const confirm = async () => {
    if (!attendee.name.trim()) {
      Alert.alert('Name required', 'Add the attendee’s name for the ticket.');
      return;
    }
    setBusy(true);
    const details = {
      attendeeName: attendee.name.trim(),
      attendeeEmail: attendee.email.trim(),
      attendeePhone: attendee.phone.trim(),
    };
    try {
      if (isFree) {
        await registerForEvent(id, details, token);
      } else if (method === 'wallet') {
        // The server deducts the wallet and issues the ticket atomically (auto-refund on failure).
        await buyEventTicket(id, { ...details, paymentMethod: 'wallet' }, token);
      } else {
        const momo = normalizeMomoPhone(momoPhone);
        if (!/^0\d{9}$/.test(momo)) throw new Error('Enter a valid 10-digit MoMo number.');
        setAwaitingMomo(true);
        const result = await completeMoolrePayment({
          token,
          body: {
            itemType: 'event',
            itemId: id,
            amount: price,
            momoNumber: momo,
            network: detectMomoNetwork(momo),
            transactionId: `qx_evt_momo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            shippingAddress: { fullName: details.attendeeName, email: details.attendeeEmail || undefined, phone: momo },
          },
        });
        if (!result?.completed) {
          throw new Error('Payment is still pending. Approve the MoMo prompt, then pull to refresh — your ticket appears once it’s confirmed.');
        }
      }
      haptics.success();
      setSheet(false);
      await Promise.all([load(), loadWallet()]);
      Alert.alert('You’re going!', 'Your ticket is confirmed. Find it any time under My tickets.');
    } catch (err) {
      haptics.error();
      Alert.alert('Couldn’t get your ticket', err.message || 'Please try again.');
    } finally {
      setBusy(false);
      setAwaitingMomo(false);
    }
  };

  const canAfford = isFree || method === 'momo' || walletBalance >= price;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.white}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <View style={styles.cover}>
          {event.coverImage ? (
            <Image source={{ uri: event.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          ) : (
            <LinearGradient colors={['#0C2340', '#1246C4']} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient colors={['rgba(7,21,47,0.55)', 'transparent', 'rgba(7,21,47,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={[styles.coverTop, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back">
              <FontAwesome name="arrow-left" size={16} color={colors.white} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={share} hitSlop={8} accessibilityLabel="Share event">
              <FontAwesome name="share-alt" size={15} color={colors.white} />
            </Pressable>
          </View>
          <View style={styles.coverBody}>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{event.category || 'General'}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isFree ? colors.success : colors.gold }]}>
                <Text style={[styles.badgeText, !isFree && { color: colors.navy }]}>{isFree ? 'FREE' : formatCurrency(price)}</Text>
              </View>
            </View>
            <Text style={styles.title}>{event.title}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {ticket ? (
            <View style={styles.ticket}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketLabel}>Your ticket</Text>
                <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                <Text style={styles.ticketMeta}>{ticket.attendeeName}</Text>
              </View>
              <FontAwesome name="ticket" size={34} color={colors.gold} />
            </View>
          ) : null}

          <View style={styles.card}>
            <Info icon="calendar" title={formatLongDate(event.startDate)} sub={event.time} />
            <Info
              icon={event.eventType === 'online' ? 'video-camera' : 'map-marker'}
              title={event.venue || typeLabel(event.eventType)}
              sub={[typeLabel(event.eventType), event.location].filter(Boolean).join(' · ')}
            />
            {event.capacity > 0 ? (
              <Info
                icon="users"
                title={soldOut ? 'Sold out' : `${event.spotsRemaining} of ${event.capacity} spots left`}
                sub={`${event.ticketsSold || 0} attending`}
                last
              />
            ) : (
              <Info icon="users" title="Open attendance" sub={`${event.ticketsSold || 0} attending`} last />
            )}
          </View>

          {ticket && event.meetingLink ? (
            <PrimaryButton
              label="Join event"
              icon="video-camera"
              onPress={() => Linking.openURL(event.meetingLink).catch(() => Alert.alert('Can’t open link', event.meetingLink))}
              style={{ marginBottom: spacing.lg }}
            />
          ) : null}

          <Text style={styles.section}>About this event</Text>
          <Text style={styles.description}>{event.description || event.shortDescription}</Text>

          {Array.isArray(event.speakers) && event.speakers.length ? (
            <>
              <Text style={styles.section}>Speakers</Text>
              {event.speakers.map((s, i) => (
                <View key={s._id || i} style={styles.speaker}>
                  {s.avatar ? (
                    <Image source={{ uri: s.avatar }} style={styles.speakerAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.speakerAvatar, styles.speakerFallback]}>
                      <Text style={styles.speakerLetter}>{(s.name || 'S').charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.speakerName}>{s.name}</Text>
                    {s.title ? <Text style={styles.speakerTitle}>{s.title}</Text> : null}
                    {s.bio ? <Text style={styles.speakerBio}>{s.bio}</Text> : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}

          <Text style={styles.section}>Organizer</Text>
          <View style={styles.card}>
            <Info icon="building-o" title={event.organizer?.name || 'QuickX Learning'} sub={event.organizer?.email} last />
          </View>
        </View>
      </ScrollView>

      {!ticket ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barPrice}>{isFree ? 'Free' : formatCurrency(price)}</Text>
            <Text style={styles.barHint}>{soldOut ? 'No spots left' : isOpen ? 'per ticket' : 'Registration closed'}</Text>
          </View>
          <PrimaryButton
            label={isFree ? 'Get free ticket' : 'Buy ticket'}
            icon="ticket"
            disabled={soldOut || !isOpen}
            onPress={() => setSheet(true)}
            style={{ flex: 1.3 }}
          />
        </View>
      ) : null}

      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={isFree ? 'Confirm registration' : 'Buy ticket'}
        subtitle={
          isFree
            ? event.title
            : method === 'wallet'
              ? `${formatCurrency(price)} from your QuickX wallet · balance ${formatCurrency(walletBalance)}`
              : `${formatCurrency(price)} via Mobile Money`
        }>
        {!isFree ? (
          <View style={styles.methodRow}>
            {[
              { id: 'wallet', label: 'QuickX Wallet', icon: 'credit-card' },
              { id: 'momo', label: 'Mobile Money', icon: 'mobile' },
            ].map((m) => {
              const active = method === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    if (!active) haptics.select();
                    setMethod(m.id);
                  }}
                  style={[styles.method, active && styles.methodActive]}>
                  <FontAwesome name={m.icon} size={14} color={active ? colors.white : colors.text} />
                  <Text style={[styles.methodText, active && { color: colors.white }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Text style={styles.fieldLabel}>Attendee name</Text>
        <TextInput style={styles.input} value={attendee.name} onChangeText={(v) => setAttendee((a) => ({ ...a, name: v }))} placeholderTextColor={colors.muted} />
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={attendee.email}
          onChangeText={(v) => setAttendee((a) => ({ ...a, email: v }))}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          value={attendee.phone}
          onChangeText={(v) => setAttendee((a) => ({ ...a, phone: v }))}
          keyboardType="phone-pad"
          placeholderTextColor={colors.muted}
        />
        {!isFree && method === 'momo' ? (
          <>
            <Text style={styles.fieldLabel}>MoMo number to charge</Text>
            <TextInput
              style={styles.input}
              value={momoPhone}
              onChangeText={setMomoPhone}
              keyboardType="phone-pad"
              placeholder="024 123 4567"
              placeholderTextColor={colors.muted}
            />
          </>
        ) : null}
        {awaitingMomo ? (
          <Text style={styles.pendingNote}>Approve the MoMo prompt on your phone — we’ll confirm your ticket automatically.</Text>
        ) : null}
        {canAfford ? (
          <PrimaryButton
            label={isFree ? 'Confirm my spot' : `Pay ${formatCurrency(price)}`}
            onPress={confirm}
            loading={busy}
            style={{ marginTop: spacing.sm }}
          />
        ) : (
          <>
            <Text style={styles.warn}>
              You need {formatCurrency(price - walletBalance)} more in your wallet for this ticket.
            </Text>
            <PrimaryButton
              label="Top up wallet"
              icon="plus"
              onPress={() => {
                setSheet(false);
                router.push('/wallet');
              }}
            />
          </>
        )}
      </BottomSheet>
    </View>
  );
}

function Info({ icon, title, sub, last }) {
  return (
    <View style={[styles.info, !last && styles.infoBorder]}>
      <View style={styles.infoIcon}>
        <FontAwesome name={icon} size={15} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        {sub ? <Text style={styles.infoSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  cover: { height: 320, justifyContent: 'space-between', backgroundColor: colors.navy },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(7,21,47,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBody: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.md },
  badges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  badge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  badgeText: { color: colors.white, fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },
  title: { color: colors.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  body: {
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  ticket: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  ticketLabel: { color: colors.gold, fontWeight: '800', fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  ticketNumber: { color: colors.white, fontSize: 22, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  ticketMeta: { color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  infoBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontWeight: '700', color: colors.text },
  infoSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  section: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  description: { color: colors.text, fontSize: 15, lineHeight: 23, marginBottom: spacing.lg },
  speaker: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  speakerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
  speakerFallback: { backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  speakerLetter: { color: colors.white, fontWeight: '800', fontSize: 18 },
  speakerName: { fontWeight: '800', color: colors.text },
  speakerTitle: { color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 1 },
  speakerBio: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  barPrice: { fontSize: 20, fontWeight: '800', color: colors.text },
  barHint: { fontSize: 12, color: colors.muted },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  warn: { color: colors.warning, fontWeight: '700', marginBottom: spacing.md },
  methodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  method: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  methodText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  pendingNote: {
    backgroundColor: '#FFF7E0',
    color: colors.navy,
    borderRadius: radii.md,
    padding: spacing.md,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
});
