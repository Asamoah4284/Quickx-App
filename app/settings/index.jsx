import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Alert, Button, Card, Chips, Field, Input, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useTheme } from '@/context/ThemeContext';
import { updateAccount } from '@/utils/account';
import { haptics } from '@/utils/haptics';

const THEMES = [
  { value: 'system', label: 'Same as phone', icon: 'smartphone' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

export default function SettingsScreen() {
  const { choice, setChoice } = useTheme();
  const { user, token, updateUser } = useAppState();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Ghana');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setCountry(user?.country || 'Ghana');
  }, [user]);

  const changed = fullName.trim() !== (user?.fullName || '') || phone.trim() !== (user?.phone || '') || country.trim() !== (user?.country || 'Ghana');

  const save = async () => {
    setError('');
    setSaved(false);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      const next = await updateAccount(token, { fullName: fullName.trim(), phone: phone.trim(), country: country.trim() });
      await updateUser(next);
      haptics.success();
      setSaved(true);
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page keyboard back title={user ? 'Profile and settings' : 'Settings'}>
      <View style={{ gap: 16 }}>
        <Field label="Theme" hint="Same as phone follows your phone's light or dark setting.">
          <Chips items={THEMES} value={choice} onChange={(next) => setChoice(next, '/settings')} />
        </Field>
        {user ? (
          <>
            {user?.email ? (
              <Card>
                <Txt size={11.5} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Email
                </Txt>
                <Txt size={15} weight="medium" style={{ marginTop: 4 }}>
                  {user.email}
                </Txt>
              </Card>
            ) : null}
            <Field label="Full name">
              <Input icon="user" value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" />
            </Field>
            <Field label="Phone" hint="Used for Mobile Money and sign in with a code.">
              <Input icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+233" autoComplete="tel" />
            </Field>
            <Field label="Country">
              <Input icon="globe" value={country} onChangeText={setCountry} autoCapitalize="words" />
            </Field>
            {error ? <Alert>{error}</Alert> : null}
            {saved ? (
              <Animated.View entering={FadeIn}>
                <Alert tone="up">Your details were saved.</Alert>
              </Animated.View>
            ) : null}
            <Button size="lg" label="Save changes" loading={saving} disabled={!changed} onPress={save} />
          </>
        ) : null}
      </View>
    </Page>
  );
}
