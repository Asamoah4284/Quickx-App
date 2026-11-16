import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert as NativeAlert, Linking, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Author, BASE, RichText, useCommunity } from '@/components/community/shared';
import { showActions } from '@/components/ui/ActionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Alert, Badge, Button, Card, Icon, Input, Loading, Row, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { api, assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { timeAgo } from '@/utils/format';
import { haptics } from '@/utils/haptics';

const REPORT_REASONS = ['Spam or advertising', 'Rude or abusive', 'Scam or fake offer', 'Something else'];

const chooseAction = showActions;

function Poll({ poll, onChange }) {
  const { token } = useAppState();
  const [busy, setBusy] = useState(false);
  const total = poll.options.reduce((n, o) => n + (o.voteCount || 0), 0);
  const showResults = poll.myVote != null || poll.closed;

  const vote = async (optionIndex) => {
    setBusy(true);
    try {
      const data = await api(`${BASE}/polls/${poll._id}/vote`, { method: 'POST', token, body: { optionIndex } });
      haptics.success();
      onChange(data.poll);
    } catch (err) {
      NativeAlert.alert('Could not vote', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ marginTop: 14, gap: 8 }}>
      {poll.options.map((option, i) => {
        const pct = total ? Math.round(((option.voteCount || 0) / total) * 100) : 0;
        const mine = poll.myVote === i;
        return (
          <PressableScale
            key={option._id || i}
            disabled={showResults || busy}
            haptic="select"
            onPress={() => vote(i)}
            style={[styles.option, mine && { borderColor: 'rgba(91,143,255,0.6)' }]}>
            {showResults ? <View style={[styles.optionFill, { width: `${pct}%`, backgroundColor: mine ? 'rgba(47,107,255,0.25)' : 'rgba(255,255,255,0.06)' }]} /> : null}
            <Row justify="space-between">
              <Txt size={14} style={{ flex: 1 }}>
                {option.text}
              </Txt>
              {showResults ? (
                <Txt size={13} color={t.fgMuted} tabular>
                  {pct}%
                </Txt>
              ) : null}
            </Row>
          </PressableScale>
        );
      })}
      <Txt size={12} color={t.fgSubtle}>
        {total} {total === 1 ? 'vote' : 'votes'}
        {poll.closed ? ' · Poll closed' : ''}
      </Txt>
    </View>
  );
}

function Media({ media }) {
  const images = media.filter((m) => m.type === 'image');
  const others = media.filter((m) => m.type !== 'image');
  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      {images.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {images.map((m) => (
            <PressableScale key={m.url} haptic={null} onPress={() => Linking.openURL(assetUrl(m.url)).catch(() => {})} style={{ flexBasis: images.length > 1 ? '48%' : '100%', flexGrow: 1 }}>
              <Image source={{ uri: assetUrl(m.url) }} style={{ width: '100%', aspectRatio: images.length > 1 ? 1 : 4 / 3, borderRadius: 14, backgroundColor: t.ink700 }} contentFit="cover" transition={200} />
            </PressableScale>
          ))}
        </View>
      ) : null}
      {others.map((m) => (
        <PressableScale key={m.url} onPress={() => Linking.openURL(assetUrl(m.url)).catch(() => {})} style={styles.file}>
          <Icon name={m.type === 'video' ? 'film' : 'file'} size={16} color={t.brand300} />
          <Txt size={13.5} color={t.brand300} numberOfLines={1} style={{ flex: 1 }}>
            {m.name || 'Open file'}
          </Txt>
        </PressableScale>
      ))}
    </View>
  );
}

