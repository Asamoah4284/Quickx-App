import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { SkeletonList } from '@/components/ui/Skeleton';
import { colors, radii, shadow, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { fetchEvents } from '@/utils/events';
import { haptics } from '@/utils/haptics';

const FILTER_TABS = [
  { id: 'all', label: 'All Events' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
  { id: 'online', label: 'Online' },
  { id: 'in-person', label: 'In-Person' },
];

function formatDateBadge(dateStr) {
  if (!dateStr) return { month: 'TBD', day: '--' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { month: 'TBD', day: '--' };
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return { month, day: String(day) };
}

function formatFullDate(dateStr, timeStr) {
  if (!dateStr) return timeStr || 'Date to be announced';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return timeStr || '';
  const dateFormatted = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return timeStr ? `${dateFormatted} · ${timeStr}` : dateFormatted;
}

export default function EventsScreen() {
  const router = useRouter();
  const { token } = useAppState();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadEvents = useCallback(async () => {
    try {
      const isFree = activeTab === 'free' ? true : activeTab === 'paid' ? false : undefined;
      const eventType = activeTab === 'online' ? 'online' : activeTab === 'in-person' ? 'in-person' : undefined;

      const data = await fetchEvents({
        isFree,
        eventType,
        search: searchQuery.trim() || undefined,
        token: token && token !== 'local' ? token : undefined,
      });
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, token]);

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const renderEventCard = ({ item }) => {
    const { month, day } = formatDateBadge(item.startDate);
    const isFree = item.isFree || item.price === 0;

    return (
      <PressableScale
        style={styles.card}
        scaleTo={0.98}
        onPress={() => router.push(`/events/${item._id || item.id}`)}>
        {/* Cover Image & Badges */}
        <View style={styles.imageContainer}>
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={styles.cardImage} contentFit="cover" transition={200} />
          ) : (
            <LinearGradient
              colors={['#0C2340', '#1246C4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardImagePlaceholder}>
              <FontAwesome name="calendar" size={40} color="rgba(255,255,255,0.4)" />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(7, 21, 47, 0.75)']}
            style={styles.imageOverlay}
          />

          {/* Date Stamp Pill */}
          <View style={styles.dateStamp}>
            <Text style={styles.dateStampMonth}>{month}</Text>
            <Text style={styles.dateStampDay}>{day}</Text>
          </View>

          {/* Top Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, item.eventType === 'online' ? styles.onlineBadge : styles.inPersonBadge]}>
              <FontAwesome
                name={item.eventType === 'online' ? 'video-camera' : 'map-marker'}
                size={11}
                color={colors.white}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.badgeText}>
                {item.eventType === 'online' ? 'Online' : item.eventType === 'hybrid' ? 'Hybrid' : 'In-Person'}
              </Text>
            </View>

            <View style={[styles.priceBadge, isFree ? styles.freeBadge : styles.paidBadge]}>
              <Text style={styles.priceBadgeText}>
                {isFree ? 'FREE' : `₵${Number(item.price || 0).toFixed(2)}`}
              </Text>
            </View>
          </View>

          {/* User has ticket indicator */}
          {item.hasTicket && (
            <View style={styles.bookedPill}>
              <FontAwesome name="check-circle" size={12} color={colors.white} />
              <Text style={styles.bookedText}>You have a ticket</Text>
            </View>
          )}
        </View>

        {/* Content Body */}
        <View style={styles.cardBody}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{item.category || 'General'}</Text>
            {item.capacity > 0 && (
              <Text style={styles.spotsText}>
                {Math.max(0, item.capacity - (item.ticketsSold || 0))} spots left
              </Text>
            )}
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.shortDescription || item.description}
          </Text>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <FontAwesome name="clock-o" size={13} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatFullDate(item.startDate, item.time)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <FontAwesome name="map-marker" size={13} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.venue || (item.eventType === 'online' ? 'Virtual (Zoom / Meet)' : 'Accra, Ghana')}
            </Text>
          </View>

          {/* Card Action */}
          <View style={styles.actionRow}>
            <View style={styles.organizerInfo}>
              <FontAwesome name="users" size={12} color={colors.primary} />
              <Text style={styles.organizerName} numberOfLines={1}>
                {item.organizer?.name || 'QuickX'}
              </Text>
            </View>

            <Pressable
              style={[styles.actionBtn, item.hasTicket ? styles.actionBtnSecondary : styles.actionBtnPrimary]}
              onPress={() => router.push(`/events/${item._id || item.id}`)}>
              <Text style={[styles.actionBtnText, item.hasTicket ? styles.actionBtnTextSecondary : styles.actionBtnTextPrimary]}>
                {item.hasTicket ? 'View Ticket' : isFree ? 'Get Free Ticket' : 'Buy Ticket'}
              </Text>
              <FontAwesome
                name={item.hasTicket ? 'ticket' : 'arrow-right'}
                size={12}
                color={item.hasTicket ? colors.primary : colors.white}
              />
            </Pressable>
          </View>
        </View>
      </PressableScale>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* Top Header Background */}
      <LinearGradient colors={['#07152F', '#0C2340', '#1246C4']} locations={[0, 0.6, 1]} style={styles.heroBg} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={16} color={colors.white} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerKicker}>QUICKX</Text>
            <Text style={styles.headerTitle}>Events & Masterclasses</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.ticketsBtn}
              accessibilityLabel="My tickets"
              onPress={() => router.push('/events/my-tickets')}>
              <FontAwesome name="ticket" size={14} color={colors.navy} />
              <Text style={styles.ticketsBtnText}>My tickets</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={15} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search events, topics, or speakers..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => setSearchQuery(searchInput)}
          />
          {searchInput ? (
            <Pressable onPress={() => setSearchInput('')} hitSlop={8}>
              <FontAwesome name="times-circle" size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.tabScrollWrap}>
          <FlatList
            horizontal
            data={FILTER_TABS}
            keyExtractor={(tab) => tab.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
            renderItem={({ item: tab }) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => {
                    if (!active) haptics.select();
                    setActiveTab(tab.id);
                  }}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Event List */}
        <View style={styles.sheet}>
          {loading ? (
            <View style={styles.listContent}>
              <SkeletonList count={2} imageHeight={180} />
            </View>
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={renderEventCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <FontAwesome name="calendar-o" size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No events found</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? `No events matching "${searchQuery}". Try different keywords.`
                      : 'There are no events listed under this filter right now. Check back soon!'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    height: 240,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerKicker: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  ticketsBtnText: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radii.full,
    ...shadow.card,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  tabScrollWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  tabTextActive: {
    color: colors.navy,
    fontWeight: '700',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dateStamp: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  dateStampMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  dateStampDay: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.navy,
    lineHeight: 20,
  },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radii.full,
  },
  onlineBadge: {
    backgroundColor: 'rgba(18, 70, 196, 0.88)',
  },
  inPersonBadge: {
    backgroundColor: 'rgba(232, 176, 32, 0.92)',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  priceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  freeBadge: {
    backgroundColor: colors.success,
  },
  paidBadge: {
    backgroundColor: colors.navy,
  },
  priceBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bookedPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(30, 190, 87, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  bookedText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spotsText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  organizerName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(27, 94, 245, 0.1)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextPrimary: {
    color: colors.white,
  },
  actionBtnTextSecondary: {
    color: colors.primary,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(27, 94, 245, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  createEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.full,
  },
  createEventBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
