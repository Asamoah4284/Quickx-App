import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radii, spacing } from '@/constants/theme';
import {
  LESSON_TYPES,
  countLessons,
  createLesson,
  createSection,
  reindexModules,
} from '@/utils/courseWizard';
import { uploadFileToS3 } from '@/utils/uploadToS3';

function getLessonContentKey(type) {
  switch (type) {
    case 'pdf':
      return 'pdfUrl';
    case 'text':
      return 'textContent';
    case 'resource':
      return 'resourceUrl';
    case 'video':
    default:
      return 'videoUrl';
  }
}

function getLessonContentLabel(type) {
  switch (type) {
    case 'pdf':
      return 'PDF URL';
    case 'text':
      return 'Lesson notes';
    case 'resource':
      return 'Resource URL';
    case 'video':
    default:
      return 'Video URL';
  }
}

function reindex(items) {
  return (items || []).map((item, index) => ({ ...item, order: index + 1 }));
}

function countSections(modules) {
  return (modules || []).reduce((total, mod) => total + (mod.sections || []).length, 0);
}

function lessonUploadKey(moduleIndex, sectionIndex, lessonIndex) {
  return `${moduleIndex}-${sectionIndex}-${lessonIndex}`;
}

function Field({ label, value, onChangeText, multiline, placeholder }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function CurriculumBuilder({ value, onChange, authToken }) {
  const modules = Array.isArray(value) ? value : [];
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState({});

  const updateModules = (nextModules) => onChange(reindexModules(nextModules));

  const addModule = () => {
    updateModules([
      ...modules,
      {
        title: '',
        description: '',
        level: 'beginner',
        price: 0,
        order: modules.length + 1,
        sections: [createSection()],
      },
    ]);
  };

  const updateModule = (moduleIndex, patch) => {
    updateModules(modules.map((mod, index) => (index === moduleIndex ? { ...mod, ...patch } : mod)));
  };

  const removeModule = (moduleIndex) => {
    Alert.alert('Remove module', 'Delete this module and all its lessons?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => updateModules(modules.filter((_, index) => index !== moduleIndex)),
      },
    ]);
  };

  const moveModule = (moduleIndex, direction) => {
    const nextIndex = moduleIndex + direction;
    if (nextIndex < 0 || nextIndex >= modules.length) return;
    const next = [...modules];
    [next[moduleIndex], next[nextIndex]] = [next[nextIndex], next[moduleIndex]];
    updateModules(next);
  };

  const addSection = (moduleIndex) => {
    const mod = modules[moduleIndex];
    updateModule(moduleIndex, {
      sections: [...(mod.sections || []), createSection((mod.sections || []).length)],
    });
  };

  const updateSection = (moduleIndex, sectionIndex, patch) => {
    const mod = modules[moduleIndex];
    const sections = reindex(
      (mod.sections || []).map((section, index) =>
        index === sectionIndex ? { ...section, ...patch } : section
      )
    );
    updateModule(moduleIndex, { sections });
  };

  const removeSection = (moduleIndex, sectionIndex) => {
    const mod = modules[moduleIndex];
    updateModule(moduleIndex, {
      sections: reindex((mod.sections || []).filter((_, index) => index !== sectionIndex)),
    });
  };

  const moveSection = (moduleIndex, sectionIndex, direction) => {
    const mod = modules[moduleIndex];
    const sections = [...(mod.sections || [])];
    const nextIndex = sectionIndex + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    [sections[sectionIndex], sections[nextIndex]] = [sections[nextIndex], sections[sectionIndex]];
    updateModule(moduleIndex, { sections: reindex(sections) });
  };

  const addLesson = (moduleIndex, sectionIndex) => {
    const section = (modules[moduleIndex].sections || [])[sectionIndex];
    const lessons = [...(section.lessons || []), createLesson((section.lessons || []).length)];
    updateSection(moduleIndex, sectionIndex, { lessons });
  };

  const updateLesson = (moduleIndex, sectionIndex, lessonIndex, patch) => {
    const section = (modules[moduleIndex].sections || [])[sectionIndex];
    const lessons = reindex(
      (section.lessons || []).map((lesson, index) =>
        index === lessonIndex ? { ...lesson, ...patch } : lesson
      )
    );
    updateSection(moduleIndex, sectionIndex, { lessons });
  };

  const removeLesson = (moduleIndex, sectionIndex, lessonIndex) => {
    const section = (modules[moduleIndex].sections || [])[sectionIndex];
    updateSection(moduleIndex, sectionIndex, {
      lessons: reindex((section.lessons || []).filter((_, index) => index !== lessonIndex)),
    });
  };

  const moveLesson = (moduleIndex, sectionIndex, lessonIndex, direction) => {
    const section = (modules[moduleIndex].sections || [])[sectionIndex];
    const lessons = [...(section.lessons || [])];
    const nextIndex = lessonIndex + direction;
    if (nextIndex < 0 || nextIndex >= lessons.length) return;
    [lessons[lessonIndex], lessons[nextIndex]] = [lessons[nextIndex], lessons[lessonIndex]];
    updateSection(moduleIndex, sectionIndex, { lessons: reindex(lessons) });
  };

  const uploadLessonVideo = async (moduleIndex, sectionIndex, lessonIndex) => {
    const key = lessonUploadKey(moduleIndex, sectionIndex, lessonIndex);
    if (!authToken) {
      setUploadError((prev) => ({ ...prev, [key]: 'Sign in required to upload video.' }));
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload lesson videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const name = (asset.fileName || asset.uri || '').toLowerCase();
    const mime = (asset.mimeType || '').toLowerCase();
    const isMov = name.endsWith('.mov') || mime === 'video/quicktime';
    if (isMov) {
      setUploadError((prev) => ({
        ...prev,
        [key]: 'Use MP4 or WebM. MOV files may not play in all browsers.',
      }));
      return;
    }

    try {
      setUploadError((prev) => ({ ...prev, [key]: '' }));
      setUploadProgress((prev) => ({ ...prev, [key]: 1 }));
      const url = await uploadFileToS3({
        uri: asset.uri,
        token: authToken,
        type: 'video',
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        onProgress: (pct) => setUploadProgress((prev) => ({ ...prev, [key]: pct })),
      });
      updateLesson(moduleIndex, sectionIndex, lessonIndex, {
        videoUrl: url,
        type: 'video',
        lessonType: 'video',
      });
    } catch (err) {
      setUploadError((prev) => ({ ...prev, [key]: err.message || 'Upload failed' }));
    } finally {
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const moduleCount = modules.length;
  const sectionCount = countSections(modules);
  const lessonCount = countLessons(modules);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Curriculum</Text>
          <Text style={styles.subtitle}>Add modules, sections, and lessons for your course.</Text>
        </View>
        <PrimaryButton label="Add module" onPress={addModule} style={styles.addBtn} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Modules</Text>
          <Text style={styles.statValue}>{moduleCount}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Sections</Text>
          <Text style={styles.statValue}>{sectionCount}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Lessons</Text>
          <Text style={styles.statValue}>{lessonCount}</Text>
        </View>
      </View>

      {modules.map((mod, moduleIndex) => {
        const sections = mod.sections || [];
        const modLessonCount = sections.reduce((sum, s) => sum + (s.lessons || []).length, 0);

        return (
          <View key={mod._id || `module-${moduleIndex}`} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleBadge}>Module {moduleIndex + 1}</Text>
              <View style={styles.moveRow}>
                <Pressable onPress={() => moveModule(moduleIndex, -1)} style={styles.iconBtn}>
                  <Text style={styles.iconBtnText}>↑</Text>
                </Pressable>
                <Pressable onPress={() => moveModule(moduleIndex, 1)} style={styles.iconBtn}>
                  <Text style={styles.iconBtnText}>↓</Text>
                </Pressable>
                <Pressable onPress={() => removeModule(moduleIndex)} style={[styles.iconBtn, styles.dangerBtn]}>
                  <Text style={[styles.iconBtnText, styles.dangerText]}>×</Text>
                </Pressable>
              </View>
            </View>

            <Field
              label="Module title"
              value={mod.title}
              onChangeText={(v) => updateModule(moduleIndex, { title: v })}
              placeholder="e.g. Getting started"
            />
            <Field
              label="Module description"
              value={mod.description}
              onChangeText={(v) => updateModule(moduleIndex, { description: v })}
              multiline
              placeholder="What students will achieve in this module"
            />
            <Text style={styles.meta}>{sections.length} sections · {modLessonCount} lessons</Text>

            {sections.map((section, sectionIndex) => (
              <View key={section._id || `section-${moduleIndex}-${sectionIndex}`} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionBadge}>Section {sectionIndex + 1}</Text>
                  <View style={styles.moveRow}>
                    <Pressable onPress={() => moveSection(moduleIndex, sectionIndex, -1)} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>↑</Text>
                    </Pressable>
                    <Pressable onPress={() => moveSection(moduleIndex, sectionIndex, 1)} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>↓</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removeSection(moduleIndex, sectionIndex)}
                      style={[styles.iconBtn, styles.dangerBtn]}>
                      <Text style={[styles.iconBtnText, styles.dangerText]}>×</Text>
                    </Pressable>
                  </View>
                </View>

                <Field
                  label="Section title"
                  value={section.title}
                  onChangeText={(v) => updateSection(moduleIndex, sectionIndex, { title: v })}
                  placeholder="Section title"
                />

                {(section.lessons || []).map((lesson, lessonIndex) => {
                  const lessonType = lesson.lessonType || lesson.type || 'video';
                  const contentKey = getLessonContentKey(lessonType);
                  const uploadKey = lessonUploadKey(moduleIndex, sectionIndex, lessonIndex);
                  const progress = uploadProgress[uploadKey];

                  return (
                    <View key={lesson._id || `lesson-${lessonIndex}`} style={styles.lessonCard}>
                      <View style={styles.lessonHeader}>
                        <Text style={styles.lessonBadge}>Lesson {lessonIndex + 1}</Text>
                        <View style={styles.moveRow}>
                          <Pressable
                            onPress={() => moveLesson(moduleIndex, sectionIndex, lessonIndex, -1)}
                            style={styles.iconBtn}>
                            <Text style={styles.iconBtnText}>↑</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => moveLesson(moduleIndex, sectionIndex, lessonIndex, 1)}
                            style={styles.iconBtn}>
                            <Text style={styles.iconBtnText}>↓</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => removeLesson(moduleIndex, sectionIndex, lessonIndex)}
                            style={[styles.iconBtn, styles.dangerBtn]}>
                            <Text style={[styles.iconBtnText, styles.dangerText]}>×</Text>
                          </Pressable>
                        </View>
                      </View>

                      <Field
                        label="Lesson title"
                        value={lesson.title}
                        onChangeText={(v) => updateLesson(moduleIndex, sectionIndex, lessonIndex, { title: v })}
                        placeholder="Lesson title"
                      />

                      <Text style={styles.fieldLabel}>Type</Text>
                      <View style={styles.typeRow}>
                        {LESSON_TYPES.map((opt) => {
                          const active = lessonType === opt.id;
                          return (
                            <Pressable
                              key={opt.id}
                              onPress={() =>
                                updateLesson(moduleIndex, sectionIndex, lessonIndex, {
                                  lessonType: opt.id,
                                  type: opt.id,
                                })
                              }
                              style={[styles.typeChip, active && styles.typeChipActive]}>
                              <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                                {opt.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Field
                        label={getLessonContentLabel(lessonType)}
                        value={lesson[contentKey] || ''}
                        onChangeText={(v) =>
                          updateLesson(moduleIndex, sectionIndex, lessonIndex, { [contentKey]: v })
                        }
                        multiline={lessonType === 'text'}
                        placeholder={
                          lessonType === 'video'
                            ? 'Paste URL or upload below'
                            : lessonType === 'text'
                              ? 'Write lesson content'
                              : 'Paste file URL'
                        }
                      />

                      {lessonType === 'video' ? (
                        <View style={styles.uploadRow}>
                          <PrimaryButton
                            label={progress ? `Uploading ${progress}%` : 'Upload video'}
                            variant="secondary"
                            onPress={() => uploadLessonVideo(moduleIndex, sectionIndex, lessonIndex)}
                            loading={Boolean(progress)}
                            style={styles.uploadBtn}
                          />
                          {uploadError[uploadKey] ? (
                            <Text style={styles.uploadError}>{uploadError[uploadKey]}</Text>
                          ) : null}
                        </View>
                      ) : null}

                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Free preview lesson</Text>
                        <Switch
                          value={Boolean(lesson.isPreview)}
                          onValueChange={(v) =>
                            updateLesson(moduleIndex, sectionIndex, lessonIndex, {
                              isPreview: v,
                              isLocked: !v,
                            })
                          }
                          trackColor={{ true: colors.primary }}
                        />
                      </View>
                    </View>
                  );
                })}

                <PrimaryButton
                  label="Add lesson"
                  variant="ghost"
                  onPress={() => addLesson(moduleIndex, sectionIndex)}
                  style={styles.inlineBtn}
                />
              </View>
            ))}

            <PrimaryButton
              label="Add section"
              variant="secondary"
              onPress={() => addSection(moduleIndex)}
              style={styles.inlineBtn}
            />
          </View>
        );
      })}

      {!modules.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No modules yet. Add your first module to build the curriculum.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.muted, lineHeight: 18 },
  addBtn: { paddingHorizontal: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  statValue: { marginTop: 4, fontSize: 22, fontWeight: '800', color: colors.text },
  moduleCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleBadge: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionBadge: { fontSize: 11, fontWeight: '700', color: colors.muted },
  lessonCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonBadge: { fontSize: 11, fontWeight: '700', color: colors.primary },
  moveRow: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dangerBtn: { borderColor: '#F5C2C2', backgroundColor: '#FFF5F5' },
  iconBtnText: { fontWeight: '800', color: colors.text, fontSize: 16 },
  dangerText: { color: colors.danger },
  field: { marginBottom: spacing.xs },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  meta: { fontSize: 12, color: colors.muted, marginBottom: spacing.xs },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  typeChipTextActive: { color: colors.white },
  uploadRow: { gap: spacing.xs },
  uploadBtn: { alignSelf: 'flex-start' },
  uploadError: { color: colors.danger, fontSize: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, paddingRight: spacing.md },
  inlineBtn: { alignSelf: 'flex-start', marginTop: spacing.xs },
  empty: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 14, lineHeight: 20 },
});