/** Comments open in a sheet so the feed stays tidy. */
function CommentsSheet({ post, visible, onClose, onCountChange }) {
  const { token } = useAppState();
  const { me } = useCommunity();
  const [comments, setComments] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setComments(null);
    api(`${BASE}/posts/${post._id}/comments`, { token })
      .then((data) => !cancelled && setComments(data.comments))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [visible, post._id, token]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError('');
    try {
      const data = await api(`${BASE}/posts/${post._id}/comments`, { method: 'POST', token, body: { body, parentId: replyTo?._id || undefined } });
      setComments((list) => [...(list || []), data.comment]);
      onCountChange(1);
      setText('');
      setReplyTo(null);
      haptics.success();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = (comment) =>
    NativeAlert.alert('Delete this comment?', undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const data = await api(`${BASE}/comments/${comment._id}`, { method: 'DELETE', token });
            setComments((list) => list.filter((c) => c._id !== comment._id && c.parentId !== comment._id));
            onCountChange(-(data.removed || 1));
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);

  const top = (comments || []).filter((c) => !c.parentId);
  const repliesOf = (id) => (comments || []).filter((c) => c.parentId === id);

  const renderComment = (c, nested) => {
    const mine = String(c.authorId?._id) === me.id;
    return (
      <View key={c._id} style={{ marginLeft: nested ? 40 : 0, gap: 4 }}>
        <PressableScale
          haptic={null}
          scaleTo={1}
          onLongPress={() => (mine || me.isModerator ? remove(c) : null)}
          delayLongPress={350}>
          <Author user={c.authorId} when={timeAgo(c.createdAt)} size={30} />
        </PressableScale>
        <View style={{ marginLeft: 40 }}>
          <RichText text={c.body} size={14} />
          {!me.muted ? (
            <PressableScale
              haptic="select"
              onPress={() => {
                setReplyTo(c);
                setText(`@${String(c.authorId?.fullName || '').split(/\s+/)[0]} `);
              }}>
              <Txt size={12} weight="semibold" color={t.fgSubtle} style={{ marginTop: 4 }}>
                Reply
              </Txt>
            </PressableScale>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Comments" subtitle={me.isModerator ? 'Press and hold a comment to delete it.' : undefined}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        {error ? <Alert>{error}</Alert> : null}
        {comments === null && !error ? <Loading /> : null}
        {comments && !comments.length ? (
          <Txt size={14} color={t.fgSubtle}>
            No comments yet. Start the conversation.
          </Txt>
        ) : null}
        {top.map((c) => (
          <View key={c._id} style={{ gap: 12 }}>
            {renderComment(c, false)}
            {repliesOf(c._id).map((r) => renderComment(r, true))}
          </View>
        ))}
        {me.muted ? (
          <Txt size={13} color={t.fgSubtle}>
            You are muted and cannot comment right now.
          </Txt>
        ) : (
          <View style={{ gap: 6 }}>
            {replyTo ? (
              <Row gap={6}>
                <Icon name="corner-down-right" size={13} color={t.fgSubtle} />
                <Txt size={12} color={t.fgSubtle}>
                  Replying to {replyTo.authorId?.fullName}
                </Txt>
                <PressableScale onPress={() => setReplyTo(null)}>
                  <Txt size={12} weight="semibold" color={t.fgMuted}>
                    Cancel
                  </Txt>
                </PressableScale>
              </Row>
            ) : null}
            <Row gap={8} align="flex-end">
              <Input style={{ flex: 1 }} value={text} onChangeText={setText} placeholder="Write a comment" maxLength={2000} multiline={false} returnKeyType="send" onSubmitEditing={send} />
              <Button icon="send" loading={sending} disabled={!text.trim()} onPress={send} style={{ width: 50, paddingHorizontal: 0 }} />
            </Row>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

function Heart({ liked }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (liked) scale.value = withSequence(withTiming(1.35, { duration: 110 }), withSpring(1, { damping: 8 }));
  }, [liked, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Icon name="heart" size={17} color={liked ? t.down : t.fgMuted} />
    </Animated.View>
  );
}

export default function PostCard({ post, onChange, onRemove }) {
  const { token } = useAppState();
  const { me } = useCommunity();
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const mine = String(post.authorId?._id) === me.id;

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    haptics.tap();
    const before = { likedByMe: post.likedByMe, likeCount: post.likeCount };
    onChange({ ...post, likedByMe: !post.likedByMe, likeCount: Math.max(0, (post.likeCount || 0) + (post.likedByMe ? -1 : 1)) });
    try {
      const data = await api(`${BASE}/posts/${post._id}/like`, { method: post.likedByMe ? 'DELETE' : 'POST', token });
      onChange({ ...post, likedByMe: data.liked, likeCount: data.likeCount });
    } catch {
      onChange({ ...post, ...before });
    } finally {
      setLiking(false);
    }
  };

  const act = async (fn, okMessage) => {
    try {
      await fn();
      if (okMessage) NativeAlert.alert(okMessage);
    } catch (err) {
      NativeAlert.alert('Something went wrong', err.message);
    }
  };

  const menu = () =>
    chooseAction('Post', [
      me.isModerator
        ? { label: post.pinned ? 'Unpin' : 'Pin to top', onPress: () => act(async () => { await api(`${BASE}/posts/${post._id}`, { method: 'PATCH', token, body: { pinned: !post.pinned } }); onChange({ ...post, pinned: !post.pinned }); }) }
        : null,
      !mine
        ? {
            label: 'Report',
            icon: 'flag',
            onPress: () =>
              chooseAction(
                'What is wrong with this post?',
                REPORT_REASONS.map((reason) => ({
                  label: reason,
                  onPress: () =>
                    act(
                      () => api(`${BASE}/reports`, { method: 'POST', token, body: { entityType: 'post', entityId: post._id, reason } }),
                      'Thanks. The mentor will take a look.'
                    ),
                }))
              ),
          }
        : null,
      mine || me.isModerator
        ? {
            label: 'Delete',
            icon: 'trash-2',
            danger: true,
            onPress: () =>
              NativeAlert.alert('Delete this post?', undefined, [
                { text: 'Keep', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => act(async () => { await api(`${BASE}/posts/${post._id}`, { method: 'DELETE', token }); onRemove(post._id); }) },
              ]),
          }
        : null,
    ]);

  return (
    <Card tone={post.type === 'announcement' ? 'brand' : undefined}>
      <Row align="flex-start" gap={8}>
        <Author
          user={post.authorId}
          when={timeAgo(post.createdAt)}
          extra={
            <>
              {post.type === 'announcement' ? <Badge label="Announcement" tone="warn" /> : null}
              {post.pinned ? <Badge label="Pinned" icon="bookmark" /> : null}
            </>
          }
        />
        <PressableScale haptic="select" hitSlop={10} onPress={menu} accessibilityLabel="More actions" style={{ padding: 4 }}>
          <Icon name="more-horizontal" size={18} color={t.fgSubtle} />
        </PressableScale>
      </Row>

      {post.body ? (
        <View style={{ marginTop: 12 }}>
          <RichText text={post.body} />
        </View>
      ) : null}
      {post.media?.length ? <Media media={post.media} /> : null}
      {post.poll ? <Poll poll={post.poll} onChange={(poll) => onChange({ ...post, poll })} /> : null}

      <Row gap={4} style={styles.actions}>
        <PressableScale haptic={null} onPress={toggleLike} style={styles.action} accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}>
          <Heart liked={post.likedByMe} />
          <Txt size={13} weight="semibold" color={post.likedByMe ? t.down : t.fgMuted} tabular>
            {post.likeCount || 0}
          </Txt>
        </PressableScale>
        <PressableScale haptic="select" onPress={() => setShowComments(true)} style={styles.action} accessibilityLabel="Comments">
          <Icon name="message-circle" size={17} color={t.fgMuted} />
          <Txt size={13} weight="semibold" color={t.fgMuted} tabular>
            {post.commentCount || 0}
          </Txt>
        </PressableScale>
      </Row>

      <CommentsSheet
        post={post}
        visible={showComments}
        onClose={() => setShowComments(false)}
        onCountChange={(delta) => onChange({ ...post, commentCount: Math.max(0, (post.commentCount || 0) + delta) })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  option: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, overflow: 'hidden' },
  optionFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: t.bgRaised, borderWidth: 1, borderColor: t.line },
  actions: { marginTop: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
  action: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
});
