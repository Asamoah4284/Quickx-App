import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import Feed from '@/components/community/Feed';
import { Live, Resources } from '@/components/community/LiveAndResources';
import Messages from '@/components/community/Messages';
import Questions from '@/components/community/Questions';
import { BASE, CommunityContext, RichText } from '@/components/community/shared';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Alert, Button, Card, Icon, IconBox, Loading, Row, Tabs, Txt } from '@/components/ui/kit';
import { Page, RoundButton } from '@/components/ui/Page';
import { api } from '@/constants/api';
import { LINKS } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';

const SECTIONS = [
  { value: 'feed', label: 'Feed', help: 'Share trades, charts and wins. Pick a room to see one topic.' },
  { value: 'questions', label: 'Q&A', help: 'Ask a question. Maxwell or another member will answer it.' },
  { value: 'messages', label: 'Messages', help: 'Your private chats.' },
  { value: 'live', label: 'Live', help: 'Upcoming live sessions and past ones.' },
  { value: 'resources', label: 'Resources', help: 'Files, links and videos shared by Maxwell.' },
];
const KEYS = SECTIONS.map((s) => s.value);

function CommunityHome({ initialTab }) {
  const { token } = useAppState();
  const [about, setAbout] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(KEYS.includes(initialTab) ? initialTab : 'feed');
  const [unread, setUnread] = useState(0);
  const [openChat, setOpenChat] = useState(null);
  const [chatError, setChatError] = useState('');
  const [guidelines, setGuidelines] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // A notification can open a specific section.
  useEffect(() => {
    if (KEYS.includes(initialTab)) setTab(initialTab);
  }, [initialTab]);

  const loadAbout = useCallback(
    () =>
      api(`${BASE}/about`, { token })
        .then((data) => {
          setAbout(data);
          setError(null);
        })
        .catch(setError),
    [token]
  );

  const loadUnread = useCallback(
    () =>
      api(`${BASE}/conversations`, { token })
        .then((data) => setUnread(data.unreadTotal || 0))
        .catch(() => {}),
    [token]
  );

  useEffect(() => {
    loadAbout();
  }, [loadAbout]);

  useFocusEffect(
    useCallback(() => {
      loadUnread();
      const id = setInterval(loadUnread, 60000);
      return () => clearInterval(id);
    }, [loadUnread])
  );

  const startChat = useCallback(
    async (userId) => {
      setChatError('');
      try {
        const data = await api(`${BASE}/conversations`, { method: 'POST', token, body: { participantId: userId } });
        setOpenChat(data.conversation);
        setTab('messages');
      } catch (err) {
        setChatError(err.message);
      }
    },
    [token]
  );

  const context = useMemo(() => (about ? { about, me: about.me, startChat, reloadAbout: loadAbout } : null), [about, startChat, loadAbout]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAbout(), loadUnread()]);
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
  };

  if (error) {
    return (
      <Page title="Community" eyebrow="Trade together" tabs onRefresh={refresh} refreshing={refreshing}>
        <Alert>
          {error.code === 'BLOCKED' ? 'You no longer have access to the community. Contact Maxwell if you think this is a mistake.' : error.message}
        </Alert>
      </Page>
    );
  }
  if (!about) {
    return (
      <Page title="Community" eyebrow="Trade together" tabs>
        <Loading label="Opening the community" />
      </Page>
    );
  }

  const current = SECTIONS.find((s) => s.value === tab);
  const sections = SECTIONS.map((s) => (s.value === 'messages' && unread ? { ...s, count: unread } : s));

  return (
    <CommunityContext.Provider value={context}>
      <Page
        title="Community"
        eyebrow="Trade together"
        subtitle={`${about.memberCount} ${about.memberCount === 1 ? 'member' : 'members'}`}
        right={about.guidelines ? <RoundButton icon="book-open" label="Community guidelines" onPress={() => setGuidelines(true)} /> : null}
        tabs
        keyboard
        refreshing={refreshing}
        onRefresh={refresh}>
        <View style={{ gap: 14 }}>
          <Tabs tabs={sections} value={tab} onChange={setTab} />
          <Txt size={13} color={t.fgMuted}>
            {current.help}
          </Txt>
          {chatError ? <Alert>{chatError}</Alert> : null}
          {about.me.isModerator ? (
            <Row gap={8}>
              <Icon name="settings" size={13} color={t.fgSubtle} />
              <Txt size={12.5} color={t.fgSubtle} style={{ flex: 1 }}>
                Reports, members and rooms are managed on the website.
              </Txt>
              <Button variant="ghost" size="sm" label="Open" onPress={() => Linking.openURL(`${LINKS.website}/community?tab=manage`).catch(() => {})} />
            </Row>
          ) : null}
          <Animated.View key={`${tab}-${refreshKey}`} entering={FadeIn.duration(220)}>
            {tab === 'feed' ? <Feed /> : null}
            {tab === 'questions' ? <Questions /> : null}
            {tab === 'messages' ? <Messages openWith={openChat} onUnreadChange={setUnread} /> : null}
            {tab === 'live' ? <Live /> : null}
            {tab === 'resources' ? <Resources /> : null}
          </Animated.View>
        </View>
      </Page>
      <BottomSheet visible={guidelines} onClose={() => setGuidelines(false)} title="Community guidelines">
        <View style={{ paddingBottom: 16 }}>
          <RichText text={about.guidelines} size={14} color={t.fgMuted} />
        </View>
      </BottomSheet>
    </CommunityContext.Provider>
  );
}

export default function CommunityScreen() {
  const { tab } = useLocalSearchParams();
  const { isSignedIn, requireSignIn } = useAppState();
  if (isSignedIn) return <CommunityHome initialTab={typeof tab === 'string' ? tab : undefined} />;
  return (
    <Page
      title="Community"
      eyebrow="Trade together"
      subtitle="Share trades, ask questions and join live sessions with Maxwell and other traders."
      tabs>
      <Card style={{ alignItems: 'flex-start' }}>
        <IconBox name="users" size={52} />
        <Txt size={13} weight="semibold" color={t.up} style={{ marginTop: 18 }}>
          Free for every member
        </Txt>
        <Txt size={24} weight="bold" style={{ marginTop: 6, letterSpacing: -0.5 }}>
          Join the community
        </Txt>
        <Txt size={15} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 22 }}>
          Create a free account to post, ask questions and get answers. Signals, Courses and Mentorship members also get their own
          rooms.
        </Txt>
        <Button
          size="lg"
          label="Sign in or create an account"
          style={{ alignSelf: 'stretch', marginTop: 20 }}
          onPress={() => requireSignIn('Sign in to join the community. It is free.')}
        />
      </Card>
    </Page>
  );
}
