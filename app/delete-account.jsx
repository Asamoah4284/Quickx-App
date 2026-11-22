import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Alert, Button, Card, Check, Field, Icon, Input, Loading, Row, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { api } from '@/constants/api';
import { LINKS } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { cedis } from '@/utils/currency';
import { haptics } from '@/utils/haptics';

const REMOVED = [
  'Your name, email, phone number, password, photo and Mobile Money details',
  'Your plans, access and course progress',
  'Your community posts, comments, answers and private messages',
  'Your notifications, and upcoming mentorship sessions',
];

export default function DeleteAccountScreen() {
  const { token, logout } = useAppState();
  const check = useApi(token ? '/users/me/deletion-check' : null);
  const [confirm, setConfirm] = useState('');
  const [acceptLoss, setAcceptLoss] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Page back title="Delete account">
        <Card tone="up" style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Icon name="check-circle" size={32} color={t.up} />
          <Txt size={18} weight="bold" center style={{ marginTop: 12 }}>
            Your account has been deleted
          </Txt>
          <Txt size={14} color={t.fgMuted} center style={{ marginTop: 6 }}>
            Thank you for learning with us.
          </Txt>
          <Button label="Back to Home" style={{ alignSelf: 'stretch', marginTop: 20 }} onPress={() => router.replace('/')} />
        </Card>
      </Page>
    );
  }

  const blockers = check.data?.blockers || [];
  const hard = blockers.filter((b) => b.code !== 'HAS_BALANCE');
  const balance = Number(check.data?.balance || 0);
  const ready = confirm.trim().toUpperCase() === 'DELETE' && (balance <= 0 || acceptLoss);

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/users/me', { method: 'DELETE', token, body: { confirm: 'DELETE', acceptLoss } });
      haptics.success();
      await logout();
      setDone(true);
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not delete your account. Please try again.');
      setBusy(false);
    }
  };

  return (
    <Page keyboard back title="Delete account">
      <View style={{ gap: 18 }}>
        <Txt size={15} color={t.fgMuted} style={{ lineHeight: 22 }}>
          Deleting your account is permanent. You lose access to everything you bought, and it cannot be undone.
        </Txt>

        <Card>
          <Txt size={14} weight="semibold">
            What is deleted
          </Txt>
          <View style={{ gap: 8, marginTop: 10 }}>
            {REMOVED.map((item) => (
              <Row key={item} gap={10} align="flex-start">
                <Icon name="x" size={14} color={t.down} style={{ marginTop: 3 }} />
                <Txt size={13.5} color={t.fgMuted} style={{ flex: 1, lineHeight: 19 }}>
                  {item}
                </Txt>
              </Row>
            ))}
          </View>
          <Txt size={12.5} color={t.fgSubtle} style={{ marginTop: 12, lineHeight: 18 }}>
            Payment, wallet, ticket and Pie records are kept because the law requires it, but they are no longer linked to your name or
            contact details.
          </Txt>
        </Card>

        {check.loading && !check.data ? <Loading /> : null}
        {check.error ? <Alert>{check.error.message}</Alert> : null}

        {hard.length ? (
          <View style={{ gap: 10 }}>
            {hard.map((b) => (
              <Alert key={b.code} tone="warn">
                {b.message}
              </Alert>
            ))}
            <Button variant="secondary" label="Open my wallet" onPress={() => router.push('/wallet')} />
          </View>
        ) : check.data ? (
          <Card tone="down">
            <View style={{ gap: 16 }}>
              {balance > 0 ? (
                <View style={{ gap: 10 }}>
                  <Alert tone="warn">{`You still have ${cedis(balance)} in your wallet and referral earnings.`}</Alert>
                  <Button variant="secondary" size="sm" label="Withdraw it first" onPress={() => router.push('/wallet')} />
                  <Check checked={acceptLoss} onChange={setAcceptLoss}>
                    {`I understand I will lose ${cedis(balance)}.`}
                  </Check>
                </View>
              ) : null}
              <Field label="Type DELETE to confirm">
                <Input value={confirm} onChangeText={setConfirm} autoCapitalize="characters" autoCorrect={false} placeholder="DELETE" />
              </Field>
              {error ? <Alert>{error}</Alert> : null}
              <Button variant="danger" size="lg" icon="trash-2" label="Delete my account" loading={busy} disabled={!ready} onPress={remove} />
            </View>
          </Card>
        ) : null}

        <Button variant="ghost" size="sm" label="Read the privacy policy" onPress={() => Linking.openURL(LINKS.privacy).catch(() => {})} />
      </View>
    </Page>
  );
}
