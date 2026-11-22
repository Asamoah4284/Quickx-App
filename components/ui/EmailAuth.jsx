import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { haptics } from '@/utils/haptics';
import { themed } from '@/utils/themedStyles';

export function EmailAuth({ top }) {
  const { loginWithEmail } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      haptics.success();
    } catch (err) {
      haptics.error();
      setError(err.message || 'Login failed. Check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Welcome back"
      top={top}
      subtitle="Use the same email and password as the QuickX website.">
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Email</Text>
      <AuthField
        icon="envelope-o"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />

      <Text style={styles.label}>Password</Text>
      <AuthField
        icon="lock"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        right={
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eyeBtn}>
            <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color={colors.muted} />
          </Pressable>
        }
      />

      <Link href="/(auth)/forgot-password" style={styles.forgot}>
        Forgot password?
      </Link>

      <PrimaryButton label="Sign in" onPress={submit} loading={loading} style={{ marginTop: spacing.lg }} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to QuickXLearn? </Text>
        <Link href="/(auth)/signup" style={styles.link}>
          Create an account
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.md, fontSize: 14 },
    label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm },
    eyeBtn: { paddingLeft: spacing.sm },
    forgot: { color: colors.primary, fontWeight: '700', fontSize: 14, alignSelf: 'flex-end' },
    footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.xl },
    footerText: { color: colors.muted, fontSize: 14 },
    link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  })
);
