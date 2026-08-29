import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CurriculumBuilder } from '@/components/creator/CurriculumBuilder';
import { WizardStepper } from '@/components/creator/WizardStepper';
import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import {
  COURSE_WIZARD_STEPS,
  EMPTY_SUBSCRIPTION_PRICING,
  countLessons,
  fetchCreatorCourseSettings,
  saveCreatorSubscriptionPricing,
} from '@/utils/courseWizard';
import {
  COURSE_LEVELS,
  COURSE_TYPES,
  EMPTY_COURSE_FORM,
  createInstructorCourse,
  fetchInstructorCourseEditor,
  listingStatusLabel,
  listingStatusTone,
  publishInstructorCourse,
  resolveCourseImageUrl,
  submitInstructorCourse,
  updateInstructorCourse,
} from '@/utils/instructorCourses';
import { uploadFileToS3 } from '@/utils/uploadToS3';

function Field({ label, value, onChangeText, multiline, keyboardType, placeholder, required }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

function OptionRow({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={[styles.optionChip, active && styles.optionChipActive]}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Panel({ title, description, children }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {description ? <Text style={styles.panelDescription}>{description}</Text> : null}
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function ChecklistRow({ done, label }) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkIcon, done && styles.checkIconDone]}>
        <Text style={[styles.checkMark, done && styles.checkMarkDone]}>{done ? '✓' : '○'}</Text>
      </View>
      <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{label}</Text>
    </View>
  );
}

