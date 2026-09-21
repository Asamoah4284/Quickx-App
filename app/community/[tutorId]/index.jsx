import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  askCommunityQuestion,
  createCommunityPost,
  createPostComment,
  fetchCommunityConversations,
  fetchCommunityLeaderboard,
  fetchCommunityLiveSessions,
  fetchCommunityPosts,
  fetchCommunityQuestions,
  fetchCommunityResources,
  fetchCommunityStats,
  fetchCommunityRooms,
  fetchCommunityBadges,
  submitCommunityReport,
  fetchConversationMessages,
  fetchPostComments,
  fetchTutorSubscriptionMe,
  likeCommunityPost,
  searchCommunity,
  sendConversationMessage,
  startTutorConversation,
  unlikeCommunityPost,
  voteCommunityPoll,
} from '@/utils/community';
import { isOpenableUrl, openExternalUrl } from '@/utils/openUrl';

const TABS = [
  { id: 'feed', label: 'Feed', icon: 'comments' },
  { id: 'ask', label: 'Q&A', icon: 'question-circle' },
  { id: 'live', label: 'Live', icon: 'video-camera' },
  { id: 'resources', label: 'Files', icon: 'folder-open' },
  { id: 'rooms', label: 'Rooms', icon: 'th-large' },
  { id: 'badges', label: 'Badges', icon: 'certificate' },
  { id: 'leaderboard', label: 'Ranks', icon: 'trophy' },
  { id: 'messages', label: 'DMs', icon: 'envelope' },
  { id: 'search', label: 'Search', icon: 'search' },
];

