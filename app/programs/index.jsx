import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CreatorStatusBadge, WizardStepper } from '@/components/creator/CreatorOnboardingParts';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useCreatorAccess } from '@/hooks/useCreatorAccess';
import {
  buildCreatorSummary,
  CREATOR_STEPS,
  creatorStatusLabel,
  EMPTY_CREATOR_FORM,
  fetchCreatorProfile,
  hasSubmittedCreatorApplication,
  saveCreatorAccount,
  saveCreatorProfileDraft,
  submitCreatorApplication,
} from '@/utils/creator';

function Field({ label, value, onChangeText, editable = true, keyboardType, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, !editable && styles.inputDisabled, multiline && styles.textarea]}
      />
    </View>
  );
}

function SummaryCard({ item }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{item.label}</Text>
      <Text style={styles.summaryValue}>{item.value}</Text>
    </View>
  );
}

export default function CreatorProgramsScreen() {
  const router = useRouter();
  const { token, updateUser } = useAppState();
  const { approved, applied, user } = useCreatorAccess();
  const [form, setForm] = useState(EMPTY_CREATOR_FORM);
  const [creatorStatus, setCreatorStatus] = useState('not_applied');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const hydratedRef = useRef(false);

  const submitted = hasSubmittedCreatorApplication({ creatorStatus }) || applied;
  const showEnrolledView = (submitted || approved) && !editing;

  const summary = useMemo(() => buildCreatorSummary(form), [form]);

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const data = await fetchCreatorProfile(token);
      setForm(data.form);
      setCreatorStatus(data.creatorStatus);
      if (data.user) await updateUser(data.user);
      hydratedRef.current = true;
    } catch (loadError) {
      setError(loadError.message || 'Could not load creator profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, updateUser]);

  useEffect(() => {
    load();
  }, [load]);

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!token || token === 'local') return;
      try {
        setSaving(true);
        setError('');
        const [accountRes] = await Promise.all([
          saveCreatorAccount(token, form),
          saveCreatorProfileDraft(token, form),
        ]);
        if (accountRes?.user) await updateUser(accountRes.user);
        if (!silent) setMessage('Draft saved');
      } catch (saveError) {
        setError(saveError.message || 'Could not save draft');
      } finally {
        setSaving(false);
      }
    },
    [form, token, updateUser]
  );

  useEffect(() => {
    if (!hydratedRef.current || !token || token === 'local' || showEnrolledView) return undefined;
    const timeoutId = setTimeout(() => saveDraft(true), 1200);
    return () => clearTimeout(timeoutId);
  }, [form, saveDraft, showEnrolledView, token]);

  const onSubmit = async () => {
    if (!token || token === 'local') {
      Alert.alert('Sign in required', 'Sign in to apply as a creator.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await saveDraft(true);
      const data = await submitCreatorApplication(token);
      if (data.user) await updateUser(data.user);
      setCreatorStatus(data.user?.creatorStatus || 'pending');
      setMessage(data.message || 'Application submitted');
      setEditing(false);
    } catch (submitError) {
      setError(submitError.message || 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Creator onboarding' }} />
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading your creator workspace...</Text>
      </View>
    );
  }

  if (!token || token === 'local') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Creator onboarding' }} />
        <Text style={styles.loadingText}>Sign in to apply as a creator on QuickX Learn.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Creator onboarding' }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        <LinearGradient colors={['#1B5EF5', '#1246C4']} style={styles.hero}>
          <Text style={styles.heroEyebrow}>Creator onboarding</Text>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Become a tutor on QuickX</Text>
              <Text style={styles.heroBody}>
                {showEnrolledView
                  ? approved
                    ? 'You’re an approved creator. Your application details are below.'
                    : 'Your creator application has been submitted. We’ll notify you when it’s reviewed.'
                  : 'Build your instructor profile and apply for free — no program purchase required.'}
              </Text>
            </View>
            <CreatorStatusBadge status={creatorStatus} />
          </View>
        </LinearGradient>

        {message ? <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View> : null}
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        {showEnrolledView ? (
          <View style={styles.panel}>
            <View style={styles.panelTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle}>Your creator application</Text>
                <Text style={styles.panelHint}>
                  Status: {creatorStatusLabel(creatorStatus)}
                </Text>
              </View>
              {!approved ? (
                <Pressable onPress={() => setEditing(true)}>
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.summaryGrid}>
              {summary.map((item) => (
                <SummaryCard key={item.label} item={item} />
              ))}
            </View>

            {form.bio ? (
              <View style={styles.bioCard}>
                <Text style={styles.summaryLabel}>Bio</Text>
                <Text style={styles.summaryValue}>{form.bio}</Text>
              </View>
            ) : null}

            {approved ? (
              <PrimaryButton
                label="Manage my courses"
                onPress={() => router.push('/creator/courses')}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
          </View>
        ) : (
          <>
            <WizardStepper steps={CREATOR_STEPS} currentStep={currentStep} />

            <View style={styles.panel}>
              <View style={styles.panelTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelTitle}>{CREATOR_STEPS[currentStep - 1].label}</Text>
                  <Text style={styles.panelHint}>{CREATOR_STEPS[currentStep - 1].description}</Text>
                </View>
                <PrimaryButton
                  label={saving ? 'Saving...' : 'Save draft'}
                  variant="secondary"
                  onPress={() => saveDraft(false)}
                  disabled={saving}
                  style={styles.saveBtn}
                />
              </View>

              {currentStep === 1 ? (
                <View style={styles.form}>
                  <Field label="Full name" value={form.fullName} onChangeText={(v) => updateField('fullName', v)} />
                  <Field label="Email" value={form.email} editable={false} />
                  <Field label="Phone number" value={form.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />
                  <Field label="Country" value={form.country} onChangeText={(v) => updateField('country', v)} />
                </View>
              ) : null}

              {currentStep === 2 ? (
                <View style={styles.form}>
                  <Field label="Professional headline" value={form.headline} onChangeText={(v) => updateField('headline', v)} />
                  <Field label="Bio / about instructor" value={form.bio} onChangeText={(v) => updateField('bio', v)} multiline />
                  <Field label="Areas of expertise" value={form.expertise} onChangeText={(v) => updateField('expertise', v)} />
                  <Field label="Years of experience" value={form.experienceYears} onChangeText={(v) => updateField('experienceYears', v)} keyboardType="number-pad" />
                  <Field label="Languages spoken" value={form.languages} onChangeText={(v) => updateField('languages', v)} />
                  <Field label="Website (optional)" value={form.website} onChangeText={(v) => updateField('website', v)} />
                  <Field label="YouTube (optional)" value={form.youtube} onChangeText={(v) => updateField('youtube', v)} />
                </View>
              ) : null}

              {currentStep === 3 ? (
                <View style={styles.form}>
                  <Field label="Categories you want to teach in" value={form.teachingCategories} onChangeText={(v) => updateField('teachingCategories', v)} />
                  <Field label="Preferred course language" value={form.preferredCourseLanguage} onChangeText={(v) => updateField('preferredCourseLanguage', v)} />
                  <ToggleRow label="Offer free courses" value={form.teachesFreeCourses} onValueChange={(v) => updateField('teachesFreeCourses', v)} />
                  <ToggleRow label="Offer paid courses" value={form.teachesPaidCourses} onValueChange={(v) => updateField('teachesPaidCourses', v)} />
                  <ToggleRow label="Offer mentorship" value={form.offersMentorship} onValueChange={(v) => updateField('offersMentorship', v)} />
                </View>
              ) : null}

              {currentStep === 4 ? (
                <View style={styles.form}>
                  <Text style={styles.reviewIntro}>
                    Once you submit, your application can be approved, rejected, or suspended by the admin team.
                  </Text>
                  <View style={styles.summaryGrid}>
                    {summary.map((item) => (
                      <SummaryCard key={item.label} item={item} />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.actions}>
                <PrimaryButton
                  label="Back"
                  variant="secondary"
                  onPress={() => setCurrentStep((step) => Math.max(step - 1, 1))}
                  disabled={currentStep === 1}
                  style={styles.actionBtn}
                />
                {currentStep < CREATOR_STEPS.length ? (
                  <PrimaryButton
                    label="Continue"
                    onPress={() => setCurrentStep((step) => Math.min(step + 1, CREATOR_STEPS.length))}
                    style={[styles.actionBtn, { flex: 1 }]}
                  />
                ) : (
                  <PrimaryButton
                    label={submitting ? 'Submitting...' : 'Submit tutor application'}
                    onPress={onSubmit}
                    loading={submitting}
                    style={[styles.actionBtn, { flex: 1 }]}
                  />
                )}
              </View>

              {submitted && editing ? (
                <Pressable onPress={() => setEditing(false)} style={styles.cancelEdit}>
                  <Text style={styles.link}>Cancel editing</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ToggleRow({ label, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: spacing.xxxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  loadingText: { marginTop: spacing.md, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  hero: {
    margin: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTop: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroBody: {
    marginTop: spacing.sm,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  panelTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  panelTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  panelHint: { marginTop: 4, fontSize: 13, color: colors.muted, lineHeight: 18 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 12, minWidth: 96 },
  form: { gap: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  inputDisabled: { opacity: 0.7 },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, paddingRight: spacing.md },
  reviewIntro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  summaryGrid: { gap: spacing.sm },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  summaryLabel: { fontSize: 12, color: colors.muted },
  summaryValue: { marginTop: 6, fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  bioCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  approvedNote: {
    marginTop: spacing.lg,
    backgroundColor: '#EEF4FF',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  approvedNoteText: { color: colors.navyMid, fontSize: 13, lineHeight: 19 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionBtn: { minWidth: 96 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  cancelEdit: { alignItems: 'center', marginTop: spacing.md },
  messageBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: '#E8F8EE',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  messageText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  errorBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: '#FDECEC',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
