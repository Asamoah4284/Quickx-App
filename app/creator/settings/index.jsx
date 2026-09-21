import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CreatorStatusBadge } from '@/components/creator/CreatorOnboardingParts';
import { CreatorAccessGate, CreatorHubNav } from '@/components/creator/CreatorHubNav';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import {
  creatorStatusLabel,
  fetchCreatorProfile,
  saveCreatorProfileDraft,
} from '@/utils/creator';

function Field({ label, value, onChangeText, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export default function CreatorSettingsScreen() {
  const router = useRouter();
  const { token, updateUser } = useAppState();
  const { approved, syncing, refresh, user } = useCreatorAccess();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setForm(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchCreatorProfile(token);
      setForm(data.form);
      if (data.user) updateUser(data.user);
    } catch {
      setForm(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, updateUser]);

  useEffect(() => {
    if (syncing) return;
    load();
  }, [load, syncing]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await saveCreatorProfileDraft(token, form);
      await refresh();
      Alert.alert('Saved', 'Creator profile updated.');
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <CreatorHubNav />
      <CreatorAccessGate approved={approved} syncing={syncing} fallbackTitle="Creator profile">
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refresh().finally(() => load());
              }}
            />
          }>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : form ? (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Creator status</Text>
                <CreatorStatusBadge status={user?.creatorStatus} />
              </View>
              <Text style={styles.statusHint}>{creatorStatusLabel(user?.creatorStatus)}</Text>

              <Field label="Headline" value={form.headline} onChangeText={(v) => setField('headline', v)} />
              <Field label="Bio" value={form.bio} onChangeText={(v) => setField('bio', v)} multiline />
              <Field label="Expertise" value={form.expertise} onChangeText={(v) => setField('expertise', v)} />
              <Field
                label="Teaching categories"
                value={form.teachingCategories}
                onChangeText={(v) => setField('teachingCategories', v)}
              />
              <Field label="Languages" value={form.languages} onChangeText={(v) => setField('languages', v)} />
              <Field label="Website" value={form.website} onChangeText={(v) => setField('website', v)} />
              <Field label="YouTube" value={form.youtube} onChangeText={(v) => setField('youtube', v)} />

              <PrimaryButton label={saving ? 'Saving…' : 'Save profile'} onPress={onSave} disabled={saving} />
              <PrimaryButton
                label="View full application"
                variant="secondary"
                onPress={() => router.push('/programs')}
                style={{ marginTop: spacing.sm }}
              />
            </>
          ) : (
            <Text style={styles.error}>Could not load creator profile.</Text>
          )}
        </ScrollView>
      </CreatorAccessGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  statusLabel: { fontWeight: '700', color: colors.text },
  statusHint: { color: colors.muted, marginBottom: spacing.lg, textTransform: 'capitalize' },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
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
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  error: { color: colors.danger },
});
