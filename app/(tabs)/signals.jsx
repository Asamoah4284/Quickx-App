import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import FeatureGate from '@/components/FeatureGate';
import SignalCard from '@/components/signals/SignalCard';
import TrackRecord, { SignalStats } from '@/components/signals/TrackRecord';
import { Alert, Button, Card, Icon, Rise, Row, SectionTitle, Tabs, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';

const PAGE_SIZE = 20;
const REFRESH_MS = 60 * 1000;

function Feed() {
  const { token, isOwner } = useAppState();
  const [tab, setTab] = useState('live');
  const [data, setData] = useState(null);
  const [older, setOlder] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await api(`/signals?page=1&limit=${PAGE_SIZE}`, { token });
      setData(next);
      setOlder([]);
      setPage(1);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [token]);

  // Fresh every time the tab opens, and every minute while it stays open.
  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, REFRESH_MS);
      return () => clearInterval(id);
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadOlder = async () => {
    setLoadingMore(true);
    try {
      const next = await api(`/signals?page=${page + 1}&limit=${PAGE_SIZE}`, { token });
      setOlder((list) => [...list, ...next.history]);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const ownerButton = isOwner ? (
    <Button icon="plus" label="Post a signal" onPress={() => router.push('/owner/signal')} />
  ) : null;

  if (!data) {
    return (
      <Page title="Signals" eyebrow="Live trade ideas" tabs>
        <View style={{ gap: 12 }}>
          {error ? <Alert>{error.message}</Alert> : null}
          <Skeleton height={86} radius={16} />
          <Skeleton height={240} radius={20} />
          <Skeleton height={240} radius={20} />
        </View>
      </Page>
    );
  }

  const history = [...data.history, ...older];
  const list = tab === 'live' ? data.open : history;
  const hasMore = history.length < data.historyTotal;

  return (
    <Page
      title="Signals"
      eyebrow="Live trade ideas"
      subtitle="Entry, stop loss and targets for each setup. Manage your own risk on every trade."
      tabs
      refreshing={refreshing}
      onRefresh={refresh}>
      <View style={{ gap: 16 }}>
        {ownerButton}
        <SignalStats stats={data.stats} openCount={data.open.length} />
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'live', label: 'Live', count: data.open.length },
            { value: 'history', label: 'History', count: data.historyTotal },
          ]}
        />
        {tab === 'live' && list.length ? (
          <Txt size={13} color={t.fgMuted} style={{ lineHeight: 19 }}>
            Tap any price to copy it, or tap Copy trade to copy the whole signal into MT4, MT5 or your broker app.
          </Txt>
        ) : null}
        {list.length ? (
          list.map((signal, i) => (
            <Rise key={signal.id} index={i}>
              <SignalCard signal={signal} />
              {isOwner ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="edit-3"
                  label="Update or close"
                  style={{ marginTop: 8 }}
                  onPress={() => router.push({ pathname: '/owner/signal', params: { id: signal.id } })}
                />
              ) : null}
            </Rise>
          ))
        ) : (
          <EmptyState
            icon={tab === 'live' ? 'bolt' : 'history'}
            title={tab === 'live' ? 'No live signals right now' : 'No closed signals yet'}
            subtitle={tab === 'live' ? 'You will get a notification as soon as the next one is posted.' : 'Finished signals and their results show up here.'}
          />
        )}
        {tab === 'history' && hasMore ? <Button variant="secondary" label="Show older signals" loading={loadingMore} onPress={loadOlder} /> : null}
        <Card tone="warn" style={{ marginTop: 8 }}>
          <Row gap={10} align="flex-start">
            <Icon name="shield" size={16} color={t.warn} style={{ marginTop: 2 }} />
            <Txt size={12.5} color={t.fgMuted} style={{ flex: 1, lineHeight: 18 }}>
              Signals are trade ideas, not financial advice. Trading carries risk. Only trade money you can afford to lose.
            </Txt>
          </Row>
        </Card>
      </View>
    </Page>
  );
}

function Locked() {
  const record = useApi('/signals/public');
  return (
    <Page
      title="Signals"
      eyebrow="Live trade ideas"
      subtitle="Maxwell posts entries, stop losses and targets. Members get each one on their phone the moment it is posted."
      tabs
      refreshing={record.refreshing}
      onRefresh={record.refresh}>
      <FeatureGate
        feature="signals"
        preview={
          record.data?.stats?.total > 0 ? (
            <View>
              <SectionTitle title="Recent results" />
              <TrackRecord data={record.data} />
            </View>
          ) : null
        }
      />
    </Page>
  );
}

export default function SignalsScreen() {
  const { isSignedIn, has, accessLoaded } = useAppState();
  if (isSignedIn && !accessLoaded) {
    return (
      <Page title="Signals" eyebrow="Live trade ideas" tabs>
        <Skeleton height={240} radius={20} />
      </Page>
    );
  }
  return isSignedIn && has('signals') ? <Feed /> : <Locked />;
}
