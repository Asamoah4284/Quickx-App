import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { layout, t } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

const TYPE_LABEL = { video: 'Video', quiz: 'Quiz', text: 'Reading', article: 'Reading' };

export function lessonMeta(lesson) {
  const length = lesson.durationLabel || (lesson.durationMins ? `${lesson.durationMins} min` : '');
  return [TYPE_LABEL[lesson.type] || 'Lesson', length].filter(Boolean).join(' · ');
}

/** One lesson in a list: number or tick, title, type and length. Same height for every row. */
export function LessonRow({ lesson, number, done, current, onPress, last }) {
  const locked = lesson.isLocked;
  return (
    <PressableScale haptic="select" onPress={onPress} style={[styles.row, current && styles.current, !last && styles.divider]}>
      <View style={[styles.mark, done && styles.markDone, current && !done && styles.markCurrent]}>
        {done ? (
          <Feather name="check" size={14} color={t.up} />
        ) : locked ? (
          <Feather name="lock" size={13} color={t.fgSubtle} />
        ) : (
          <Txt size={12} weight="bold" color={current ? t.brand300 : t.fgMuted} tabular>
            {number}
          </Txt>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={14.5} weight={current ? 'bold' : 'semibold'} numberOfLines={2}>
          {lesson.title}
        </Txt>
        <Txt size={12} color={t.fgSubtle} style={{ marginTop: 2 }} numberOfLines={1}>
          {current ? 'Playing now · ' : ''}
          {lessonMeta(lesson)}
        </Txt>
      </View>
      <Feather name={lesson.type === 'video' && !locked ? 'play-circle' : 'chevron-right'} size={18} color={current ? t.brand400 : t.fgSubtle} />
    </PressableScale>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: layout.card, paddingVertical: 10 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
    current: { backgroundColor: t.brandSoft },
    mark: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tint },
    markDone: { backgroundColor: t.upSoft },
    markCurrent: { backgroundColor: t.brandSoft, borderWidth: 1, borderColor: t.brand400 },
  })
);
