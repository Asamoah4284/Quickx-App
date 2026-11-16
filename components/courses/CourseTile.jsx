import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Row, Txt } from '@/components/ui/kit';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';

export const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function isImage(url) {
  return typeof url === 'string' && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
}

/** A course in a list: thumbnail, level, lessons and a short description. */
export function CourseTile({ course }) {
  const thumb = isImage(course.thumbnail) ? assetUrl(course.thumbnail) : null;
  const id = course._id || course.id;
  return (
    <Card padded={false} onPress={() => router.push(`/course/${id}`)}>
      <View style={styles.thumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        ) : (
          <LinearGradient colors={['rgba(18,70,196,0.55)', t.cardHi]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.play}>
          <Icon name="play" size={16} color={t.bg} style={{ marginLeft: 2 }} />
        </View>
      </View>
      <View style={{ padding: 16 }}>
        <Row gap={6}>
          <Badge label={LEVELS[course.level] || 'All levels'} />
          {course.totalLessons ? <Badge label={`${course.totalLessons} lessons`} /> : null}
        </Row>
        <Txt size={17} weight="semibold" style={{ marginTop: 10 }} numberOfLines={2}>
          {course.title}
        </Txt>
        {course.shortDescription || course.subtitle ? (
          <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 4 }} numberOfLines={2}>
            {course.shortDescription || course.subtitle}
          </Txt>
        ) : null}
      </View>
    </Card>
  );
}

/** A course the member has started: thumbnail, title and progress. */
export function CourseProgressRow({ course }) {
  const pct = Math.round(Number(course.progress ?? course.pct ?? 0));
  const thumb = isImage(course.thumbnail) ? assetUrl(course.thumbnail) : null;
  return (
    <Card padded={false} onPress={() => router.push(`/learn/${course.id}`)}>
      <Row gap={12} style={{ padding: 10 }}>
        <View style={styles.small}>{thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}</View>
        <View style={{ flex: 1 }}>
          <Txt size={14.5} weight="semibold" numberOfLines={1}>
            {course.title}
          </Txt>
          <Row gap={8} style={{ marginTop: 8 }}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(100, pct)}%` }]} />
            </View>
            <Txt size={11} color={t.fgSubtle} tabular>
              {pct}%
            </Txt>
          </Row>
        </View>
        <Icon name="chevron-right" size={18} color={t.fgSubtle} />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  thumb: { aspectRatio: 16 / 9, backgroundColor: t.ink700, alignItems: 'center', justifyContent: 'center' },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  small: { width: 84, height: 56, borderRadius: 10, overflow: 'hidden', backgroundColor: t.ink700 },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: t.brand500 },
});
