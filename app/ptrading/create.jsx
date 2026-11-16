import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { formatCurrency } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { createPie, PIE_MARKETS, PIE_RISK_LEVELS, pieId, RISK_COLORS } from '@/utils/ptrading';

const DEADLINES = [
  { id: 3, label: '3 days' },
  { id: 7, label: '1 week' },
  { id: 14, label: '2 weeks' },
  { id: 30, label: '30 days' },
  { id: 0, label: 'No deadline' },
];

function Chips({ options, value, onChange, colorFor }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const id = typeof o === 'string' ? o : o.id;
        const label = typeof o === 'string' ? o : o.label;
        const active = value === id;
        const tint = colorFor?.(id) || colors.navy;
        return (
          <Pressable
            key={String(id)}
            onPress={() => {
              if (!active) haptics.select();
              onChange(id);
            }}
            style={[styles.chip, active && { backgroundColor: tint, borderColor: tint }]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Input({ label, hint, suffix, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.inputMulti]} {...props} />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const numeric = (v) => v.replace(/[^\d.]/g, '');

export default function CreatePieScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAppState();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    pair: '',
    market: 'forex',
    description: '',
    targetAmount: '',
    minDeposit: '10',
    maxDeposit: '5000',
    targetRoiPercent: '20',
    maxLossPercent: '10',
    ownerFeePercent: '15',
    riskLevel: 'Moderate',
    deadlineDays: 7,
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const target = Number(form.targetAmount);
    const min = Number(form.minDeposit);
    const max = Number(form.maxDeposit);
    const problems = [];
    if (form.title.trim().length < 4) problems.push('Give your pie a clear title.');
    if (!form.pair.trim()) problems.push('Add the asset pair you’ll trade (e.g. XAUUSD).');
    if (!target || target <= 0) problems.push('Set a funding target.');
    if (!min || min < 1) problems.push('Minimum deposit must be at least GH₵1.');
    if (max && max < min) problems.push('Maximum deposit must be higher than the minimum.');
    if (Number(form.ownerFeePercent) > 50) problems.push('Keep your performance fee at 50% or less.');
    if (problems.length) {
      haptics.warning();
      Alert.alert('Check your pie', problems.join('\n'));
      return;
    }

    setBusy(true);
    try {
      const deadline = form.deadlineDays ? new Date(Date.now() + form.deadlineDays * 86400000).toISOString() : undefined;
      const res = await createPie(token, {
        title: form.title.trim(),
        pair: form.pair.trim(),
        market: form.market,
        description: form.description.trim(),
        targetAmount: target,
        minDeposit: min,
        maxDeposit: max || Math.max(target, 5000),
        targetRoiPercent: Number(form.targetRoiPercent) || 20,
        maxLossPercent: Number(form.maxLossPercent) || 10,
        ownerFeePercent: Number(form.ownerFeePercent),
        riskLevel: form.riskLevel,
        fundingDeadline: deadline,
      });
      haptics.success();
      router.replace(`/ptrading/${pieId(res.pie)}`);
    } catch (err) {
      haptics.error();
      Alert.alert('Couldn’t launch pie', err.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Launch a trading pie</Text>
        <Text style={styles.lede}>
          Pool capital from the community for a single trade idea. You earn a performance fee only when the pie closes in profit.
        </Text>

        <Text style={styles.group}>The trade</Text>
        <Input label="Title" value={form.title} onChangeText={set('title')} placeholder="e.g. Gold breakout swing" maxLength={80} />
        <Input
          label="Asset pair"
          value={form.pair}
          onChangeText={(v) => set('pair')(v.toUpperCase())}
          placeholder="e.g. XAUUSD, BTCUSDT"
          autoCapitalize="characters"
          maxLength={20}
        />
        <Text style={styles.label}>Market</Text>
        <Chips options={PIE_MARKETS.filter((m) => m.id !== 'all')} value={form.market} onChange={set('market')} />
        <Input
          label="Strategy"
          value={form.description}
          onChangeText={set('description')}
          placeholder="Your thesis, timeframe and how you’ll manage risk"
          multiline
          maxLength={1200}
        />

        <Text style={styles.group}>Funding</Text>
        <Input label="Funding target" value={form.targetAmount} onChangeText={(v) => set('targetAmount')(numeric(v))} keyboardType="decimal-pad" suffix="GH₵" placeholder="2000" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="Min deposit" value={form.minDeposit} onChangeText={(v) => set('minDeposit')(numeric(v))} keyboardType="decimal-pad" suffix="GH₵" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Max per backer" value={form.maxDeposit} onChangeText={(v) => set('maxDeposit')(numeric(v))} keyboardType="decimal-pad" suffix="GH₵" />
          </View>
        </View>
        <Text style={styles.label}>Funding window</Text>
        <Chips options={DEADLINES} value={form.deadlineDays} onChange={set('deadlineDays')} />

        <Text style={styles.group}>Risk & reward</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="Target ROI" value={form.targetRoiPercent} onChangeText={(v) => set('targetRoiPercent')(numeric(v))} keyboardType="decimal-pad" suffix="%" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Max loss" value={form.maxLossPercent} onChangeText={(v) => set('maxLossPercent')(numeric(v))} keyboardType="decimal-pad" suffix="%" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Your fee" value={form.ownerFeePercent} onChangeText={(v) => set('ownerFeePercent')(numeric(v))} keyboardType="decimal-pad" suffix="%" />
          </View>
        </View>
        <Text style={styles.label}>Risk level</Text>
        <Chips options={PIE_RISK_LEVELS} value={form.riskLevel} onChange={set('riskLevel')} colorFor={(id) => RISK_COLORS[id]} />

        {Number(form.targetAmount) > 0 ? (
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              At a {form.targetRoiPercent || 0}% win on a full {formatCurrency(form.targetAmount)} pool you’d earn about{' '}
              <Text style={{ fontWeight: '800' }}>
                {formatCurrency(
                  ((Number(form.targetAmount) * (Number(form.targetRoiPercent) || 0)) / 100) * ((Number(form.ownerFeePercent) || 0) / 100)
                )}
              </Text>{' '}
              in fees.
            </Text>
          </View>
        ) : null}

        <PrimaryButton label="Launch pie" icon="rocket" onPress={submit} loading={busy} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg },
  heading: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  lede: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  group: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  suffix: { color: colors.muted, fontWeight: '700', marginLeft: 6 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.white },
  preview: { backgroundColor: '#EEF4FF', borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm },
  previewText: { color: colors.navyMid, lineHeight: 20, fontSize: 13 },
});
