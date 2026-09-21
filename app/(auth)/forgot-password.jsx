import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { requestPasswordReset } from '@/utils/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setSuccess(false);
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Forgot password"
      subtitle="We’ll email you a link to reset your password if that address is registered.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? (
        <Text style={styles.success}>
          If your email is registered, you will receive a password reset link shortly. Open it on
          your phone or computer, then return here to sign in.
        </Text>
      ) : (
        <>
          <Text style={styles.label}>Email</Text>
          <AuthField
            icon="envelope-o"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <PrimaryButton label="Send reset link" onPress={submit} loading={loading} />
        </>
      )}

      <Link href="/(auth)/login" style={styles.link}>
        Back to sign in
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.md },
  success: { color: colors.success, lineHeight: 20, marginBottom: spacing.lg, fontWeight: '600' },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm },
  link: { color: colors.primary, fontWeight: '700', marginTop: spacing.xl, textAlign: 'center' },
});
