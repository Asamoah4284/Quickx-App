import { View } from 'react-native';

import { DirectionPill, Pips } from '@/components/signals/SignalCard';
import { Card, CountUp, Divider, Row, Stat, Txt } from '@/components/ui/kit';
import { t } from '@/constants/theme';
import { formatDate } from '@/utils/format';
import { STATUS_META } from '@/utils/signals';

export function SignalStats({ stats, openCount }) {
  if (!stats) return null;
  const pips = Number(stats.totalPips || 0);
  return (
    <View style={{ gap: 10 }}>
      <Row gap={10}>
        <Stat label="Win rate">
          {stats.winRate == null ? (
            <Txt size={20} weight="bold" style={{ marginTop: 4 }}>
              None yet
            </Txt>
          ) : (
            <CountUp value={stats.winRate} suffix="%" size={22} weight="bold" style={{ marginTop: 4 }} />
          )}
        </Stat>
        <Stat label="Net pips">
          <CountUp
            value={pips}
            decimals={pips % 1 ? 1 : 0}
            prefix={pips > 0 ? '+' : ''}
            size={22}
            weight="bold"
            color={pips > 0 ? t.up : pips < 0 ? t.down : t.fg}
            style={{ marginTop: 4 }}
          />
        </Stat>
      </Row>
      <Row gap={10}>
        <Stat label="Signals closed">
          <CountUp value={stats.total} size={22} weight="bold" style={{ marginTop: 4 }} />
        </Stat>
        {openCount != null ? (
          <Stat label="Live now">
            <CountUp value={openCount} size={22} weight="bold" color={openCount ? t.up : t.fg} style={{ marginTop: 4 }} />
          </Stat>
        ) : null}
      </Row>
    </View>
  );
}

/** Results of finished signals. Safe to show anyone: no live levels. */
export default function TrackRecord({ data }) {
  if (!data) return null;
  return (
    <View style={{ gap: 12 }}>
      <SignalStats stats={data.stats} openCount={data.openCount} />
      <Txt size={12} color={t.fgSubtle}>
        Results over the last {data.stats.periodDays} days.
      </Txt>
      {data.recent?.length ? (
        <Card padded={false}>
          {data.recent.map((s, i) => (
            <View key={s.id}>
              {i ? <Divider /> : null}
              <Row justify="space-between" style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
                <Row gap={10}>
                  <Txt size={14} weight="semibold" tabular>
                    {s.pair}
                  </Txt>
                  <DirectionPill direction={s.direction} />
                </Row>
                <View style={{ alignItems: 'flex-end' }}>
                  <Pips value={s.resultPips} size={13} />
                  <Txt size={11} color={t.fgSubtle}>
                    {STATUS_META[s.status]?.label} · {formatDate(s.closedAt)}
                  </Txt>
                </View>
              </Row>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
