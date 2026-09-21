import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import {
  BOOK_CATEGORIES,
  BOOK_TYPES,
  EMPTY_BOOK_FORM,
  bookStatusLabel,
  bookStatusTone,
  createInstructorBook,
  fetchInstructorBook,
  submitInstructorBook,
  updateInstructorBook,
} from '@/utils/instructorBooks';
import { resolveCourseImageUrl } from '@/utils/instructorCourses';
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

export function BookWizard({ bookId, token }) {
  const router = useRouter();
  const isNew = bookId === 'new';
  const [form, setForm] = useState(EMPTY_BOOK_FORM);
  const [listingStatus, setListingStatus] = useState('draft');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (isNew) return undefined;
    let alive = true;
    fetchInstructorBook(token, bookId)
      .then((data) => {
        if (!alive) return;
        setForm(data.form);
        setListingStatus(data.listingStatus);
      })
      .catch((error) => {
        Alert.alert('Could not load book', error.message || 'Try again.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [bookId, isNew, token]);

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploadingThumb(true);
    try {
      const url = await uploadFileToS3({
        uri: result.assets[0].uri,
        token,
        mimeType: result.assets[0].mimeType,
        fileName: result.assets[0].fileName,
      });
      setField('thumbnail', url);
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Could not upload cover.');
    } finally {
      setUploadingThumb(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.author.trim()) return 'Author is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (form.type === 'ebook' && !form.fileUrl.trim() && !isNew) {
      // allow saving draft without file on create - backend may require file on submit
    }
    return '';
  };

  const onSave = async () => {
    const issue = validate();
    if (issue) {
      Alert.alert('Missing details', issue);
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await createInstructorBook(token, form);
        Alert.alert('Saved', 'Book draft created.');
        router.replace(`/creator/books/${created.id}`);
      } else {
        await updateInstructorBook(token, bookId, form);
        Alert.alert('Saved', 'Book updated.');
      }
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async () => {
    const issue = validate();
    if (issue) {
      Alert.alert('Missing details', issue);
      return;
    }
    setSaving(true);
    try {
      let id = bookId;
      if (isNew) {
        const created = await createInstructorBook(token, form);
        id = created.id;
      } else {
        await updateInstructorBook(token, bookId, form);
      }
      await submitInstructorBook(token, id);
      Alert.alert('Submitted', 'Your book was sent for review.', [
        { text: 'OK', onPress: () => router.replace('/creator/books') },
      ]);
    } catch (error) {
      Alert.alert('Submit failed', error.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading book…</Text>
      </View>
    );
  }

  const thumbUri = resolveCourseImageUrl(form.thumbnail);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{isNew ? 'New book' : 'Edit book'}</Text>
          {!isNew ? (
            <Badge label={bookStatusLabel(listingStatus)} tone={bookStatusTone(listingStatus)} />
          ) : null}
        </View>
      </View>

      <Pressable style={styles.coverWrap} onPress={pickThumbnail}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Text style={styles.coverHint}>{uploadingThumb ? 'Uploading…' : 'Add cover image'}</Text>
          </View>
        )}
      </Pressable>

      <Field label="Title" value={form.title} onChangeText={(v) => setField('title', v)} required />
      <Field label="Author" value={form.author} onChangeText={(v) => setField('author', v)} required />
      <Field
        label="Description"
        value={form.description}
        onChangeText={(v) => setField('description', v)}
        multiline
        required
      />
      <Field
        label="What you'll learn"
        value={form.whatYoullLearn}
        onChangeText={(v) => setField('whatYoullLearn', v)}
        multiline
        placeholder="One outcome per line"
      />
      <Field
        label="After reading"
        value={form.afterReadingOutcomes}
        onChangeText={(v) => setField('afterReadingOutcomes', v)}
        multiline
        placeholder="One outcome per line"
      />

      <OptionRow label="Format" options={BOOK_TYPES} value={form.type} onChange={(v) => setField('type', v)} />
      <OptionRow
        label="Category"
        options={BOOK_CATEGORIES}
        value={form.category}
        onChange={(v) => setField('category', v)}
      />

      <Field
        label="Price (GHS)"
        value={form.price}
        onChangeText={(v) => setField('price', v)}
        keyboardType="numeric"
      />

      {form.type === 'ebook' ? (
        <>
          <Field
            label="E-book file URL"
            value={form.fileUrl}
            onChangeText={(v) => setField('fileUrl', v)}
            placeholder="PDF or file URL"
          />
          <Field
            label="Hard copy add-on price"
            value={form.hardcopyPrice}
            onChangeText={(v) => setField('hardcopyPrice', v)}
            keyboardType="numeric"
            placeholder="Optional"
          />
        </>
      ) : (
        <>
          <Field
            label="Stock"
            value={form.stock}
            onChangeText={(v) => setField('stock', v)}
            keyboardType="numeric"
          />
          <Field
            label="Delivery fee"
            value={form.deliveryFee}
            onChangeText={(v) => setField('deliveryFee', v)}
            keyboardType="numeric"
          />
          <Field label="ISBN" value={form.isbn} onChangeText={(v) => setField('isbn', v)} />
        </>
      )}

      <View style={styles.actions}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save draft'}
          variant="secondary"
          onPress={onSave}
          disabled={saving}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          label="Submit for review"
          onPress={onSubmit}
          disabled={saving}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  muted: { color: colors.muted },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  coverWrap: { marginBottom: spacing.md },
  cover: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
  },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  coverHint: { color: colors.muted, fontWeight: '600' },
  field: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase' },
  required: { color: colors.danger },
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
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  optionText: { fontSize: 13, fontWeight: '600', color: colors.text },
  optionTextActive: { color: colors.white },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
