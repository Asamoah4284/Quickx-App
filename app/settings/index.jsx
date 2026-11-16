import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { updateAccount } from '@/utils/account';
import { formatIntlPhone } from '@/utils/phone';

export default function SettingsScreen() {
  const { user, token, updateUser } = useAppState();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Ghana');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setCountry(user?.country || 'Ghana');
  }, [user]);

  const onSave = async () => {
    if (!token || token === 'local') {
      Alert.alert('Offline mode', 'Sign in with a real account to update your profile.');
      return;
    }
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      const nextUser = await updateAccount(token, {
        fullName: trimmedName,
        phone: phone.trim(),
        country: country.trim(),
      });
      await updateUser(nextUser);
      Alert.alert('Saved', 'Your account settings were updated.');
    } catch (error) {
      Alert.alert('Could not save', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={typography.h2}>Settings</Text>
      <Text style={[typography.caption, { marginBottom: spacing.xl }]}>
        Manage your QuickX Learn account details.
      </Text>

      {user?.email ? (
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyLabel}>Email</Text>
          <Text style={styles.readOnlyValue}>{user.email}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Full name</Text>
      <AuthField
        icon="user"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Phone</Text>
      <AuthField
        icon="phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+233…"
        keyboardType="phone-pad"
      />
      {phone ? (
        <Text style={styles.hint}>Displayed as {formatIntlPhone(phone)}</Text>
      ) : null}

      <Text style={styles.label}>Country</Text>
      <AuthField
        icon="globe"
        value={country}
        onChangeText={setCountry}
        placeholder="Ghana"
        autoCapitalize="words"
      />

      <PrimaryButton label="Save changes" onPress={onSave} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  readOnly: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  readOnlyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontWeight: '600',
    color: colors.text,
  },
  offlineNote: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#FFF8E6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F0D98C',
  },
  offlineText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
