import { useState } from 'react';
import { View } from 'react-native';

import PieCard from '@/components/pie/PieCard';
import { RISK_TEXT } from '@/components/pie/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Card, Rise, Row, Stat, Tabs, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { cedis } from '@/utils/currency';

const STEPS = [
  { title: 'Pick a Pie', body: 'Each Pie is one trading plan: the pair, the target return and the most it can lose.' },
  { title: 'Take a slice', body: 'Pay with Mobile Money, card or your wallet. Your share of the result matches your share of the Pie.' },
  { title: 'Get paid out', body: 'When the trade closes, your slice plus profit (or what is left after a loss) goes to your wallet.' },
];

export default function PieList() {
  const [tab, setTab] = useState('funding');
  const { data, error, refreshing, refresh } = useApi(`/ptrading?status=${tab}`, { refetchOnFocus: true });
  const stats = data?.stats;
  const pies = data?.pies || [];

  return (
    <Page
      back
      eyebrow="Pie trading"
      title="Trade together with Maxwell"
      subtitle="Join a shared trade with a small amount. Maxwell runs the trade, and everyone shares the result by what they put in."
      refreshing={refreshing}
      onRefresh={refresh}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 10 }}>
          {STEPS.map((step, i) => (
            <Rise key={step.title} index={i}>
              <Card>
                <Row gap={12} align="flex-start">
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={13} weight="bold" color={t.brand300} tabular>
                      {i + 1}
                    </Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={15} weight="semibold">
                      {step.title}
                    </Txt>
                    <Txt size={13.5} color={t.fgMuted} style={{ marginTop: 2, lineHeight: 19 }}>
                      {step.body}
                    </Txt>
                  </View>
                </Row>
              </Card>
            </Rise>
          ))}
        </View>

        <Alert tone="warn" icon="shield">
          {RISK_TEXT}
        </Alert>

        {stats && stats.settledCount > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Stat style={{ flexBasis: '47%', flexGrow: 1 }} label="Pies finished" value={String(stats.settledCount)} />
            <Stat style={{ flexBasis: '47%', flexGrow: 1 }} label="Win rate" value={stats.winRate == null ? 'None yet' : `${stats.winRate}%`} />
            <Stat style={{ flexBasis: '47%', flexGrow: 1 }} label="Money put in" value={cedis(stats.totalCapitalRaised)} />
            <Stat style={{ flexBasis: '47%', flexGrow: 1 }} label="Paid back out" value={cedis(stats.totalDistributed)} />
          </View>
        ) : null}

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'funding', label: 'Open now' },
            { value: 'trading', label: 'Trading' },
            { value: 'settled', label: 'Finished' },
            { value: 'all', label: 'All' },
          ]}
        />
        {error ? <Alert>{error.message}</Alert> : null}
        {!data && !error ? (
          <>
            <Skeleton height={220} radius={20} />
            <Skeleton height={220} radius={20} />
          </>
        ) : null}
        {data && !pies.length ? (
          <EmptyState
            icon="pie-chart"
            title={tab === 'funding' ? 'No Pie is open right now' : 'Nothing here yet'}
            subtitle={tab === 'funding' ? 'Turn on notifications and we will tell you when the next one opens.' : undefined}
          />
        ) : null}
        {pies.map((pie, i) => (
          <Rise key={pie._id} index={i}>
            <PieCard pie={pie} />
          </Rise>
        ))}
      </View>
    </Page>
  );
}
