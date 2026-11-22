import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BASE, useCommunity } from '@/components/community/shared';
import { FeatureOffer } from '@/components/FeatureGate';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Avatar, Button, Card, Divider, Icon, Loading, Row, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { api, assetUrl } from '@/constants/api';
import { fonts, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { firstName, timeAgo } from '@/utils/format';
import { haptics } from '@/utils/haptics';

const POLL_MS = 15000;

function otherPerson(conversation, myId) {
  return conversation.participantIds.find((p) => String(p._id) !== myId) || conversation.participantIds[0];
}

/** Calls fn every POLL_MS while the app is in the foreground. */
function usePolling(fn) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    const id = setInterval(() => {
      if (RNAppState.currentState === 'active') saved.current();
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);
}

function Thread({ conversation, onClose, onActivity }) {
  const { token } = useAppState();
  const { me } = useCommunity();
  const [messages, setMessages] = useState(null);
  const [cursor, setCursor] = useState(undefined);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const stick = useRef(true);
  const other = otherPerson(conversation, me.id);
  const url = `${BASE}/conversations/${conversation._id}/messages`;

  const refresh = useCallback(async () => {
    const data = await api(url, { token });
    setMessages((prev) => {
      if (!prev) return data.messages;
      const known = new Set(prev.map((m) => m._id));
      const fresh = data.messages.filter((m) => !known.has(m._id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    setCursor((prev) => (prev === undefined ? data.nextCursor : prev));
  }, [url, token]);

  useEffect(() => {
    refresh()
      .then(onActivity)
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);
  usePolling(() => refresh().catch(() => {}));

  const loadOlder = async () => {
    try {
      const data = await api(`${url}?before=${encodeURIComponent(cursor)}`, { token });
      stick.current = false;
      setMessages((prev) => [...data.messages, ...prev]);
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const data = await api(url, { method: 'POST', token, body: { body } });
      haptics.tap();
      stick.current = true;
      setMessages((prev) => [...(prev || []), data.message]);
      setText('');
      onActivity();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Row gap={12} style={styles.header}>
            <PressableScale haptic="select" onPress={onClose} hitSlop={10} accessibilityLabel="Back to messages">
              <Icon name="chevron-left" size={24} color={t.fg} />
            </PressableScale>
            <Avatar uri={assetUrl(other?.profilePicture)} name={other?.fullName} size={36} />
            <Txt size={16} weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
              {other?.fullName || 'Member'}
            </Txt>
          </Row>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
            onContentSizeChange={() => stick.current && scrollRef.current?.scrollToEnd({ animated: false })}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              stick.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
            }}
            scrollEventThrottle={100}
            keyboardShouldPersistTaps="handled">
            {messages === null && !error ? <Loading /> : null}
            {cursor ? <Button variant="ghost" size="sm" label="Load earlier messages" onPress={loadOlder} style={{ alignSelf: 'center' }} /> : null}
            {messages && !messages.length ? (
              <Txt size={14} color={t.fgSubtle} center style={{ marginTop: 40 }}>
                Say hello to start the conversation.
              </Txt>
            ) : null}
            {(messages || []).map((m) => {
              const mine = String(m.senderId?._id || m.senderId) === me.id;
              return (
                <View key={m._id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Txt size={14.5} color={mine ? t.white : t.fg} style={{ lineHeight: 20 }}>
                    {m.body}
                  </Txt>
                  <Txt size={10.5} color={mine ? 'rgba(255,255,255,0.7)' : t.fgSubtle} style={{ marginTop: 3 }}>
                    {timeAgo(m.createdAt)}
                  </Txt>
                </View>
              );
            })}
          </ScrollView>

          {error ? <Alert style={{ marginHorizontal: 16, marginBottom: 8 }}>{error}</Alert> : null}
          {me.muted ? (
            <Txt size={13.5} color={t.fgSubtle} style={styles.mutedBar}>
              You are muted and cannot send messages right now.
            </Txt>
          ) : (
            <Row gap={10} align="flex-end" style={styles.composer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write a message"
                placeholderTextColor={t.fgSubtle}
                multiline
                maxLength={4000}
                style={styles.input}
                accessibilityLabel="Write a message"
              />
              <Pressable
                onPress={send}
                disabled={!text.trim() || sending}
                style={[styles.send, (!text.trim() || sending) && { opacity: 0.45 }]}
                accessibilityRole="button"
                accessibilityLabel="Send message">
                <Icon name="send" size={18} color={t.white} />
              </Pressable>
            </Row>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function Messages({ openWith, onUnreadChange }) {
  const { token } = useAppState();
  const { me, about, startChat } = useCommunity();
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(openWith || null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    const data = await api(`${BASE}/conversations`, { token });
    setConversations(data.conversations);
    onUnreadChange?.(data.unreadTotal);
  }, [token, onUnreadChange]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);
  usePolling(() => load().catch(() => {}));

  useEffect(() => {
    if (openWith) setActive(openWith);
  }, [openWith]);

  const list = conversations || [];
  const ownerId = about.owner?.id;
  const hasMentorChat = list.some((c) => c.participantIds.some((p) => String(p._id) === ownerId));

  return (
    <View style={{ gap: 14 }}>
      {error ? <Alert>{error}</Alert> : null}
      {!me.isModerator && about.owner && !hasMentorChat && me.canMessageMentor === false ? (
        <FeatureOffer
          compact
          feature="mentorship"
          title={`Message ${firstName(about.owner.fullName)} directly`}
          text="Private messages with Maxwell come with Mentorship. Questions for everyone are free in Q&A."
        />
      ) : null}
      {!me.isModerator && about.owner && !hasMentorChat && !me.muted && me.canMessageMentor !== false ? (
        <Button
          icon="message-circle"
          label={`Message ${firstName(about.owner.fullName)}`}
          loading={starting}
          onPress={async () => {
            setStarting(true);
            await startChat(ownerId);
            setStarting(false);
          }}
        />
      ) : null}
      {conversations === null && !error ? <Loading /> : null}
      {conversations && !list.length ? (
        <EmptyState icon="envelope-o" title="No messages yet" subtitle={me.isModerator ? 'Members who message you will show up here.' : 'Your private chats will show up here.'} />
      ) : null}
      {list.length ? (
        <Card padded={false}>
          {list.map((c, i) => {
            const other = otherPerson(c, me.id);
            const unread = c.unreadCount > 0;
            return (
              <View key={c._id}>
                {i ? <Divider /> : null}
                <PressableScale haptic="select" scaleTo={0.99} onPress={() => setActive(c)} style={{ padding: 14 }}>
                  <Row gap={12}>
                    <Avatar uri={assetUrl(other?.profilePicture)} name={other?.fullName} size={44} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Row justify="space-between" gap={8}>
                        <Txt size={15} weight={unread ? 'bold' : 'medium'} numberOfLines={1} style={{ flex: 1 }}>
                          {other?.fullName || 'Member'}
                        </Txt>
                        {c.lastMessage ? (
                          <Txt size={11.5} color={t.fgSubtle}>
                            {timeAgo(c.lastMessage.at)}
                          </Txt>
                        ) : null}
                      </Row>
                      <Row justify="space-between" gap={8} style={{ marginTop: 2 }}>
                        <Txt size={13.5} color={unread ? t.fg : t.fgSubtle} numberOfLines={1} style={{ flex: 1 }}>
                          {c.lastMessage ? `${String(c.lastMessage.senderId) === me.id ? 'You: ' : ''}${c.lastMessage.body}` : 'No messages yet'}
                        </Txt>
                        {unread ? (
                          <View style={styles.count}>
                            <Txt size={11} weight="bold" color={t.white} tabular>
                              {c.unreadCount}
                            </Txt>
                          </View>
                        ) : null}
                      </Row>
                    </View>
                  </Row>
                </PressableScale>
              </View>
            );
          })}
        </Card>
      ) : null}
      {active ? <Thread key={active._id} conversation={active} onClose={() => setActive(null)} onActivity={() => load().catch(() => {})} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  mine: { alignSelf: 'flex-end', backgroundColor: t.brand600, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: t.ink700, borderBottomLeftRadius: 6 },
  composer: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 128,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.line,
    color: t.fg,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.brand600, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: t.brand600, alignItems: 'center', justifyContent: 'center' },
  mutedBar: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
});
