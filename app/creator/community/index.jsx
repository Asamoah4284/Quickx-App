import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import {
  fetchCommunityPosts,
  fetchCommunityQuestions,
  fetchCommunityStats,
} from '@/utils/community';
import {
  createCommunityBlock,
  fetchCommunityBlocks,
  fetchCommunityReports,
  fetchCommunitySettings,
  fetchInstructorSubscribers,
  removeCommunityBlock,
  updateCommunityPost,
  updateCommunityQuestion,
  updateCommunityReport,
  updateCommunitySettings,
  deleteCommunityPost,
} from '@/utils/creatorCommunity';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'qa', label: 'Q&A' },
  { id: 'reports', label: 'Reports' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'settings', label: 'Settings' },
];

export default function CreatorCommunityScreen() {
  const router = useRouter();
  const { token, user } = useAppState();
  const { approved, syncing } = useCreatorAccess();
  const tutorId = String(user?.id || '');
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reports, setReports] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [settings, setSettings] = useState({ allowPeerMessaging: false, communityGuidelines: '' });
  const [blockUserId, setBlockUserId] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockMode, setBlockMode] = useState('block');

  const load = useCallback(async () => {
    if (!token || token === 'local' || !approved || !tutorId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [s, p, q, r, b, subs, set] = await Promise.all([
        fetchCommunityStats(tutorId).catch(() => null),
        fetchCommunityPosts(tutorId, token).catch(() => []),
        fetchCommunityQuestions(tutorId, token).catch(() => []),
        fetchCommunityReports(tutorId, token, 'open').catch(() => []),
        fetchCommunityBlocks(tutorId, token).catch(() => []),
        fetchInstructorSubscribers(token).catch(() => []),
        fetchCommunitySettings(tutorId, token).catch(() => ({
          allowPeerMessaging: false,
          communityGuidelines: '',
        })),
      ]);
      setStats(s);
      setPosts(p);
      setQuestions(q.filter((item) => item.status === 'open'));
      setReports(r);
      setBlocks(b);
      setSubscribers(subs);
      setSettings(set);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [approved, token, tutorId]);

  useEffect(() => {
    if (!syncing) load();
  }, [load, syncing]);

  const openCount = useMemo(() => reports.length, [reports]);

  const onTogglePost = async (post, field) => {
    try {
      await updateCommunityPost(tutorId, post.id, token, { [field]: !post[field] });
      await load();
    } catch (err) {
      Alert.alert('Could not update post', err.message || 'Try again.');
    }
  };

  const onDeletePost = (post) => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommunityPost(tutorId, post.id, token);
            await load();
          } catch (err) {
            Alert.alert('Could not delete', err.message || 'Try again.');
          }
        },
      },
    ]);
  };

  const onPinQuestion = async (question) => {
    try {
      await updateCommunityQuestion(tutorId, question.id, token, { pinned: true });
      await load();
    } catch (err) {
      Alert.alert('Could not pin question', err.message || 'Try again.');
    }
  };

  const onReportAction = async (report, status) => {
    try {
      await updateCommunityReport(tutorId, report.id, token, status);
      await load();
    } catch (err) {
      Alert.alert('Could not update report', err.message || 'Try again.');
    }
  };

  const onBlockUser = async () => {
    if (!blockUserId.trim()) return;
    try {
      await createCommunityBlock(tutorId, token, {
        userId: blockUserId.trim(),
        reason: blockReason.trim(),
        muted: blockMode === 'mute',
        blocked: blockMode === 'block',
      });
      setBlockUserId('');
      setBlockReason('');
      await load();
    } catch (err) {
      Alert.alert('Could not block user', err.message || 'Try again.');
    }
  };

  const onSaveSettings = async () => {
    try {
      await updateCommunitySettings(tutorId, token, settings);
      Alert.alert('Saved', 'Community settings updated.');
    } catch (err) {
      Alert.alert('Could not save', err.message || 'Try again.');
    }
  };

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <CreatorAccessGate approved={approved} syncing={syncing}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
              />
            }>
            <View style={styles.header}>
              <Text style={styles.title}>Community moderation</Text>
              <PrimaryButton
                label="Open live community"
                variant="secondary"
                onPress={() => router.push(`/community/${tutorId}`)}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {TABS.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[styles.tab, tab === t.id && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
                  {t.id === 'reports' && openCount ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{openCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>

            {tab === 'overview' ? (
              <View style={styles.grid}>
                <Stat label="Members" value={stats?.memberCount ?? subscribers.length} />
                <Stat label="Posts" value={posts.length} />
                <Stat label="Open Q&A" value={questions.length} />
                <Stat label="Reports" value={openCount} />
              </View>
            ) : null}

            {tab === 'posts' ? (
              posts.length ? (
                posts.map((post) => (
                  <View key={post.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{post.author.name}</Text>
                    <Text style={styles.body}>{post.body}</Text>
                    <View style={styles.row}>
                      <Action label={post.pinned ? 'Unpin' : 'Pin'} onPress={() => onTogglePost(post, 'pinned')} />
                      <Action label={post.featured ? 'Unfeature' : 'Feature'} onPress={() => onTogglePost(post, 'featured')} />
                      <Action label="Delete" danger onPress={() => onDeletePost(post)} />
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState icon="comments-o" title="No posts" />
              )
            ) : null}

            {tab === 'qa' ? (
              questions.length ? (
                questions.map((q) => (
                  <View key={q.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{q.title}</Text>
                    <Text style={styles.body}>{q.body}</Text>
                    <View style={styles.row}>
                      <Action label="Pin" onPress={() => onPinQuestion(q)} />
                      <Action label="Open in community" onPress={() => router.push(`/community/${tutorId}`)} />
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState icon="question-circle" title="No open questions" />
              )
            ) : null}

            {tab === 'reports' ? (
              reports.length ? (
                reports.map((report) => (
                  <View key={report.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {report.entityType} · {report.reporter.name}
                    </Text>
                    <Text style={styles.body}>{report.reason}</Text>
                    <View style={styles.row}>
                      <Action label="Resolve" onPress={() => onReportAction(report, 'resolved')} />
                      <Action label="Dismiss" onPress={() => onReportAction(report, 'dismissed')} />
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState icon="flag-o" title="No open reports" />
              )
            ) : null}

            {tab === 'blocked' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.label}>User ID</Text>
                  <TextInput value={blockUserId} onChangeText={setBlockUserId} style={styles.input} placeholder="Member user id" placeholderTextColor={colors.muted} />
                  <Text style={styles.label}>Reason</Text>
                  <TextInput value={blockReason} onChangeText={setBlockReason} style={styles.input} placeholder="Optional" placeholderTextColor={colors.muted} />
                  <View style={styles.row}>
                    <Action label="Block" active={blockMode === 'block'} onPress={() => setBlockMode('block')} />
                    <Action label="Mute" active={blockMode === 'mute'} onPress={() => setBlockMode('mute')} />
                  </View>
                  <PrimaryButton label="Apply" onPress={onBlockUser} />
                </View>
                {blocks.map((block) => (
                  <View key={block.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{block.user.name}</Text>
                    <Text style={styles.body}>
                      {block.blocked ? 'Blocked' : 'Muted'} · {block.reason || 'No reason'}
                    </Text>
                    <Action
                      label="Remove"
                      onPress={async () => {
                        await removeCommunityBlock(tutorId, block.user.id, token);
                        await load();
                      }}
                    />
                  </View>
                ))}
              </>
            ) : null}

            {tab === 'settings' ? (
              <View style={styles.card}>
                <View style={styles.switchRow}>
                  <Text style={styles.cardTitle}>Allow peer messaging</Text>
                  <Switch
                    value={Boolean(settings.allowPeerMessaging)}
                    onValueChange={(value) => setSettings((s) => ({ ...s, allowPeerMessaging: value }))}
                  />
                </View>
                <Text style={styles.label}>Community guidelines</Text>
                <TextInput
                  value={settings.communityGuidelines || ''}
                  onChangeText={(value) => setSettings((s) => ({ ...s, communityGuidelines: value }))}
                  style={[styles.input, { minHeight: 100 }]}
                  multiline
                  placeholder="Guidelines shown to members"
                  placeholderTextColor={colors.muted}
                />
                <PrimaryButton label="Save settings" onPress={onSaveSettings} />
                <Text style={[styles.label, { marginTop: spacing.lg }]}>Subscribers ({subscribers.length})</Text>
                {subscribers.slice(0, 8).map((sub) => (
                  <Text key={sub.id} style={styles.body}>
                    {sub.student?.name || 'Student'} · {sub.planId}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </CreatorAccessGate>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Action({ label, onPress, danger, active }) {
  return (
    <Pressable onPress={onPress} style={[styles.action, active && styles.actionActive, danger && styles.actionDanger]}>
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  tabs: { gap: spacing.sm, marginBottom: spacing.lg },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.white },
  badge: { backgroundColor: colors.danger, borderRadius: 99, minWidth: 18, paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardTitle: { fontWeight: '800', color: colors.text },
  body: { color: colors.text, lineHeight: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionDanger: { borderColor: colors.danger },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.text },
  actionTextActive: { color: colors.white },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
