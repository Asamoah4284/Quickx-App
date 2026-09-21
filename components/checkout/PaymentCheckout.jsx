import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/ui/AuthField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { applyDiscount, normalizeMomoPhone, validateCoupon } from '@/utils/payments';
import { detectMomoNetwork, getMomoNetworks } from '@/utils/moolre';
import { formatPriceCedi } from '@/utils/format';

export function PaymentCheckout({
  title,
  subtitle,
  price,
  user,
  onPay,
  paying = false,
  allowCoupon = true,
  allowReferral = true,
}) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [network, setNetwork] = useState(detectMomoNetwork(user?.phone || ''));
  const [couponCode, setCouponCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  const finalPrice = discount > 0 ? applyDiscount(price, discount) : Number(price) || 0;

  const onApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    try {
      const data = await validateCoupon(couponCode, price);
      if (data?.valid) {
        setDiscount(Number(data.discount) || 0);
        setCouponId(data.couponId);
        Alert.alert('Coupon applied', `${data.discount}% off applied.`);
      }
    } catch (error) {
      Alert.alert('Invalid coupon', error.message || 'Could not apply coupon.');
      setDiscount(0);
      setCouponId(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const submit = async () => {
    const momo = normalizeMomoPhone(phone);
    if (!momo || momo.length < 10) {
      Alert.alert('Phone required', 'Enter a valid Mobile Money number.');
      return;
    }
    const selectedNetwork = network || detectMomoNetwork(momo);
    setAwaitingApproval(true);
    try {
      await onPay({
        phone: momo,
        email: user?.email,
        amount: finalPrice,
        referralCode: referralCode.trim(),
        couponId,
        discount,
        network: selectedNetwork,
        otpcode: otpCode.trim() || undefined,
        sessionid: sessionId || undefined,
        onPending: (pending) => {
          if (pending?.sessionId) setSessionId(pending.sessionId);
          if (pending?.requiresOtp) {
            Alert.alert(
              'Verification required',
              'Enter the OTP sent to your phone, then tap Pay again.'
            );
          } else {
            Alert.alert(
              'Approve payment',
              'Check your phone for the MoMo prompt. We’ll confirm once you approve.'
            );
          }
        },
      });
    } finally {
      setAwaitingApproval(false);
    }
  };

  return (
    <View>
      <Text style={typography.h2}>{title}</Text>
      {subtitle ? <Text style={[typography.caption, { marginTop: spacing.sm }]}>{subtitle}</Text> : null}

      <View style={styles.card}>
        <Row label="Price" value={formatPriceCedi(price)} />
        {discount > 0 ? <Row label="Discount" value={`-${discount}%`} /> : null}
        <Row label="Total" value={formatPriceCedi(finalPrice)} highlight />
      </View>

      <Text style={styles.label}>Mobile Money network</Text>
      <View style={styles.networkRow}>
        {getMomoNetworks().map((item) => {
          const active = network === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setNetwork(item.id)}
              style={[styles.networkChip, active && styles.networkChipActive]}>
              <Text style={[styles.networkText, active && styles.networkTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Mobile Money number</Text>
      <AuthField
        icon="phone"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          if (!network) setNetwork(detectMomoNetwork(value));
        }}
        placeholder="0XX XXX XXXX"
        keyboardType="phone-pad"
      />

      {sessionId ? (
        <>
          <Text style={styles.label}>Payment OTP</Text>
          <AuthField
            icon="lock"
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="Enter OTP from SMS"
            keyboardType="number-pad"
          />
        </>
      ) : null}

      {allowCoupon ? (
        <>
          <Text style={styles.label}>Coupon code</Text>
          <View style={styles.row}>
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Optional"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={[styles.input, { flex: 1 }]}
            />
            <PrimaryButton
              label={checkingCoupon ? '…' : 'Apply'}
              variant="secondary"
              onPress={onApplyCoupon}
              disabled={checkingCoupon}
            />
          </View>
        </>
      ) : null}

      {allowReferral ? (
        <>
          <Text style={styles.label}>Referral code</Text>
          <AuthField
            icon="gift"
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Optional"
            autoCapitalize="characters"
          />
        </>
      ) : null}

      <Text style={styles.hint}>
        Payment is processed via Moolre Mobile Money. Approve the prompt on your phone when it appears.
      </Text>
      <PrimaryButton
        label={
          paying || awaitingApproval
            ? 'Processing…'
            : `Pay ${formatPriceCedi(finalPrice)} with MoMo`
        }
        onPress={submit}
        disabled={paying || awaitingApproval}
      />
    </View>
  );
}

function Row({ label, value, highlight }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  networkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  networkChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  networkChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  networkText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  networkTextActive: { color: colors.white },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  hint: { color: colors.muted, fontSize: 12, marginBottom: spacing.lg, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted },
  summaryValue: { fontWeight: '700', color: colors.text },
  summaryHighlight: { color: colors.primary, fontSize: 18 },
});
