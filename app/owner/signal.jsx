import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert as NativeAlert, View } from 'react-native';

import SignalCard, { DirectionPill } from '@/components/signals/SignalCard';
import { Alert, Button, Card, Chips, Eyebrow, Field, Input, Loading, Row, Txt } from '@/components/ui/kit';
import { Footer, Page } from '@/components/ui/Page';
import { api } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { haptics } from '@/utils/haptics';
import { levelProblem, STATUS_META } from '@/utils/signals';

const EMPTY = { pair: '', direction: 'buy', orderType: 'market', entry: '', stopLoss: '', tp1: '', tp2: '', tp3: '', timeframe: '', note: '', chartImage: '' };

/** Phones with a comma keyboard type "1,0850". The server wants "1.0850". */
const decimal = (v) => v.replace(',', '.').replace(/[^0-9.]/g, '');

function NewSignal() {
  const { token } = useAppState();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key, clean) => (value) => setForm((f) => ({ ...f, [key]: clean ? clean(value) : value }));

  const problem = levelProblem(form);
  const takeProfits = [form.tp1, form.tp2, form.tp3].filter((v) => v !== '').map(Number);
  const ready = form.pair && form.entry !== '' && form.stopLoss !== '' && takeProfits.length > 0;
  const preview = {
    ...form,
    entry: Number(form.entry),
    stopLoss: Number(form.stopLoss),
    takeProfits,
    orderType: form.orderType === 'market' ? 'market' : `${form.direction} ${form.orderType}`,
    status: 'active',
    updates: [],
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const { tp1, tp2, tp3, ...rest } = form;
      await api('/signals/admin', {
        method: 'POST',
        token,
        body: { ...rest, takeProfits: [tp1, tp2, tp3].filter((v) => v !== '') },
      });
      haptics.success();
      router.back();
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not post the signal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page
      back
      keyboard
      title="Post a signal"
      subtitle="Members with Signals get a notification straight away."
      footer={
        <Footer>
          <Button size="lg" icon="send" label="Post and notify members" loading={busy} disabled={!ready || Boolean(problem)} onPress={submit} />
        </Footer>
      }>
      <View style={{ gap: 16 }}>
        <Row gap={12} align="flex-start">
          <Field label="Pair" style={{ flex: 1.3 }}>
            <Input value={form.pair} onChangeText={set('pair', (v) => v.toUpperCase().replace(/\s/g, ''))} placeholder="XAUUSD" autoCapitalize="characters" autoCorrect={false} />
          </Field>
          <Field label="Timeframe" style={{ flex: 1 }}>
            <Input value={form.timeframe} onChangeText={set('timeframe', (v) => v.toUpperCase())} placeholder="H1" autoCapitalize="characters" />
          </Field>
        </Row>
        <Field label="Direction">
          <Chips
            items={[
              { value: 'buy', label: 'Buy' },
              { value: 'sell', label: 'Sell' },
            ]}
            value={form.direction}
            onChange={set('direction')}
          />
        </Field>
        <Field label="Order type">
          <Chips
            items={[
              { value: 'market', label: 'Market (now)' },
              { value: 'limit', label: `${form.direction === 'buy' ? 'Buy' : 'Sell'} limit` },
              { value: 'stop', label: `${form.direction === 'buy' ? 'Buy' : 'Sell'} stop` },
            ]}
            value={form.orderType}
            onChange={set('orderType')}
          />
        </Field>
        <Row gap={12}>
          <Field label="Entry" style={{ flex: 1 }}>
            <Input value={form.entry} onChangeText={set('entry', decimal)} keyboardType="decimal-pad" placeholder="0.00" />
          </Field>
          <Field label="Stop loss" style={{ flex: 1 }}>
            <Input value={form.stopLoss} onChangeText={set('stopLoss', decimal)} keyboardType="decimal-pad" placeholder="0.00" />
          </Field>
        </Row>
        <Row gap={10}>
          {['tp1', 'tp2', 'tp3'].map((key, i) => (
            <Field key={key} label={`Target ${i + 1}`} style={{ flex: 1 }}>
              <Input value={form[key]} onChangeText={set(key, decimal)} keyboardType="decimal-pad" placeholder={i ? 'Optional' : '0.00'} />
            </Field>
          ))}
        </Row>
        <Field label="Note" hint="Reasoning, risk advice, anything members should know.">
          <Input multiline value={form.note} onChangeText={set('note')} maxLength={2000} />
        </Field>
        <Field label="Chart image link" hint="Optional. Paste a link to a chart screenshot.">
          <Input value={form.chartImage} onChangeText={set('chartImage')} placeholder="https://" autoCapitalize="none" keyboardType="url" />
        </Field>
        {problem ? <Alert tone="warn">{problem}</Alert> : null}
        {ready && !problem ? (
          <View style={{ gap: 8 }}>
            <Eyebrow color={t.fgSubtle}>What members will see</Eyebrow>
            <SignalCard preview signal={preview} />
          </View>
        ) : null}
        {error ? <Alert>{error}</Alert> : null}
      </View>
    </Page>
  );
}

