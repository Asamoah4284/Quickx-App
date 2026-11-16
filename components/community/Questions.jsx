import { useEffect, useState } from 'react';
import { Alert as NativeAlert, View } from 'react-native';

import { Author, BASE, RichText, useCommunity } from '@/components/community/shared';
import { showActions } from '@/components/ui/ActionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Badge, Button, Card, Divider, Field, Icon, Input, Loading, Rise, Row, Tabs, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { api } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { timeAgo } from '@/utils/format';
import { haptics } from '@/utils/haptics';

function AskSheet({ visible, onClose, onAsked }) {
  const { token } = useAppState();
  const [form, setForm] = useState({ title: '', body: '', topic: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api(`${BASE}/questions`, { method: 'POST', token, body: form });
      haptics.success();
      setForm({ title: '', body: '', topic: '' });
      onAsked(data.question);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Ask a question" subtitle="Maxwell or another member will answer.">
      <View style={{ gap: 14, paddingBottom: 12 }}>
        <Field label="Your question" hint="One clear sentence works best.">
          <Input value={form.title} onChangeText={set('title')} maxLength={200} />
        </Field>
        <Field label="Details" hint="What have you tried? Add the pair and timeframe if it is about a trade.">
          <Input multiline value={form.body} onChangeText={set('body')} maxLength={5000} />
        </Field>
        <Field label="Topic" hint="Optional, for example Risk management">
          <Input value={form.topic} onChangeText={set('topic')} maxLength={60} />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        <Button size="lg" label="Ask" loading={busy} disabled={!form.title.trim() || !form.body.trim()} onPress={submit} />
      </View>
    </BottomSheet>
  );
}

function QuestionDetail({ questionId, onBack, onChanged }) {
  const { token } = useAppState();
  const { me } = useCommunity();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api(`${BASE}/questions/${questionId}`, { token })
      .then(setData)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const act = async (fn) => {
    try {
      await fn();
      await load();
      onChanged();
    } catch (err) {
      NativeAlert.alert('Something went wrong', err.message);
    }
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setBusy(true);
    await act(async () => {
      await api(`${BASE}/questions/${questionId}/answers`, { method: 'POST', token, body: { body: answer } });
      haptics.success();
      setAnswer('');
    });
    setBusy(false);
  };

  if (error) {
    return (
      <View style={{ gap: 12 }}>
        <Alert>{error}</Alert>
        <Button variant="secondary" label="Back to questions" onPress={onBack} />
      </View>
    );
  }
  if (!data) return <Loading />;

  const { question, answers } = data;
  const mine = String(question.authorId?._id) === me.id;
  const canPickBest = mine || me.isModerator;

  return (
    <View style={{ gap: 14 }}>
      <PressableScale haptic="select" onPress={onBack} style={{ alignSelf: 'flex-start' }}>
        <Row gap={6}>
          <Icon name="arrow-left" size={15} color={t.fgMuted} />
          <Txt size={13.5} color={t.fgMuted}>
            All questions
          </Txt>
        </Row>
      </PressableScale>

      <Card>
        <Row align="flex-start">
          <Author user={question.authorId} when={timeAgo(question.createdAt)} />
          {canPickBest ? (
            <PressableScale
              haptic="select"
              hitSlop={10}
              onPress={() =>
                showActions('Question', [
                  me.isModerator ? { label: question.pinned ? 'Unpin' : 'Pin', onPress: () => act(() => api(`${BASE}/questions/${questionId}`, { method: 'PATCH', token, body: { pinned: !question.pinned } })) } : null,
                  {
                    label: question.status === 'answered' ? 'Mark as open' : 'Mark as answered',
                    onPress: () => act(() => api(`${BASE}/questions/${questionId}`, { method: 'PATCH', token, body: { status: question.status === 'answered' ? 'open' : 'answered' } })),
                  },
                  {
                    label: 'Delete',
                    danger: true,
                    onPress: () =>
                      NativeAlert.alert('Delete this question?', undefined, [
                        { text: 'Keep', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () =>
                            api(`${BASE}/questions/${questionId}`, { method: 'DELETE', token })
                              .then(() => {
                                onChanged();
                                onBack();
                              })
                              .catch((err) => NativeAlert.alert('Could not delete', err.message)),
                        },
                      ]),
                  },
                ])
              }>
              <Icon name="more-horizontal" size={18} color={t.fgSubtle} />
            </PressableScale>
          ) : null}
        </Row>
        <Row gap={6} style={{ marginTop: 12 }}>
          <Badge label={question.status === 'answered' ? 'Answered' : 'Open'} tone={question.status === 'answered' ? 'up' : 'warn'} />
          {question.topic ? <Badge label={question.topic} /> : null}
        </Row>
        <Txt size={19} weight="bold" style={{ marginTop: 10 }}>
          {question.title}
        </Txt>
        <View style={{ marginTop: 8 }}>
          <RichText text={question.body} />
        </View>
      </Card>

      <Txt size={12} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
      </Txt>
      {answers.map((a) => {
        const answerMine = String(a.authorId?._id) === me.id;
        return (
          <Card key={a._id} tone={a.isBest ? 'up' : undefined}>
            <Row align="flex-start">
              <Author user={a.authorId} when={timeAgo(a.createdAt)} size={32} extra={a.isBest ? <Badge label="Best answer" tone="up" icon="check-circle" /> : null} />
              {(canPickBest && !a.isBest) || answerMine || me.isModerator ? (
                <PressableScale
                  haptic="select"
                  hitSlop={10}
                  onPress={() =>
                    showActions('Answer', [
                      canPickBest && !a.isBest ? { label: 'Mark as best answer', icon: 'check-circle', onPress: () => act(() => api(`${BASE}/questions/${questionId}`, { method: 'PATCH', token, body: { bestAnswerId: a._id } })) } : null,
                      answerMine || me.isModerator ? { label: 'Delete', danger: true, onPress: () => act(() => api(`${BASE}/questions/${questionId}/answers/${a._id}`, { method: 'DELETE', token })) } : null,
                    ])
                  }>
                  <Icon name="more-horizontal" size={18} color={t.fgSubtle} />
                </PressableScale>
              ) : null}
            </Row>
            <View style={{ marginTop: 8 }}>
              <RichText text={a.body} />
            </View>
          </Card>
        );
      })}

      {me.muted ? (
        <Alert tone="warn">You are muted and cannot answer right now.</Alert>
      ) : (
        <Card>
          <Input multiline value={answer} onChangeText={setAnswer} placeholder="Write an answer" maxLength={5000} />
          <Button label="Post answer" loading={busy} disabled={!answer.trim()} onPress={submit} style={{ marginTop: 10 }} />
        </Card>
      )}
    </View>
  );
}

export default function Questions() {
  const { token } = useAppState();
  const { me } = useCommunity();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [asking, setAsking] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const load = () => {
    const params = [status === 'mine' ? 'mine=1' : status !== 'all' ? `status=${status}` : '', query ? `q=${encodeURIComponent(query)}` : ''].filter(Boolean).join('&');
    return api(`${BASE}/questions${params ? `?${params}` : ''}`, { token })
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query, token]);

  if (selected) return <QuestionDetail questionId={selected} onBack={() => setSelected(null)} onChanged={load} />;

  const questions = data?.questions || [];

  return (
    <View style={{ gap: 14 }}>
      {!me.muted ? <Button icon="plus" label="Ask a question" onPress={() => setAsking(true)} /> : null}
      <Tabs
        value={status}
        onChange={setStatus}
        tabs={[
          { value: 'all', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'answered', label: 'Answered' },
          { value: 'mine', label: 'Mine' },
        ]}
      />
      <Input icon="search" value={search} onChangeText={setSearch} placeholder="Search questions" returnKeyType="search" />
      {error ? <Alert>{error}</Alert> : null}
      {!data && !error ? <Loading /> : null}
      {data && !questions.length ? <EmptyState icon="question-circle-o" title="No questions here" subtitle="Ask the first one. No question is too basic." /> : null}
      {questions.length ? (
        <Card padded={false}>
          {questions.map((q, i) => (
            <Rise key={q._id} index={i}>
              {i ? <Divider /> : null}
              <PressableScale haptic="select" scaleTo={0.99} onPress={() => setSelected(q._id)} style={{ padding: 16 }}>
                <Row align="flex-start" gap={12}>
                  <View style={{ flex: 1 }}>
                    <Row gap={6}>
                      {q.pinned ? <Icon name="bookmark" size={13} color={t.brand400} /> : null}
                      <Txt size={15} weight="semibold" numberOfLines={2} style={{ flex: 1 }}>
                        {q.title}
                      </Txt>
                    </Row>
                    <Txt size={12.5} color={t.fgSubtle} style={{ marginTop: 4 }}>
                      {q.authorId?.fullName || 'Former member'} · {timeAgo(q.createdAt)}
                      {q.topic ? ` · ${q.topic}` : ''}
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge label={q.status === 'answered' ? 'Answered' : 'Open'} tone={q.status === 'answered' ? 'up' : 'warn'} />
                    <Txt size={11.5} color={t.fgSubtle} tabular>
                      {q.answerCount || 0} {q.answerCount === 1 ? 'reply' : 'replies'}
                    </Txt>
                  </View>
                </Row>
              </PressableScale>
            </Rise>
          ))}
        </Card>
      ) : null}
      <AskSheet
        visible={asking}
        onClose={() => setAsking(false)}
        onAsked={(question) => {
          setAsking(false);
          load();
          setSelected(question._id);
        }}
      />
    </View>
  );
}