export function CourseWizard({ courseId, token }) {
  const router = useRouter();
  const isNew = !courseId || courseId === 'new';
  const hydratedRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(EMPTY_COURSE_FORM);
  const [subscriptionPricing, setSubscriptionPricing] = useState(EMPTY_SUBSCRIPTION_PRICING);
  const [courseAutoApproval, setCourseAutoApproval] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(isNew ? '' : courseId);
  const [listingStatus, setListingStatus] = useState('draft');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);

  const lessonCount = useMemo(() => countLessons(form.modules), [form.modules]);

  const canEdit =
    listingStatus !== 'under_review' && listingStatus !== 'pending_review';

  const checklist = useMemo(
    () => [
      { done: Boolean(form.title.trim()), label: 'Course title' },
      { done: Boolean(form.description.trim()), label: 'Description' },
      { done: Boolean(form.thumbnail), label: 'Cover image' },
      { done: lessonCount > 0, label: 'At least one lesson' },
    ],
    [form.description, form.thumbnail, form.title, lessonCount]
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const load = useCallback(async () => {
    if (!token || token === 'local') {
      setLoading(false);
      return;
    }

    setError('');
    try {
      const settings = await fetchCreatorCourseSettings(token);
      setCourseAutoApproval(settings.courseAutoApproval);
      setSubscriptionPricing(settings.subscriptionPricing);

      if (!isNew) {
        const editor = await fetchInstructorCourseEditor(token, courseId);
        setForm(editor.form);
        setListingStatus(editor.listingStatus);
        setRejectionReason(editor.rejectionReason);
        setActiveCourseId(editor.id);
        if (
          editor.form.subtitle ||
          editor.form.shortDescription ||
          editor.form.learningOutcomes ||
          editor.form.promoVideo
        ) {
          setShowMoreDetails(true);
        }
      }
      hydratedRef.current = true;
    } catch (loadError) {
      setError(loadError.message || 'Could not load course');
    } finally {
      setLoading(false);
    }
  }, [courseId, isNew, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!hydratedRef.current || !canEdit) return undefined;
    const hasMinimumDraftData = form.title || form.description;
    if (!hasMinimumDraftData) return undefined;

    const timeoutId = setTimeout(() => {
      saveDraft(true);
    }, 1400);

    return () => clearTimeout(timeoutId);
  }, [form, canEdit]);

  const saveSubscriptionPricing = async (silent = true) => {
    try {
      setPricingSaving(true);
      await saveCreatorSubscriptionPricing(token, subscriptionPricing);
      if (!silent) setMessage('Subscription pricing saved.');
      return true;
    } catch (pricingError) {
      if (!silent) setError(pricingError.message || 'Could not save pricing');
      return false;
    } finally {
      setPricingSaving(false);
    }
  };

  const saveDraft = async (silent = false, { includePricing = !silent } = {}) => {
    if (!token || token === 'local' || !canEdit) return null;
    if (!form.title.trim() && silent) return null;

    try {
      setSaving(true);
      setError('');

      if (includePricing) {
        await saveSubscriptionPricing(true);
      }

      const saved = activeCourseId
        ? await updateInstructorCourse(token, activeCourseId, form)
        : await createInstructorCourse(token, form);

      if (!activeCourseId && saved.id) {
        setActiveCourseId(saved.id);
        router.replace(`/creator/courses/${saved.id}`);
      }

      setListingStatus(saved.listingStatus);
      if (!silent) {
        setMessage('Draft saved.');
        Alert.alert('Saved', 'Draft saved.');
      }
      return saved;
    } catch (saveError) {
      const msg = saveError.message || 'Could not save course';
      setError(msg);
      if (!silent) Alert.alert('Save failed', msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async (action = 'submit') => {
    if (!token || token === 'local') return;
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Give your course a title before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const saved = await saveDraft(true, { includePricing: true });
      const targetId = saved?.id || activeCourseId;
      if (!targetId) {
        setError('Save the course first before submitting.');
        return;
      }

      const result =
        action === 'publish'
          ? await publishInstructorCourse(token, targetId)
          : await submitInstructorCourse(token, targetId);

      const nextStatus =
        result.course?.listingStatus ||
        result.listingStatus ||
        (action === 'publish' ? 'published' : 'under_review');
      setListingStatus(nextStatus);
      const msg = result.message || (action === 'publish' ? 'Course published.' : 'Submitted for review.');
      setMessage(msg);
      Alert.alert('Success', msg);
    } catch (submitError) {
      const msg = submitError.message || 'Could not submit course';
      setError(msg);
      Alert.alert('Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pickCoverImage = async () => {
    if (!token || token === 'local') return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    try {
      setError('');
      setThumbnailProgress(1);
      const url = await uploadFileToS3({
        uri: asset.uri,
        token,
        type: 'image',
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        onProgress: setThumbnailProgress,
      });
      updateField('thumbnail', url);
      setMessage('Cover image uploaded.');
    } catch (uploadError) {
      setError(uploadError.message || 'Cover upload failed');
    } finally {
      setThumbnailProgress(0);
    }
  };

  const coverUrl = resolveCourseImageUrl(form.thumbnail);
  const stepMeta = COURSE_WIZARD_STEPS[currentStep - 1];

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading course studio…</Text>
      </View>
    );
  }

  let stepContent = null;

  if (currentStep === 1) {
    stepContent = (
      <View style={styles.stepStack}>
        <Panel title="Course details" description="Only a title is required to save. Add more to help students find your course.">
          <Field
            label="Title"
            value={form.title}
            onChangeText={(v) => updateField('title', v)}
            placeholder="e.g. Forex price action for beginners"
            required
          />
          <OptionRow
            label="Track"
            options={COURSE_TYPES}
            value={form.courseType}
            onChange={(v) => {
              updateField('courseType', v);
              if (!form.category) updateField('category', v);
            }}
          />
          <OptionRow label="Level" options={COURSE_LEVELS} value={form.level} onChange={(v) => updateField('level', v)} />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(v) => updateField('description', v)}
            multiline
            placeholder="What will students learn?"
          />
        </Panel>

        <Panel title="Cover image" description="Optional, but helps your course stand out.">
          <PrimaryButton
            label={
              thumbnailProgress > 0
                ? `Uploading ${thumbnailProgress}%`
                : form.thumbnail
                  ? 'Replace cover image'
                  : 'Upload cover image'
            }
            variant="secondary"
            onPress={pickCoverImage}
            loading={thumbnailProgress > 0}
          />
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : null}
        </Panel>

        <Pressable onPress={() => setShowMoreDetails((open) => !open)}>
          <Text style={styles.link}>{showMoreDetails ? 'Hide optional details' : 'Add optional details'}</Text>
        </Pressable>

        {showMoreDetails ? (
          <Panel title="Optional extras" description="Skip these if you want — you can add them later.">
            <Field label="Subtitle" value={form.subtitle} onChangeText={(v) => updateField('subtitle', v)} placeholder="Short tagline" />
            <Field
              label="Short description"
              value={form.shortDescription}
              onChangeText={(v) => updateField('shortDescription', v)}
              multiline
              placeholder="One or two punchy sentences"
            />
            <Field
              label="What students will learn (one per line)"
              value={form.learningOutcomes}
              onChangeText={(v) => updateField('learningOutcomes', v)}
              multiline
              placeholder={'Read charts with confidence\nBuild a simple trading plan'}
            />
            <Field
              label="Requirements (one per line)"
              value={form.requirements}
              onChangeText={(v) => updateField('requirements', v)}
              multiline
              placeholder="Basic computer skills"
            />
            <Field
              label="Target audience (one per line)"
              value={form.targetAudience}
              onChangeText={(v) => updateField('targetAudience', v)}
              multiline
              placeholder="Beginner traders"
            />
            <Field
              label="Skills gained (one per line)"
              value={form.skillsGained}
              onChangeText={(v) => updateField('skillsGained', v)}
              multiline
              placeholder="Risk management"
            />
            <Field
              label="Promo video URL"
              value={form.promoVideo}
              onChangeText={(v) => updateField('promoVideo', v)}
              placeholder="https://..."
            />
            <Field label="Category" value={form.category} onChangeText={(v) => updateField('category', v)} placeholder="e.g. Trading" />
            <Field label="Subcategory" value={form.subcategory} onChangeText={(v) => updateField('subcategory', v)} placeholder="Optional" />
            <Field label="Language" value={form.language} onChangeText={(v) => updateField('language', v)} />
          </Panel>
        ) : null}

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            Next you&apos;ll set Basic / Premium / Diamond subscription prices for access to your courses.
          </Text>
        </View>
      </View>
    );
  } else if (currentStep === 2) {
    stepContent = (
      <Panel
        title="Subscription plan pricing"
        description="Set prices for Basic, Premium, and Diamond. Each plan unlocks different features.">
        <Field
          label="Basic — 1 month · videos only (GHS)"
          value={subscriptionPricing.basic}
          onChangeText={(v) => setSubscriptionPricing((cur) => ({ ...cur, basic: v }))}
          keyboardType="number-pad"
        />
        <Field
          label="Premium — 3 months · community, offline, signals (GHS)"
          value={subscriptionPricing.premium}
          onChangeText={(v) => setSubscriptionPricing((cur) => ({ ...cur, premium: v }))}
          keyboardType="number-pad"
        />
        <Field
          label="Diamond — 1 year · mentorship (GHS)"
          value={subscriptionPricing.diamond}
          onChangeText={(v) => setSubscriptionPricing((cur) => ({ ...cur, diamond: v }))}
          keyboardType="number-pad"
        />

        <View style={styles.previewGrid}>
          {[
            { label: 'Basic', value: subscriptionPricing.basic, note: 'Videos only · 1 mo' },
            { label: 'Premium', value: subscriptionPricing.premium, note: 'Full access · 3 mo' },
            { label: 'Diamond', value: subscriptionPricing.diamond, note: 'Mentorship · 1 yr' },
          ].map((item) => (
            <View key={item.label} style={styles.previewCard}>
              <Text style={styles.previewLabel}>{item.label}</Text>
              <Text style={styles.previewPrice}>
                GH₵{Number(item.value || 0).toLocaleString('en-GH', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.previewNote}>{item.note}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.pricingHint}>
          Saved to your creator profile and used at checkout and on your public page.
        </Text>
        <PrimaryButton
          label={pricingSaving ? 'Saving…' : 'Save prices'}
          onPress={() => saveSubscriptionPricing(false)}
          loading={pricingSaving}
          style={styles.inlineBtn}
        />

        <View style={styles.divider} />
        <Text style={styles.subSectionTitle}>Course listing (optional)</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Free course listing</Text>
          <Switch
            value={form.pricingType === 'free'}
            onValueChange={(free) => {
              updateField('pricingType', free ? 'free' : 'paid');
              if (free) updateField('price', '0');
            }}
            trackColor={{ true: colors.primary }}
          />
        </View>
        {form.pricingType === 'paid' ? (
          <>
            <Field
              label="Listing price (GHS)"
              value={form.price}
              onChangeText={(v) => updateField('price', v)}
              keyboardType="decimal-pad"
            />
            <Field
              label="Discount price (optional)"
              value={form.discountPrice}
              onChangeText={(v) => updateField('discountPrice', v)}
              keyboardType="decimal-pad"
            />
          </>
        ) : null}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Certificate enabled</Text>
          <Switch
            value={form.certificateEnabled}
            onValueChange={(v) => updateField('certificateEnabled', v)}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </Panel>
    );
  } else if (currentStep === 3) {
    stepContent = (
      <View style={styles.stepStack}>
        <Text style={styles.stepIntro}>Add modules and lessons. You can start with one video and expand later.</Text>
        <CurriculumBuilder
          value={form.modules}
          authToken={token}
          onChange={(modules) => updateField('modules', modules)}
        />
      </View>
    );
  } else {
    stepContent = (
      <View style={styles.stepStack}>
        <Panel title="Preview" description="Quick check before you submit.">
          {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.reviewCover} resizeMode="cover" /> : null}
          <View style={styles.reviewMeta}>
            <Badge label={listingStatusLabel(listingStatus)} tone={listingStatusTone(listingStatus)} />
            <Text style={styles.reviewChip}>{lessonCount} lessons</Text>
            <Text style={styles.reviewChip}>{form.level}</Text>
            <Text style={styles.reviewChip}>{form.courseType}</Text>
          </View>
          <Text style={styles.reviewTitle}>{form.title || 'Untitled course'}</Text>
          {form.subtitle ? <Text style={styles.reviewSubtitle}>{form.subtitle}</Text> : null}
          <Text style={styles.reviewDescription}>{form.description || 'No description yet.'}</Text>
          <View style={styles.previewGrid}>
            {[
              { label: 'Basic', value: subscriptionPricing.basic },
              { label: 'Premium', value: subscriptionPricing.premium },
              { label: 'Diamond', value: subscriptionPricing.diamond },
            ].map((item) => (
              <View key={item.label} style={styles.previewCard}>
                <Text style={styles.previewLabel}>{item.label} access</Text>
                <Text style={styles.previewPrice}>
                  GH₵{Number(item.value || 0).toLocaleString('en-GH', { maximumFractionDigits: 0 })}
                </Text>
              </View>
            ))}
          </View>
        </Panel>

        <Panel title="Publish" description="Save anytime. Submit when ready.">
          <View style={styles.publishActions}>
            <PrimaryButton label="Save as draft" variant="secondary" onPress={() => saveDraft(false)} loading={saving} />
            <PrimaryButton
              label={submitting ? 'Processing…' : 'Submit for review'}
              onPress={() => submitForReview('submit')}
              loading={submitting}
              disabled={!form.title.trim()}
            />
            {courseAutoApproval ? (
              <PrimaryButton
                label="Publish now"
                onPress={() => submitForReview('publish')}
                loading={submitting}
                disabled={!form.title.trim()}
              />
            ) : null}
          </View>
        </Panel>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Course studio</Text>
        <Text style={styles.heroTitle}>{activeCourseId ? 'Edit course' : 'Create a course'}</Text>
        <Text style={styles.heroSubtitle}>Basics, pricing, curriculum, then publish.</Text>
        <View style={styles.heroActions}>
          <Badge label={listingStatusLabel(listingStatus)} tone={listingStatusTone(listingStatus)} />
          <PrimaryButton label={saving ? 'Saving…' : 'Save draft'} onPress={() => saveDraft(false)} loading={saving} style={styles.heroBtn} />
        </View>
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {rejectionReason ? (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectTitle}>Review feedback</Text>
          <Text style={styles.rejectText}>{rejectionReason}</Text>
        </View>
      ) : null}

      {!canEdit ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>This course is under review and cannot be edited right now.</Text>
        </View>
      ) : null}

      <WizardStepper steps={COURSE_WIZARD_STEPS} currentStep={currentStep} onStepSelect={setCurrentStep} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <View>
            <Text style={styles.stepCount}>
              Step {currentStep} of {COURSE_WIZARD_STEPS.length}
            </Text>
            <Text style={styles.stepTitle}>{stepMeta.label}</Text>
          </View>
          <Text style={styles.stepDescription}>{stepMeta.description}</Text>
        </View>

        {stepContent}

        <Panel title="Quick checklist" description="Nice to have — only title is required to submit.">
          {checklist.map((item) => (
            <ChecklistRow key={item.label} done={item.done} label={item.label} />
          ))}
        </Panel>

        {canEdit ? (
          <View style={styles.navRow}>
            <PrimaryButton
              label="Back"
              variant="secondary"
              onPress={() => setCurrentStep((step) => Math.max(step - 1, 1))}
              disabled={currentStep === 1}
              style={styles.navBtn}
            />
            {currentStep < COURSE_WIZARD_STEPS.length ? (
              <PrimaryButton
                label="Continue"
                onPress={async () => {
                  if (currentStep === 2) {
                    await saveSubscriptionPricing(true);
                  }
                  setCurrentStep((step) => Math.min(step + 1, COURSE_WIZARD_STEPS.length));
                }}
                style={styles.navBtn}
              />
            ) : (
              <PrimaryButton
                label={submitting ? 'Processing…' : 'Submit for review'}
                onPress={() => submitForReview('submit')}
                loading={submitting}
                disabled={!form.title.trim()}
                style={styles.navBtn}
              />
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  muted: { color: colors.muted },
  hero: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.white },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm },
  heroBtn: { paddingHorizontal: spacing.lg },
  success: { color: '#BFF0CE', fontSize: 13, fontWeight: '600' },
  error: { color: '#FFD0D0', fontSize: 13, fontWeight: '600' },
  rejectBox: { margin: spacing.lg, marginBottom: 0, backgroundColor: '#FDECEC', borderRadius: radii.md, padding: spacing.md },
  rejectTitle: { fontWeight: '800', color: colors.danger, fontSize: 13 },
  rejectText: { marginTop: 4, color: colors.text, fontSize: 13, lineHeight: 19 },
  notice: { margin: spacing.lg, marginBottom: 0, backgroundColor: '#FFF7E6', borderRadius: radii.md, padding: spacing.md },
  noticeText: { color: colors.warning, fontSize: 13, lineHeight: 19 },
  scrollView: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stepCount: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  stepTitle: { marginTop: 4, fontSize: 20, fontWeight: '800', color: colors.text },
  stepDescription: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.muted,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  stepStack: { gap: spacing.md },
  stepIntro: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  panelTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  panelDescription: { marginTop: 4, fontSize: 13, color: colors.muted, lineHeight: 18 },
  panelBody: { marginTop: spacing.sm, gap: spacing.sm },
  field: { marginBottom: spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  required: { color: colors.danger },
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
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  optionTextActive: { color: colors.white },
  coverImage: { marginTop: spacing.sm, width: '100%', height: 180, borderRadius: radii.lg },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  hintBox: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  hintText: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  previewCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  previewLabel: { fontSize: 11, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },
  previewPrice: { marginTop: 6, fontSize: 20, fontWeight: '800', color: colors.text },
  previewNote: { marginTop: 4, fontSize: 11, color: colors.muted },
  pricingHint: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  inlineBtn: { alignSelf: 'flex-start' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  subSectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, paddingRight: spacing.md },
  reviewCover: { width: '100%', height: 200, borderRadius: radii.lg },
  reviewMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  reviewChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    overflow: 'hidden',
  },
  reviewTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  reviewSubtitle: { marginTop: 4, fontSize: 14, color: colors.muted },
  reviewDescription: { marginTop: spacing.sm, fontSize: 14, color: colors.muted, lineHeight: 22 },
  publishActions: { gap: spacing.sm },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconDone: { backgroundColor: '#D1FAE5' },
  checkMark: { fontWeight: '800', color: colors.muted, fontSize: 14 },
  checkMarkDone: { color: colors.success },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.muted },
  checkLabelDone: { color: colors.text },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  navBtn: { flex: 1 },
});
