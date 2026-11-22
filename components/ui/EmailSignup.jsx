import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { OtpInput } from '@/components/ui/OtpInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing, t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { isStrongPassword } from '@/utils/auth';
import { haptics } from '@/utils/haptics';
import { formatIntlPhone, isValidGhPhone, normalizeGhPhone } from '@/utils/phone';
import { themed } from '@/utils/themedStyles';

const PASSWORD_RULES = [
  { id: 'len', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Lowercase', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Number', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Symbol (@$!%*?&)', test: (p) => /[@$!%*?&]/.test(p) },
];

function isValidName(value) {
  return /^[a-zA-Z\s]{2,100}$/.test(String(value || '').trim());
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

/** Email + password registration, matching the website's /register → /verify-account flow. */
export function EmailSignup({ top }) {
  const { registerWithEmail, verifyEmailAccount, resendEmailOtp } = useAppState();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [step, setStep] = useState('form');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const verifying = useRef(false);

  const localPhone = normalizeGhPhone(phone);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const submit = async () => {
    setError('');
    if (!isValidName(fullName)) return setError('Enter your full name using letters only.');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!isValidGhPhone(localPhone)) return setError('Enter a valid Ghana number, like 024 123 4567.');
    if (!isStrongPassword(password)) return setError('Your password doesn’t meet all the requirements below.');

    setLoading(true);
    try {
      const result = await registerWithEmail({ fullName, email, phone: localPhone, password, referralCode });
      haptics.success();
      setStep('code');
      setCode('');
      setSeconds(45);
      setHint(result?.devCode && __DEV__ ? `Dev code: ${result.devCode}` : '');
    } catch (err) {
      haptics.error();
      setError(err.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (nextCode = code) => {
    if (verifying.current) return;
    if (nextCode.length !== 6) {
      setError('Enter the 6-digit code from your SMS.');
      return;
    }
    verifying.current = true;
    setError('');
    setLoading(true);
    try {
      await verifyEmailAccount(email, nextCode);
      haptics.success();
    } catch (err) {
      haptics.error();
      setError(err.message || 'That code didn’t work.');
      verifying.current = false;
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      const result = await resendEmailOtp(email);
      setSeconds(45);
      if (result?.devCode && __DEV__) setHint(`Dev code: ${result.devCode}`);
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    }
  };

  if (step === 'code') {
    return (
      <AuthScreen
        title="Verify your account"
        subtitle={`We texted a 6-digit code to ${formatIntlPhone(localPhone)}.`}
        onBack={() => {
          setStep('form');
          setError('');
          setHint('');
        }}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {hint ? (
          <View style={styles.hintCard}>
            <FontAwesome name="commenting" size={14} color={colors.goldDark} />
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ) : null}

        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next);
            setError('');
            if (next.length === 6) confirm(next);
          }}
          error={Boolean(error)}
        />

        <PrimaryButton label="Verify & continue" onPress={() => confirm()} loading={loading} />

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.muted}>Resend code in {seconds}s</Text>
          ) : (
            <Pressable onPress={resend} hitSlop={8}>
              <Text style={styles.link}>Resend code</Text>
            </Pressable>
          )}
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create account"
      top={top}
      subtitle="Sign up with email and a password. The same account works on the QuickX website.">
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Full name</Text>
      <AuthField
        icon="user"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />

      <Text style={styles.label}>Email</Text>
      <AuthField
        icon="envelope-o"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <Text style={styles.label}>Mobile number</Text>
      <AuthField
        icon="phone"
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/[^\d+\s]/g, '').slice(0, 14))}
        placeholder="024 123 4567"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />

      <Text style={styles.label}>Password</Text>
      <AuthField
        icon="lock"
        value={password}
        onChangeText={setPassword}
        placeholder="Create a password"
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        right={
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eye}>
            <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color={colors.muted} />
          </Pressable>
        }
      />
      <View style={styles.rules}>
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <View key={rule.id} style={[styles.rule, ok && styles.ruleOk]}>
              <FontAwesome name={ok ? 'check' : 'circle-o'} size={10} color={ok ? colors.success : colors.muted} />
              <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{rule.label}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.label}>Referral code (optional)</Text>
      <AuthField
        icon="gift"
        value={referralCode}
        onChangeText={(v) => setReferralCode(v.toUpperCase().slice(0, 6))}
        placeholder="e.g. AB12CD"
        autoCapitalize="characters"
      />

      <PrimaryButton label="Create account" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" style={styles.link}>
          Sign in
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.md, fontSize: 14 },
    label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm },
    eye: { paddingLeft: spacing.sm },
    rules: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -4, marginBottom: spacing.lg },
    rule: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: radii.full,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    ruleOk: { backgroundColor: 'rgba(47,208,140,0.12)', borderColor: 'rgba(47,208,140,0.3)' },
    ruleText: { fontSize: 11, fontWeight: '600', color: colors.muted },
    ruleTextOk: { color: t.up },
    footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.xl },
    footerText: { color: colors.muted, fontSize: 14 },
    link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    muted: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    hintCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245,184,74,0.12)',
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    hintText: { flex: 1, marginLeft: 10, color: colors.text, fontWeight: '600', fontSize: 13 },
    resendRow: { alignItems: 'center', marginTop: spacing.xl },
  })
);
