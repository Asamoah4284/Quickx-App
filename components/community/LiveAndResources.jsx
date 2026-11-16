import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import { BASE } from '@/components/community/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Badge, Button, Card, Icon, Loading, Rise, Row, Tabs, Txt } from '@/components/ui/kit';
import { api, assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatDateTime } from '@/utils/format';

/** "Starts in 2h", "Live now", or nothing once it has ended. */
function countdown(startsAt, endsAt, now) {
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 2 * 3600000;
  if (now >= start && now <= end) return { live: true, label: 'Live now' };
  const diff = start - now;
  if (diff <= 0) return { label: '' };
  const mins = Math.round(diff / 60000);
  if (mins < 60) return { soon: true, label: `Starts in ${mins} min` };
  const hours = Math.round(mins / 60);
  if (hours < 24) return { soon: hours <= 3, label: `Starts in ${hours}h` };
  return { label: `In ${Math.round(hours / 24)} days` };
}

export function Live() {
  const { token } = useAppState();
  const [tab, setTab] = useState('upcoming');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setData(null);
    api(`${BASE}/live-sessions${tab === 'past' ? '?past=1' : ''}`, { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [tab, token]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const sessions = data?.sessions || [];

  return (
    <View style={{ gap: 14 }}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
        ]}
      />
      {error ? <Alert>{error}</Alert> : null}
      {!data && !error ? <Loading /> : null}
      {data && !sessions.length ? (
        <EmptyState
          icon="video-camera"
          title={tab === 'upcoming' ? 'No live sessions scheduled' : 'No past sessions'}
          subtitle={tab === 'upcoming' ? 'You will get a notification when the next one is announced.' : undefined}
        />
      ) : null}
      {sessions.map((s, i) => {
        const c = countdown(s.startsAt, s.endsAt, now);
        return (
          <Rise key={s._id} index={i}>
            <Card tone={c.live ? 'up' : undefined}>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {c.label && tab === 'upcoming' ? <Badge label={c.label} tone={c.live ? 'up' : c.soon ? 'warn' : 'neutral'} dot={c.live} /> : null}
                <Row gap={6}>
                  <Icon name="calendar" size={13} color={t.fgMuted} />
                  <Txt size={13} color={t.fgMuted} tabular>
                    {formatDateTime(s.startsAt)}
                  </Txt>
                </Row>
              </Row>
              <Txt size={17} weight="semibold" style={{ marginTop: 10 }}>
                {s.title}
              </Txt>
              {s.description ? (
                <Txt size={14} color={t.fgMuted} style={{ marginTop: 4, lineHeight: 20 }}>
                  {s.description}
                </Txt>
              ) : null}
              {tab === 'upcoming' && s.joinUrl ? (
                <Button
                  icon="video"
                  label={c.live ? 'Join now' : 'Join link'}
                  variant={c.live || c.soon ? 'primary' : 'secondary'}
                  style={{ marginTop: 14 }}
                  onPress={() => Linking.openURL(s.joinUrl).catch(() => {})}
                />
              ) : null}
            </Card>
          </Rise>
        );
      })}
    </View>
  );
}

const KIND_LABEL = { pdf: 'PDF', video: 'Video', link: 'Link', image: 'Image', assignment: 'Assignment', file: 'File' };
const KIND_ICON = { pdf: 'file-text', video: 'film', link: 'link', image: 'image', assignment: 'edit-3', file: 'file' };

export function Resources() {
  const { token } = useAppState();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`${BASE}/resources`, { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  const resources = data?.resources || [];

  return (
    <View style={{ gap: 12 }}>
      {error ? <Alert>{error}</Alert> : null}
      {!data && !error ? <Loading /> : null}
      {data && !resources.length ? <EmptyState icon="folder-open-o" title="No resources yet" subtitle="Files, links and videos Maxwell shares will show up here." /> : null}
      {resources.map((r, i) => (
        <Rise key={r._id} index={i}>
          <Card onPress={r.fileUrl ? () => Linking.openURL(assetUrl(r.fileUrl)).catch(() => {}) : undefined}>
            <Row gap={12} align="flex-start">
              <Icon name={KIND_ICON[r.kind] || 'file'} size={20} color={t.brand300} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Row gap={8}>
                  <Txt size={15} weight="semibold" style={{ flex: 1 }} numberOfLines={2}>
                    {r.title}
                  </Txt>
                  <Badge label={KIND_LABEL[r.kind] || 'Resource'} tone={r.kind === 'assignment' ? 'warn' : 'brand'} />
                </Row>
                {r.description ? (
                  <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 4, lineHeight: 19 }}>
                    {r.description}
                  </Txt>
                ) : null}
                {r.kind === 'assignment' ? (
                  <Txt size={12} color={t.fgSubtle} style={{ marginTop: 6 }}>
                    {r.mySubmission ? 'You handed this in.' : 'Hand in your work on quickxlearn.com.'}
                  </Txt>
                ) : null}
              </View>
            </Row>
          </Card>
        </Rise>
      ))}
    </View>
  );
}
