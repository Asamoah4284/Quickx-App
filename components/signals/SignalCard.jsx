import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Badge, Card, Icon, Row, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useCopy } from '@/hooks/useCopy';
import { formatDateTime, timeAgo } from '@/utils/format';
import { levelFormatter, orderLabel, rewardRatio, signalAsText, STATUS_META } from '@/utils/signals';

export function DirectionPill({ direction }) {
  const buy = direction === 'buy';
  return (
    <View style={[styles.dir, { backgroundColor: buy ? t.upSoft : t.downSoft }]}>
      <Icon name={buy ? 'arrow-up-right' : 'arrow-down-right'} size={13} color={buy ? t.up : t.down} />
      <Txt size={11} weight="extrabold" color={buy ? t.up : t.down} style={{ letterSpacing: 0.6 }}>
        {String(direction || '').toUpperCase()}
      </Txt>
    </View>
  );
}

export function Pips({ value, size = 14 }) {
  if (value == null) return null;
  const n = Number(value);
  return (
    <Txt size={size} weight="bold" tabular color={n > 0 ? t.up : n < 0 ? t.down : t.fgMuted}>
      {n > 0 ? '+' : ''}
      {n} pips
    </Txt>
  );
}

function Level({ label, value, hint, tone, copyKey, copy, copied }) {
  const done = copied === copyKey;
  const color = tone === 'up' ? t.up : tone === 'down' ? t.down : t.fg;
  return (
    <PressableScale
      haptic={null}
      scaleTo={0.96}
      onPress={() => copy(value, copyKey)}
      style={[styles.level, done && { borderColor: 'rgba(91,143,255,0.6)', backgroundColor: 'rgba(47,107,255,0.1)' }]}
      accessibilityLabel={`Copy ${label} ${value}`}>
      <Row justify="space-between">
        <Txt size={10.5} weight="bold" color={t.fgSubtle} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {label}
        </Txt>
        <Icon name={done ? 'check' : 'copy'} size={12} color={done ? t.brand300 : t.fgSubtle} />
      </Row>
      <Txt size={18} weight="bold" color={color} tabular style={{ marginTop: 4 }}>
        {value}
      </Txt>
      {hint ? (
        <Txt size={11} color={t.fgSubtle}>
          {hint}
        </Txt>
      ) : null}
    </PressableScale>
  );
}

/** A full signal: tap any price to copy it, or Copy trade for the whole thing. */
export default function SignalCard({ signal, preview = false }) {
  const { copy, copied } = useCopy();
  const status = STATUS_META[signal.status] || STATUS_META.closed;
  const live = signal.status === 'active';
  const tps = signal.takeProfits || [];
  const fmt = levelFormatter([signal.entry, signal.stopLoss, ...tps]);
  const updates = signal.updates || [];

  return (
    <Card tone={live ? 'up' : undefined}>
      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1 }}>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            <Txt size={20} weight="bold" tabular>
              {signal.pair || 'PAIR'}
            </Txt>
            <DirectionPill direction={signal.direction} />
            {signal.timeframe ? (
              <View style={styles.tf}>
                <Txt size={11} weight="semibold" color={t.fgMuted} tabular>
                  {signal.timeframe}
                </Txt>
              </View>
            ) : null}
          </Row>
          <Txt size={13} color={t.fgMuted} style={{ marginTop: 2 }}>
            {orderLabel(signal)}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Badge label={status.label} tone={status.tone} dot={live} />
          <Pips value={signal.resultPips} size={13} />
        </View>
      </Row>

      <View style={styles.grid}>
        <Level label="Entry" value={fmt(signal.entry)} copyKey="entry" copy={copy} copied={copied} />
        <Level label="Stop loss" value={fmt(signal.stopLoss)} tone="down" copyKey="sl" copy={copy} copied={copied} />
        {tps.map((tp, i) => {
          const rr = rewardRatio(signal, tp);
          return (
            <Level
              key={i}
              label={tps.length > 1 ? `Target ${i + 1}` : 'Target'}
              value={fmt(tp)}
              hint={rr ? `Risk:reward 1:${rr}` : null}
              tone="up"
              copyKey={`tp${i}`}
              copy={copy}
              copied={copied}
            />
          );
        })}
      </View>

      <Row justify="space-between" style={{ marginTop: 12 }}>
        <Txt size={12} color={t.fgSubtle}>
          Tap a price to copy it
        </Txt>
        <PressableScale haptic={null} onPress={() => copy(signalAsText(signal), 'all')} style={[styles.copyAll, copied === 'all' && { borderColor: 'rgba(91,143,255,0.6)' }]}>
          <Animated.View key={copied === 'all' ? 'done' : 'idle'} entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
            <Row gap={6}>
              <Icon name={copied === 'all' ? 'check' : 'copy'} size={13} color={copied === 'all' ? t.brand300 : t.fg} />
              <Txt size={12.5} weight="bold">
                {copied === 'all' ? 'Copied' : 'Copy trade'}
              </Txt>
            </Row>
          </Animated.View>
        </PressableScale>
      </Row>

      {signal.note ? (
        <Txt size={14} color={t.fgMuted} style={{ marginTop: 14, lineHeight: 21 }}>
          {signal.note}
        </Txt>
      ) : null}

      {signal.chartImage ? (
        <Image source={{ uri: assetUrl(signal.chartImage) }} style={styles.chart} contentFit="cover" transition={200} />
      ) : null}

      {updates.length ? (
        <View style={styles.updates}>
          {updates.map((u, i) => (
            <View key={i} style={{ gap: 2 }}>
              <Txt size={14}>{u.text}</Txt>
              <Txt size={11} color={t.fgSubtle}>
                {formatDateTime(u.at)}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}

      {!preview ? (
        <Txt size={11.5} color={t.fgSubtle} style={{ marginTop: 14 }}>
          Posted {timeAgo(signal.createdAt)}
          {signal.closedAt ? `, closed ${timeAgo(signal.closedAt)}` : ''}
        </Txt>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  dir: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tf: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  level: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.line,
    backgroundColor: t.bgRaised,
  },
  copyAll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.lineStrong,
  },
  chart: { marginTop: 14, width: '100%', aspectRatio: 16 / 10, borderRadius: 14, backgroundColor: t.ink700 },
  updates: { marginTop: 14, gap: 10, borderLeftWidth: 2, borderLeftColor: t.line, paddingLeft: 12 },
});