function ManageSignal({ id }) {
  const { token } = useAppState();
  const [signal, setSignal] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [update, setUpdate] = useState('');
  const [status, setStatus] = useState('active');
  const [pips, setPips] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/signals/admin', { token })
      .then((data) => {
        const found = (data.signals || []).find((s) => String(s.id) === String(id));
        if (!found) throw new Error('This signal could not be found.');
        setSignal(found);
        setStatus(found.status);
        setPips(found.resultPips == null ? '' : String(found.resultPips));
      })
      .catch((err) => setLoadError(err.message));
  }, [id, token]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/signals/admin/${id}`, {
        method: 'PATCH',
        token,
        body: {
          ...(update.trim() ? { update: update.trim() } : {}),
          status,
          resultPips: pips === '' || pips === '-' ? null : Number(pips),
        },
      });
      haptics.success();
      router.back();
    } catch (err) {
      haptics.error();
      setError(err.message);
      setBusy(false);
    }
  };

  const remove = () => {
    NativeAlert.alert('Delete this signal?', `Members will no longer see the ${signal.pair} signal.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/signals/admin/${id}`, { method: 'DELETE', token });
            router.back();
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  if (loadError) {
    return (
      <Page back title="Update signal">
        <Alert>{loadError}</Alert>
      </Page>
    );
  }
  if (!signal) {
    return (
      <Page back title="Update signal">
        <Loading />
      </Page>
    );
  }

  return (
    <Page
      back
      keyboard
      title="Update signal"
      footer={
        <Footer>
          <Button size="lg" label="Save" loading={busy} onPress={save} />
        </Footer>
      }>
      <View style={{ gap: 16 }}>
        <Card>
          <Row gap={10}>
            <Txt size={18} weight="bold" tabular>
              {signal.pair}
            </Txt>
            <DirectionPill direction={signal.direction} />
          </Row>
          <Txt size={13} color={t.fgMuted} tabular style={{ marginTop: 6 }}>
            Entry {signal.entry} · SL {signal.stopLoss} · TP {(signal.takeProfits || []).join(' / ')}
          </Txt>
        </Card>
        <Field label="Update for members" hint={'Optional. Sent as a notification, for example "TP1 hit, move stop to entry".'}>
          <Input multiline value={update} onChangeText={setUpdate} maxLength={500} />
        </Field>
        <Field label="Status">
          <Chips items={Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))} value={status} onChange={setStatus} />
        </Field>
        <Field label="Result in pips" hint="Use a minus sign for a loss, for example -25.">
          <Input value={pips} onChangeText={(v) => setPips(v.replace(',', '.').replace(/[^0-9.-]/g, ''))} keyboardType="numbers-and-punctuation" placeholder="0" />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        <Button variant="ghost" icon="trash-2" label="Delete this signal" onPress={remove} />
      </View>
    </Page>
  );
}

/** Maxwell posts, updates and closes signals from his phone. */
export default function OwnerSignal() {
  const { id } = useLocalSearchParams();
  const { isOwner, accessLoaded } = useAppState();
  if (accessLoaded && !isOwner) {
    return (
      <Page back title="Signals">
        <Alert>Only Maxwell can post signals.</Alert>
      </Page>
    );
  }
  return id ? <ManageSignal id={String(id)} /> : <NewSignal />;
}
