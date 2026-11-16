import { router } from 'expo-router';
import { View } from 'react-native';

import { FundingBar, OUTCOME, PIE_STATUS, percentFunded } from '@/components/pie/shared';
import { Badge, Card, Icon, Row, Txt } from '@/components/ui/kit';
import { t } from '@/constants/theme';
import { cedis } from '@/utils/currency';
import { daysLeft } from '@/utils/format';

function Term({ label, value, color }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: t.bgRaised }}>
      <Txt size={10.5} color={t.fgSubtle}>
        {label}
      </Txt>
      <Txt size={13.5} weight="semibold" color={color || t.fg} tabular style={{ marginTop: 2 }}>
        {value}
      </Txt>
    </View>
  );
}

export default function PieCard({ pie }) {
  const status = PIE_STATUS[pie.status] || PIE_STATUS.funding;
  const outcome = pie.outcome ? OUTCOME[pie.outcome] : null;
  const left = daysLeft(pie.fundingDeadline);
  return (
    <Card onPress={() => router.push(`/pie/${pie._id}`)}>
      <Row align="flex-start" gap={12}>
        <View style={{ flex: 1 }}>
          <Txt size={11.5} weight="bold" color={t.fgSubtle} tabular style={{ letterSpacing: 0.8 }}>
            {pie.pair}
          </Txt>
          <Txt size={16} weight="semibold" numberOfLines={2} style={{ marginTop: 2 }}>
            {pie.title}
          </Txt>
        </View>
        <Badge
          tone={outcome ? outcome.tone : status.tone}
          label={outcome ? `${outcome.label} ${pie.finalPnlPercent > 0 ? '+' : ''}${pie.finalPnlPercent}%` : status.label}
        />
      </Row>
      <Row gap={8} style={{ marginTop: 14 }}>
        <Term label="Aiming for" value={`+${pie.targetRoiPercent}%`} color={t.up} />
        <Term label="Most it can lose" value={`-${pie.maxLossPercent}%`} color={t.down} />
        <Term label="Risk" value={pie.riskLevel} />
      </Row>
      <Row justify="space-between" style={{ marginTop: 16, marginBottom: 8 }}>
        <Txt size={14} weight="semibold" tabular>
          {cedis(pie.raisedAmount)}
        </Txt>
        <Txt size={12} color={t.fgSubtle} tabular>
          {percentFunded(pie)}% of {cedis(pie.targetAmount)}
        </Txt>
      </Row>
      <FundingBar pie={pie} />
      <Row justify="space-between" style={{ marginTop: 10 }}>
        <Row gap={5}>
          <Icon name="users" size={13} color={t.fgSubtle} />
          <Txt size={12} color={t.fgSubtle}>
            {pie.participantCount || 0} in
          </Txt>
        </Row>
        {pie.status === 'funding' && pie.fundingDeadline ? (
          <Txt size={12} color={t.fgSubtle}>
            {left > 0 ? `${left} day${left === 1 ? '' : 's'} left to join` : 'Closing today'}
          </Txt>
        ) : (
          <Icon name="chevron-right" size={16} color={t.fgSubtle} />
        )}
      </Row>
    </Card>
  );
}
