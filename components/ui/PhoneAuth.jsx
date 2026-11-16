import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { OtpInput } from '@/components/ui/OtpInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  digitsOnly,
  formatGhPhone,
  formatIntlPhone,
  isValidGhPhone,
  normalizeGhPhone,
} from '@/utils/phone';

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Enter your Ghana number. We’ll text you a 6-digit code to sign in.',
    send: 'Send verification code',
    footer: 'New to QuickXLearn? ',
    action: 'Create an account',
    href: '/(auth)/signup',
    missing: 'No account with this number. Create one instead.',
  },
  signup: {
    title: 'Create account',
    subtitle: 'Add your name, email, and Ghana number. We’ll text a code to finish setup.',
    send: 'Send verification code',
    footer: 'Already have an account? ',
    action: 'Sign in',
    href: '/(auth)/login',
    missing: 'This number already has an account. Sign in instead.',
  },
};

function isValidName(value) {
  return /^[a-zA-Z\s]{2,100}$/.test(String(value || '').trim());
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function PhoneAuth({ mode, top }) {
  const { requestOtp, verifyOtp } = useAppState();
  const copy = COPY[mode];
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hint, setHint] = useState('');
  const verifying = useRef(false);

  const localPhone = normalizeGhPhone(phone);
  const profile = { fullName: fullName.trim(), email: email.trim().toLowerCase() };
  const validPhone = isValidGhPhone(localPhone);
  const validSignup = mode !== 'signup' || (isValidName(fullName) && isValidEmail(email));
  const valid = validPhone && validSignup;

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const sendCode = async () => {
    setError('');
    if (!validPhone) {
      setError('Enter a valid Ghana number, like 024 123 4567.');
      return;
    }
    if (mode === 'signup' && !isValidName(fullName)) {
      setError('Enter your full name using letters only.');
      return;
    }
    if (mode === 'signup' && !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(localPhone, mode, mode === 'signup' ? profile : {});
      setStep('code');
      setCode('');
      setSeconds(45);
      if (result?.devCode && __DEV__) {
        setHint(`Dev code: ${result.devCode}`);
      } else {
        setHint('');
      }
    } catch (err) {
      setError(err.message || copy.missing);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (nextCode = code) => {
    if (verifying.current) return;
    if (nextCode.length !== 6) {
      setError('Enter the 6-digit code from your SMS.');
      return;
    }
    verifying.current = true;
    setError('');
    setLoading(true);
    try {
      await verifyOtp(localPhone, nextCode);
    } catch (err) {
      setError(err.message || 'That code didn’t work.');
      verifying.current = false;
      setLoading(false);
    }
  };

  const onCodeChange = (next) => {
    setCode(next);
    setError('');
    if (next.length === 6) confirmCode(next);
  };

  if (step === 'code') {
    return (
      <AuthScreen
        title="Enter the code"
        subtitle={`We sent a 6-digit SMS to ${formatIntlPhone(localPhone)}.`}
        backLabel="‹ Change number"
        onBack={() => {
          setStep('phone');
          setCode('');
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

        <OtpInput value={code} onChange={onCodeChange} error={Boolean(error)} />

        <PrimaryButton label="Verify number" onPress={() => confirmCode()} loading={loading} />

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.muted}>Resend code in {seconds}s</Text>
          ) : (
            <Pressable onPress={sendCode} disabled={loading}>
              <Text style={styles.link}>Resend code</Text>
            </Pressable>
          )}
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title={copy.title} subtitle={copy.subtitle} top={top}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {mode === 'signup' ? (
        <>
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
        </>
      ) : null}

      <Text style={styles.label}>Mobile number</Text>
      <View style={[styles.phoneCard, error ? styles.phoneCardError : null]}>
        <View style={styles.prefix}>
          <Text style={styles.flag}>🇬🇭</Text>
          <Text style={styles.dial}>+233</Text>
        </View>
        <View style={styles.divider} />
        <TextInput
          value={formatGhPhone(phone)}
          onChangeText={(next) => setPhone(digitsOnly(next).slice(0, 10))}
          placeholder="024 123 4567"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={12}
          returnKeyType="go"
          onSubmitEditing={sendCode}
          style={styles.phoneInput}
        />
      </View>

      <Text style={styles.hintLine}>We’ll send a 6-digit SMS to this number.</Text>

      <PrimaryButton
        label={copy.send}
        onPress={sendCode}
        loading={loading}
        disabled={!valid}
        style={{ marginTop: spacing.md }}
      />

      <Text style={styles.legal}>We’ll send a one-time code. Standard SMS rates may apply.</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{copy.footer}</Text>
        <Link href={copy.href} style={styles.link}>
          {copy.action}
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: spacing.md,
    fontSize: 14,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  phoneCardError: {
    borderColor: colors.danger,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  flag: {
    fontSize: 22,
    marginRight: 8,
  },
  dial: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.4,
    paddingVertical: spacing.md,
  },
  hintLine: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.muted,
    fontSize: 13,
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  legal: {
    marginTop: spacing.lg,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,184,74,0.12)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hintText: {
    flex: 1,
    marginLeft: 10,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