function PostMedia({ media, onOpenImage }) {
  if (!media?.length) return null;
  return (
    <View style={styles.mediaWrap}>
      {media.map((item, idx) => {
        const key = `${item.url}-${idx}`;
        if (item.type === 'image') {
          return (
            <Pressable key={key} onPress={() => onOpenImage?.(item.url)}>
              <Image source={{ uri: item.url }} style={styles.mediaImage} resizeMode="cover" />
            </Pressable>
          );
        }
        if (item.type === 'video') {
          return (
            <Pressable key={key} style={styles.mediaLink} onPress={() => openExternalUrl(item.url)}>
              <FontAwesome name="play-circle" size={18} color={colors.primary} />
              <Text style={styles.mediaLinkText}>{item.name || 'Watch video'}</Text>
            </Pressable>
          );
        }
        return (
          <Pressable key={key} style={styles.mediaLink} onPress={() => openExternalUrl(item.url)}>
            <FontAwesome name={item.type === 'link' ? 'link' : 'paperclip'} size={14} color={colors.primary} />
            <Text style={styles.mediaLinkText} numberOfLines={1}>
              {item.name || item.url}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CommunityPostCard({
  post,
  expanded,
  comments,
  loadingComments,
  draft,
  onChangeDraft,
  onToggleComments,
  onSubmitComment,
  onLike,
  onVotePoll,
  onReport,
  commenting,
  onOpenImage,
}) {
  return (
    <View style={styles.card}>
      {post.pinned ? <Text style={styles.pinned}>Pinned</Text> : null}
      {post.type === 'announcement' ? <Text style={styles.announce}>Announcement</Text> : null}
      <Text style={styles.author}>{post.author.name}</Text>
      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.poll ? (
        <View style={styles.pollBox}>
          <Text style={styles.pollQuestion}>{post.poll.question}</Text>
          {post.poll.options.map((opt) => (
            <Pressable
              key={opt.index}
              style={styles.pollOption}
              onPress={() => onVotePoll?.(post, opt.index)}
              disabled={post.poll.closed}>
              <Text style={styles.pollOptionText}>{opt.text}</Text>
              <Text style={styles.pollVotes}>{opt.voteCount}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <PostMedia media={post.media} onOpenImage={onOpenImage} />

      <View style={styles.row}>
        <Pressable style={styles.chip} onPress={() => onLike(post)}>
          <FontAwesome
            name={post.likedByMe ? 'heart' : 'heart-o'}
            size={12}
            color={post.likedByMe ? colors.danger : colors.muted}
          />
          <Text style={styles.chipText}>{post.likeCount}</Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={() => onToggleComments(post.id)}>
          <FontAwesome name="comment-o" size={12} color={expanded ? colors.primary : colors.muted} />
          <Text style={[styles.chipText, expanded && { color: colors.primary }]}>
            {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={() => onReport?.(post)}>
          <FontAwesome name="flag-o" size={12} color={colors.muted} />
          <Text style={styles.chipText}>Report</Text>
        </Pressable>
        <Text style={styles.time}>
          {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
        </Text>
      </View>

      {expanded ? (
        <View style={styles.commentsBox}>
          {loadingComments ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
          ) : comments?.length ? (
            comments.map((c) => (
              <View key={c.id} style={[styles.commentRow, c.parentId && styles.commentReply]}>
                <Text style={styles.commentAuthor}>{c.author.name}</Text>
                <Text style={styles.commentBody}>{c.body}</Text>
                <Text style={styles.commentTime}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noComments}>No comments yet — start the thread.</Text>
          )}

          <View style={styles.commentComposer}>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              placeholder="Write a comment…"
              placeholderTextColor={colors.muted}
              style={styles.commentInput}
              multiline
            />
            <PrimaryButton
              label="Comment"
              onPress={() => onSubmitComment(post.id)}
              loading={commenting}
              disabled={!String(draft || '').trim()}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function CommunityHubScreen() {
  const { tutorId } = useLocalSearchParams();
  const id = String(tutorId);
  const router = useRouter();
  const { token } = useAppState();
  const [tab, setTab] = useState('feed');
  const [access, setAccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composer, setComposer] = useState('');
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [commentingId, setCommentingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reportPost, setReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const title = useMemo(
    () => (stats?.tutor?.fullName ? `${stats.tutor.fullName}'s community` : 'Community'),
    [stats]
  );

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setAccess({ subscribed: false, canAccessCommunity: false });
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const me = await fetchTutorSubscriptionMe(id, token);
      setAccess(me);
      try {
        setStats(await fetchCommunityStats(id));
      } catch {
        setStats(null);
      }
      if (me?.canAccessCommunity) {
        const [p, q, s, r, lb, conv, roomList, badgeList] = await Promise.all([
          fetchCommunityPosts(id, token).catch(() => []),
          fetchCommunityQuestions(id, token).catch(() => []),
          fetchCommunityLiveSessions(id, token).catch(() => []),
          fetchCommunityResources(id, token).catch(() => []),
          fetchCommunityLeaderboard(id, token).catch(() => []),
          fetchCommunityConversations(id, token).catch(() => []),
          fetchCommunityRooms(id, token).catch(() => []),
          fetchCommunityBadges(id, token).catch(() => []),
        ]);
        setPosts(p);
        setQuestions(q);
        setSessions(s.filter((x) => !x.cancelled));
        setResources(r);
        setLeaderboard(lb);
        setConversations(conv);
        setRooms(roomList);
        setBadges(badgeList);
      }
    } catch (err) {
      setAccess({ subscribed: false, canAccessCommunity: false, error: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const onPost = async () => {
    if (!composer.trim()) return;
    setPosting(true);
    try {
      await createCommunityPost(id, token, composer);
      setComposer('');
      await load();
    } catch (err) {
      Alert.alert('Could not post', err.message || 'Try again.');
    } finally {
      setPosting(false);
    }
  };

  const onAsk = async () => {
    if (!qTitle.trim() || !qBody.trim()) {
      Alert.alert('Missing fields', 'Add a title and question body.');
      return;
    }
    setPosting(true);
    try {
      await askCommunityQuestion(id, token, { title: qTitle, body: qBody });
      setQTitle('');
      setQBody('');
      setTab('ask');
      await load();
      Alert.alert('Sent', 'Your question was posted to the community.');
    } catch (err) {
      Alert.alert('Could not ask', err.message || 'Try again.');
    } finally {
      setPosting(false);
    }
  };

  const onLike = async (post) => {
    try {
      if (post.likedByMe) {
        await unlikeCommunityPost(id, post.id, token);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likedByMe: false, likeCount: Math.max(0, p.likeCount - 1) }
              : p
          )
        );
      } else {
        await likeCommunityPost(id, post.id, token);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, likedByMe: true, likeCount: p.likeCount + 1 } : p
          )
        );
      }
    } catch {
      /* ignore */
    }
  };

  const loadComments = async (postId) => {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const list = await fetchPostComments(id, postId, token);
      setExpandedComments((prev) => ({ ...prev, [postId]: list }));
    } catch (err) {
      Alert.alert('Could not load comments', err.message || 'Try again.');
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const onToggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }
    setExpandedComments((prev) => ({ ...prev, [postId]: [] }));
    await loadComments(postId);
  };

  const onSubmitComment = async (postId) => {
    const body = String(commentDrafts[postId] || '').trim();
    if (!body) return;
    setCommentingId(postId);
    try {
      const created = await createPostComment(id, postId, token, body);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setExpandedComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err) {
      Alert.alert('Could not comment', err.message || 'Try again.');
    } finally {
      setCommentingId(null);
    }
  };

  const onVotePoll = async (post, optionIndex) => {
    if (!post.poll) return;
    try {
      const updated = await voteCommunityPoll(id, post.poll.id, token, optionIndex);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, poll: updated } : p))
      );
    } catch (err) {
      Alert.alert('Could not vote', err.message || 'Try again.');
    }
  };

  const onReport = (post) => {
    setReportPost(post);
    setReportReason('');
  };

  const submitReport = async () => {
    if (!reportPost || !reportReason.trim()) return;
    setReporting(true);
    try {
      await submitCommunityReport(id, token, {
        entityType: 'post',
        entityId: reportPost.id,
        reason: reportReason.trim(),
      });
      setReportPost(null);
      setReportReason('');
      Alert.alert('Reported', 'Thanks — moderators will review this.');
    } catch (err) {
      Alert.alert('Could not report', err.message || 'Try again.');
    } finally {
      setReporting(false);
    }
  };

  const openConversation = async (conversationId) => {
    setActiveConversation(conversationId);
    try {
      setMessages(await fetchConversationMessages(id, conversationId, token));
    } catch {
      setMessages([]);
    }
  };

  const onSendMessage = async () => {
    if (!activeConversation || !messageDraft.trim()) return;
    try {
      await sendConversationMessage(id, activeConversation, token, messageDraft);
      setMessageDraft('');
      setMessages(await fetchConversationMessages(id, activeConversation, token));
    } catch (err) {
      Alert.alert('Could not send', err.message || 'Try again.');
    }
  };

  const onStartTutorChat = async () => {
    try {
      const conversationId = await startTutorConversation(id, token);
      await openConversation(conversationId);
      setTab('messages');
      const conv = await fetchCommunityConversations(id, token);
      setConversations(conv);
    } catch (err) {
      Alert.alert('Could not start chat', err.message || 'Try again.');
    }
  };

  const onSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearchResults(await searchCommunity(id, token, searchQuery));
    } catch {
      setSearchResults({ posts: [], questions: [] });
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ title: 'Community' }} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }

  if (!access?.canAccessCommunity) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ title: 'Community' }} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <EmptyState
            icon="lock"
            title="Community locked"
            subtitle={
              access?.subscribed
                ? 'Your current plan is video-only. Upgrade to Premium or Diamond to join.'
                : 'Subscribe to this tutor on Premium or Diamond to unlock the community.'
            }
          />
          <PrimaryButton
            label={access?.subscribed ? 'Upgrade plan' : 'View plans'}
            onPress={() => router.push(`/subscribe/${id}`)}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroMeta}>
            {stats?.memberCount != null ? `${stats.memberCount} members` : 'Members community'}
            {access?.subscription?.planId ? ` · ${access.subscription.planId}` : ''}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, active && styles.tabActive]}>
                <FontAwesome name={t.icon} size={12} color={active ? colors.white : colors.muted} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === 'feed' ? (
          <>
            <View style={styles.composer}>
              <TextInput
                value={composer}
                onChangeText={setComposer}
                placeholder="Share with the community…"
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
              />
              <PrimaryButton label="Post" onPress={onPost} loading={posting} disabled={!composer.trim()} />
            </View>
            {posts.length ? (
              posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  expanded={Object.prototype.hasOwnProperty.call(expandedComments, post.id)}
                  comments={expandedComments[post.id]}
                  loadingComments={Boolean(loadingComments[post.id])}
                  draft={commentDrafts[post.id] || ''}
                  onChangeDraft={(text) =>
                    setCommentDrafts((prev) => ({ ...prev, [post.id]: text }))
                  }
                  onToggleComments={onToggleComments}
                  onSubmitComment={onSubmitComment}
                  onLike={onLike}
                  onVotePoll={onVotePoll}
                  onReport={onReport}
                  commenting={commentingId === post.id}
                  onOpenImage={setPreviewUrl}
                />
              ))
            ) : (
              <EmptyState icon="comments-o" title="No posts yet" subtitle="Be the first to say hello." />
            )}
          </>
        ) : null}

        {tab === 'ask' ? (
          <>
            <View style={styles.composer}>
              <TextInput
                value={qTitle}
                onChangeText={setQTitle}
                placeholder="Question title"
                placeholderTextColor={colors.muted}
                style={[styles.input, { minHeight: 44 }]}
              />
              <TextInput
                value={qBody}
                onChangeText={setQBody}
                placeholder="Describe what you need help with…"
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
              />
              <PrimaryButton label="Ask question" onPress={onAsk} loading={posting} />
            </View>
            {questions.length ? (
              questions.map((q) => (
                <View key={q.id} style={styles.card}>
                  <Text style={styles.author}>{q.title}</Text>
                  <Text style={styles.body} numberOfLines={4}>
                    {q.body}
                  </Text>
                  <Text style={styles.meta}>
                    {q.author.name} · {q.answerCount} answers · {q.status}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyState icon="question-circle" title="No questions yet" subtitle="Ask the tutor or peers." />
            )}
          </>
        ) : null}

        {tab === 'live' ? (
          sessions.length ? (
            sessions.map((s) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.author}>{s.title}</Text>
                {s.description ? <Text style={styles.body}>{s.description}</Text> : null}
                <Text style={styles.meta}>
                  {s.startsAt ? new Date(s.startsAt).toLocaleString() : 'Schedule TBA'}
                  {s.location && !isOpenableUrl(s.joinUrl) ? ` · ${s.location}` : ''}
                </Text>
                {isOpenableUrl(s.joinUrl) ? (
                  <PrimaryButton
                    label="Join session"
                    variant="secondary"
                    onPress={() => openExternalUrl(s.joinUrl)}
                    style={{ marginTop: spacing.md }}
                  />
                ) : s.location || s.joinUrl ? (
                  <Text style={[styles.meta, { marginTop: spacing.sm }]}>
                    {s.location || s.joinUrl}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <EmptyState icon="video-camera" title="No live sessions" subtitle="Upcoming lives will show here." />
          )
        ) : null}

        {tab === 'resources' ? (
          resources.length ? (
            resources.map((r) => (
              <Pressable
                key={r.id}
                style={styles.card}
                onPress={() => (isOpenableUrl(r.url) ? openExternalUrl(r.url) : null)}>
                <View style={styles.row}>
                  <FontAwesome name="file-o" size={16} color={colors.primary} />
                  <Text style={[styles.author, { flex: 1 }]}>{r.title}</Text>
                  {isOpenableUrl(r.url) ? (
                    <FontAwesome name="external-link" size={12} color={colors.muted} />
                  ) : null}
                </View>
                {r.description ? <Text style={styles.body}>{r.description}</Text> : null}
              </Pressable>
            ))
          ) : (
            <EmptyState icon="folder-open" title="No resources" subtitle="Shared files and links appear here." />
          )
        ) : null}

        {tab === 'rooms' ? (
          rooms.length ? (
            rooms.map((room) => (
              <View key={room.id} style={styles.card}>
                <Text style={styles.author}>{room.name}</Text>
                <Text style={styles.meta}>{room.archived ? 'Archived' : 'Active room'}</Text>
              </View>
            ))
          ) : (
            <EmptyState icon="th-large" title="No rooms yet" subtitle="Discussion rooms created by the tutor appear here." />
          )
        ) : null}

        {tab === 'badges' ? (
          badges.length ? (
            badges.map((badge) => (
              <View key={badge.key} style={styles.card}>
                <Text style={styles.author}>{badge.label}</Text>
                <Text style={styles.meta}>
                  {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Earned'}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState icon="certificate" title="No badges yet" subtitle="Participate in the community to earn badges." />
          )
        ) : null}

        {tab === 'leaderboard' ? (
          leaderboard.length ? (
            leaderboard.map((row) => (
              <View key={row.userId} style={styles.card}>
                <Text style={styles.author}>
                  #{row.rank} {row.name}
                </Text>
                <Text style={styles.meta}>{row.xp} XP</Text>
              </View>
            ))
          ) : (
            <EmptyState icon="trophy" title="No leaderboard yet" subtitle="Earn XP by participating in the community." />
          )
        ) : null}

        {tab === 'messages' ? (
          <>
            <PrimaryButton label="Message tutor" variant="secondary" onPress={onStartTutorChat} />
            {conversations.length ? (
              conversations.map((c) => (
                <Pressable key={c.id} style={styles.card} onPress={() => openConversation(c.id)}>
                  <Text style={styles.author}>
                    {c.title ||
                      c.participants.map((p) => p.name).filter(Boolean).slice(0, 3).join(', ') ||
                      'Conversation'}
                  </Text>
                  <Text style={styles.meta}>
                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : 'Tap to open'}
                  </Text>
                </Pressable>
              ))
            ) : (
              <EmptyState icon="envelope" title="No messages yet" subtitle="Start a conversation with the tutor." />
            )}
            {activeConversation ? (
              <View style={styles.commentsBox}>
                {messages.map((m) => (
                  <View key={m.id} style={styles.commentRow}>
                    <Text style={styles.commentAuthor}>{m.author.name}</Text>
                    <Text style={styles.commentBody}>{m.body}</Text>
                  </View>
                ))}
                <View style={styles.commentComposer}>
                  <TextInput
                    value={messageDraft}
                    onChangeText={setMessageDraft}
                    placeholder="Write a message…"
                    placeholderTextColor={colors.muted}
                    style={styles.commentInput}
                    multiline
                  />
                  <PrimaryButton label="Send" onPress={onSendMessage} disabled={!messageDraft.trim()} />
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {tab === 'search' ? (
          <>
            <View style={styles.composer}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search posts and questions…"
                placeholderTextColor={colors.muted}
                style={[styles.input, { minHeight: 44 }]}
              />
              <PrimaryButton label="Search" onPress={onSearch} />
            </View>
            {searchResults ? (
              <>
                {(searchResults.posts || []).map((p) => (
                  <View key={p.id} style={styles.card}>
                    <Text style={styles.body}>{p.body}</Text>
                  </View>
                ))}
                {(searchResults.questions || []).map((q) => (
                  <View key={q.id} style={styles.card}>
                    <Text style={styles.author}>{q.title}</Text>
                  </View>
                ))}
                {!searchResults.posts?.length && !searchResults.questions?.length ? (
                  <EmptyState icon="search" title="No results" subtitle="Try another search term." />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(previewUrl)} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUrl(null)}>
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>

      <Modal visible={Boolean(reportPost)} transparent animationType="fade" onRequestClose={() => setReportPost(null)}>
        <View style={styles.reportOverlay}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Report post</Text>
            <Text style={styles.meta}>Tell us why you are reporting this post.</Text>
            <TextInput
              style={styles.reportInput}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Reason for report"
              placeholderTextColor={colors.muted}
              multiline
            />
            <PrimaryButton
              label={reporting ? 'Submitting…' : 'Submit report'}
              onPress={submitReport}
              disabled={reporting || !reportReason.trim()}
            />
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              onPress={() => setReportPost(null)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  heroMeta: { color: 'rgba(255,255,255,0.65)', marginTop: 6, fontSize: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg, paddingRight: spacing.lg },
  tab: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.white },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: {
    minHeight: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    color: colors.text,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pinned: { color: colors.primary, fontWeight: '800', fontSize: 11, marginBottom: 4 },
  announce: {
    alignSelf: 'flex-start',
    color: '#9A6B00',
    backgroundColor: '#E8B02022',
    fontWeight: '800',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 6,
  },
  author: { fontWeight: '800', color: colors.text, fontSize: 14 },
  body: { color: colors.text, marginTop: 6, lineHeight: 20 },
  pollBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pollQuestion: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  pollOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pollOptionText: { flex: 1, color: colors.text, fontWeight: '600' },
  pollVotes: { color: colors.primary, fontWeight: '800', marginLeft: spacing.sm },
  meta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  mediaWrap: { marginTop: spacing.md, gap: spacing.sm },
  mediaImage: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  mediaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  mediaLinkText: { flex: 1, color: colors.primary, fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  time: { marginLeft: 'auto', color: colors.muted, fontSize: 11 },
  commentsBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  commentRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  commentReply: { marginLeft: spacing.lg },
  commentAuthor: { fontWeight: '800', color: colors.text, fontSize: 12 },
  commentBody: { color: colors.text, marginTop: 4, lineHeight: 18, fontSize: 13 },
  commentTime: { color: colors.muted, fontSize: 10, marginTop: 4 },
  noComments: { color: colors.muted, fontSize: 12, marginBottom: spacing.xs },
  commentComposer: { gap: spacing.sm, marginTop: spacing.xs },
  commentInput: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    textAlignVertical: 'top',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  previewImage: { width: '100%', height: '80%' },
  reportOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  reportTitle: { fontWeight: '800', fontSize: 18, color: colors.text },
  reportInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    textAlignVertical: 'top',
    marginVertical: spacing.sm,
  },
});
