import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isImage, LEVELS } from '@/components/courses/CourseTile';
import { plansFor } from '@/components/FeatureGate';
import { LessonVideoPlayer } from '@/components/learn/LessonVideoPlayer';
import { Alert, Badge, Button, Card, Divider, Icon, Loading, Rise, Row, Txt } from '@/components/ui/kit';
import { Footer, Page } from '@/components/ui/Page';
import { PressableScale } from '@/components/ui/PressableScale';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { money } from '@/utils/currency';
import { durationLabel } from '@/utils/format';
import { themed } from '@/utils/themedStyles';

/** Modules → sections → lessons, flattened to sections with their lessons. */
function toSections(course) {
  return (course.modules || []).flatMap((mod) =>
    (mod.sections || []).map((sec) => ({
      id: String(sec._id || `${mod.title}-${sec.title}`),
      title: sec.title || mod.title,
      lessons: (sec.lessons || []).map((lesson) => ({
        id: String(lesson._id),
        title: lesson.title,
        duration: lesson.duration,
        isPreview: lesson.isPreview === true,
        videoUrl: lesson.isPreview === true ? lesson.videoUrl || lesson.filePath || '' : '',
      })),
    }))
  );
}

function Section({ section, open, onToggle, onPlay, unlocked }) {
  return (
    <Animated.View layout={LinearTransition.springify().damping(20)}>
      <PressableScale haptic="select" scaleTo={0.99} onPress={onToggle} style={styles.sectionHead}>
        <Txt size={15} weight="semibold" style={{ flex: 1 }}>
          {section.title}
        </Txt>
        <Txt size={12} color={t.fgSubtle}>
          {section.lessons.length} lessons
        </Txt>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.fgSubtle} />
      </PressableScale>
      {open ? (
        <Animated.View entering={FadeIn.duration(220)}>
          {section.lessons.map((lesson) => {
            const playable = lesson.isPreview && lesson.videoUrl;
            return (
              <Row key={lesson.id} gap={12} style={styles.lesson}>
                <Icon name={unlocked || lesson.isPreview ? 'play-circle' : 'lock'} size={16} color={unlocked || lesson.isPreview ? t.brand400 : t.fgSubtle} />
                <Txt size={14} color={t.fgMuted} style={{ flex: 1 }} numberOfLines={2}>
                  {lesson.title}
                </Txt>
                {playable && !unlocked ? (
                  <PressableScale onPress={() => onPlay(lesson)} style={styles.preview}>
                    <Txt size={11.5} weight="bold" color={t.brand300}>
                      Preview
                    </Txt>
                  </PressableScale>
                ) : lesson.duration ? (
                  <Txt size={12} color={t.fgSubtle} tabular>
                    {lesson.duration}
                  </Txt>
                ) : null}
              </Row>
            );
          })}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams();
  const { isSignedIn, has, requireSignIn } = useAppState();
  const { data: course, loading, error } = useApi(`/courses/${id}/preview`);
  const owned = useApi(isSignedIn ? '/courses/user/purchased' : null);
  const products = useApi('/products');
  const [openSection, setOpenSection] = useState(0);
  const [playing, setPlaying] = useState(null);

  const sections = useMemo(() => (course ? toSections(course) : []), [course]);
  const lessonCount = sections.reduce((n, s) => n + s.lessons.length, 0);
  const previewCount = sections.reduce((n, s) => n + s.lessons.filter((l) => l.isPreview).length, 0);

  if (loading) {
    return (
      <Page back>
        <Loading label="Loading course" />
      </Page>
    );
  }
  if (error || !course) {
    return (
      <Page back title="Course">
        <Alert>{error?.message || 'This course could not be found.'}</Alert>
      </Page>
    );
  }

  const free = course.pricingType === 'free' && Number(course.price || 0) <= 0;
  const boughtBefore = (owned.data || []).some((c) => String(c.id) === String(course._id));
  const unlocked = isSignedIn && (has('courses') || free || boughtBefore);
  const { single: plan, bundle } = plansFor(products.data?.products, 'courses');
  const thumb = isImage(course.thumbnail) ? assetUrl(course.thumbnail) : null;

  const start = async () => {
    if (!isSignedIn) {
      const tk = await requireSignIn('Create a free account to start this course.');
      if (!tk) return;
    }
    router.push(`/learn/${course._id}`);
  };

  const footer = (
    <Footer>
      {unlocked ? (
        <Button size="lg" icon="play" label={boughtBefore || has('courses') ? 'Continue watching' : 'Start for free'} onPress={start} />
      ) : free ? (
        <Button size="lg" icon="play" label="Start for free" onPress={start} />
      ) : (
        <View style={{ gap: 8 }}>
          <Button
            size="lg"
            label={plan ? `Get Courses access · ${money(plan.price)} / ${durationLabel(plan.durationDays)}` : 'Get Courses access'}
            onPress={() => router.push(`/checkout/${plan?.key || 'courses'}`)}
          />
          {bundle ? <Button variant="secondary" label={`Or ${bundle.name} · ${money(bundle.price)}`} onPress={() => router.push(`/checkout/${bundle.key}`)} /> : null}
        </View>
      )}
    </Footer>
  );

  return (
    <>
      <Page back footer={footer}>
        <Rise>
          <View style={styles.cover}>{thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : null}</View>
          <Row gap={6} style={{ marginTop: 18, flexWrap: 'wrap' }}>
            <Badge label={LEVELS[course.level] || 'All levels'} tone="brand" />
            <Badge label={`${lessonCount} lessons`} />
            {previewCount ? <Badge label={`${previewCount} free previews`} tone="up" /> : null}
          </Row>
          <Txt size={26} weight="bold" style={{ marginTop: 12, letterSpacing: -0.5, lineHeight: 32 }}>
            {course.title}
          </Txt>
          {course.shortDescription || course.subtitle ? (
            <Txt size={15} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 22 }}>
              {course.shortDescription || course.subtitle}
            </Txt>
          ) : null}
          {!unlocked && !free ? (
            <Txt size={13} color={t.fgSubtle} style={{ marginTop: 10 }}>
              Included with Courses access, along with every other course.
            </Txt>
          ) : null}
        </Rise>

        {course.learningOutcomes?.length ? (
          <Rise index={1}>
            <Card style={{ marginTop: 22 }}>
              <Txt size={16} weight="semibold">
                What you will learn
              </Txt>
              <View style={{ marginTop: 12, gap: 10 }}>
                {course.learningOutcomes.map((item) => (
                  <Row key={item} gap={10} align="flex-start">
                    <Icon name="check" size={15} color={t.up} style={{ marginTop: 3 }} />
                    <Txt size={14} color={t.fgMuted} style={{ flex: 1 }}>
                      {item}
                    </Txt>
                  </Row>
                ))}
              </View>
            </Card>
          </Rise>
        ) : null}

        <Rise index={2}>
          <Txt size={18} weight="bold" style={{ marginTop: 26, marginBottom: 12 }}>
            Course content
          </Txt>
          <Card padded={false}>
            {sections.map((section, i) => (
              <View key={section.id}>
                {i ? <Divider /> : null}
                <Section
                  section={section}
                  open={openSection === i}
                  onToggle={() => setOpenSection(openSection === i ? -1 : i)}
                  onPlay={setPlaying}
                  unlocked={unlocked}
                />
              </View>
            ))}
          </Card>
        </Rise>

        {course.description ? (
          <Rise index={3}>
            <Txt size={18} weight="bold" style={{ marginTop: 26, marginBottom: 8 }}>
              About this course
            </Txt>
            <Txt size={14.5} color={t.fgMuted} style={{ lineHeight: 22 }}>
              {course.description}
            </Txt>
          </Rise>
        ) : null}
      </Page>

      <Modal visible={Boolean(playing)} animationType="fade" onRequestClose={() => setPlaying(null)} supportedOrientations={['portrait', 'landscape']}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <Row justify="space-between" style={{ padding: 14 }}>
            <Txt size={15} weight="semibold" color="#ffffff" style={{ flex: 1 }} numberOfLines={1}>
              {playing?.title}
            </Txt>
            <Pressable onPress={() => setPlaying(null)} hitSlop={12} accessibilityLabel="Close preview">
              <Icon name="x" size={22} color="#ffffff" />
            </Pressable>
          </Row>
          {playing ? (
            <View style={{ paddingHorizontal: 12 }}>
              <LessonVideoPlayer uri={assetUrl(playing.videoUrl)} />
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    cover: { aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden', backgroundColor: t.ink700, borderWidth: 1, borderColor: t.line },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 15 },
    lesson: { paddingHorizontal: 16, paddingVertical: 11 },
    preview: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: t.brandSoft },
  })
);
