import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { AuthField } from '@/components/ui/AuthField';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { isStrongPassword, resetPassword } from '@/utils/auth';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!token) {
      setError('Reset link is invalid. Request a new one.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError(
        'Password must be 8+ characters with uppercase, lowercase, number, and special character.'
      );
      return;
    }
    setLoading(true);
    try {
      await resetPassword(String(token), password);
      setSuccess(true);
      setTimeout(() => router.replace('/(auth)/login'), 2500);
    } catch (err) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Reset password" subtitle="Choose a new password for your account.">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? (
        <Text style={styles.success}>Password updated. Redirecting to sign in…</Text>
      ) : (
        <>
          <Text style={styles.label}>New password</Text>
          <View style={styles.passwordRow}>
            <View style={{ flex: 1 }}>
              <AuthField
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.label}>Confirm password</Text>
          <AuthField
            icon="lock"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <PrimaryButton label="Reset password" onPress={submit} loading={loading} />
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
  success: { color: colors.success, fontWeight: '600', lineHeight: 20 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyeBtn: { padding: spacing.sm },
  link: { color: colors.primary, fontWeight: '700', marginTop: spacing.xl, textAlign: 'center' },
});
