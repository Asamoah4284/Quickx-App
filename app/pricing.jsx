import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Alert, Badge, Button, Card, Divider, Icon, Rise, Row, Txt } from '@/components/ui/kit';
import { Page } from '@/components/ui/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { money, useCurrency } from '@/utils/currency';
import { daysLeft, durationLabel, formatDate } from '@/utils/format';

const FAQ = [
  ['Can I buy just one thing, like signals?', 'Yes. Courses, Signals and Mentorship are each sold on their own. Buy only what you need.'],
  ['Is the community free?', 'Yes. Every member can use the community for free. Each plan also opens its own room there, like the Signals room for Signals members.'],
  ['What happens when my time runs out?', 'Access to that feature pauses. Nothing is deleted. Your progress and history are there when you come back.'],
  ['I still have time left. What if I buy again?', 'The new time is added on top of what you have, so you never lose days by renewing early.'],
  ['How do I pay?', 'Mobile Money (MTN, Telecel, AirtelTigo) or card. Access switches on as soon as the payment is confirmed.'],
];

export function PriceCard({ product, featured }) {
  const { isSignedIn, has, expiryOf } = useAppState();
  const ownsAll = isSignedIn && product.grants.every((f) => has(f));
  const soonest = ownsAll ? product.grants.map((f) => expiryOf(f)).filter(Boolean).sort()[0] : null;

  return (
    <Card tone={featured ? 'brand' : undefined} padded={false}>
      {featured ? (
        <LinearGradient colors={['rgba(47,107,255,0.3)', 'rgba(47,107,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={{ padding: 20 }}>
        <Row justify="space-between" align="flex-start">
          <Txt size={20} weight="bold" style={{ flex: 1 }}>
            {product.name}
          </Txt>
          {product.badge ? <Badge label={product.badge} tone="brand" /> : null}
        </Row>
        {product.tagline ? (
          <Txt size={14} color={t.fgMuted} style={{ marginTop: 4 }}>
            {product.tagline}
          </Txt>
        ) : null}
        <Row gap={6} align="flex-end" style={{ marginTop: 16 }}>
          <Txt size={34} weight="bold" tabular style={{ lineHeight: 40 }}>
            {money(product.price)}
          </Txt>
          <Txt size={14} color={t.fgSubtle} style={{ marginBottom: 6 }}>
            / {durationLabel(product.durationDays)}
          </Txt>
        </Row>
        <View style={{ marginTop: 14, gap: 9 }}>
          {(product.highlights || []).map((item) => (
            <Row key={item} gap={10} align="flex-start">
              <Icon name="check" size={15} color={t.up} style={{ marginTop: 3 }} />
              <Txt size={14} color={t.fgMuted} style={{ flex: 1 }}>
                {item}
              </Txt>
            </Row>
          ))}
        </View>
        {ownsAll && soonest ? (
          <Txt size={12} color={t.fgSubtle} style={{ marginTop: 14 }}>
            You have this until {formatDate(soonest)} ({daysLeft(soonest)} days left).
          </Txt>
        ) : null}
        <Button
          variant={featured ? 'primary' : 'secondary'}
          label={ownsAll ? 'Add more time' : `Get ${product.name}`}
          style={{ marginTop: 16 }}
          onPress={() => router.push(`/checkout/${product.key}`)}
        />
      </View>
    </Card>
  );
}

export default function Pricing() {
  useCurrency();
  const { data, error, refreshing, refresh } = useApi('/products');
  const products = data?.products || [];
  const bundle = products.find((p) => p.grants.length > 1);
  const singles = products.filter((p) => p.grants.length === 1);

  return (
    <Page
      back
      eyebrow="Pricing"
      title="Pay for what you use. Or get it all."
      subtitle="Every feature has its own price. Pick one, mix a few, or take All-Access and save."
      refreshing={refreshing}
      onRefresh={refresh}>
      <View style={{ gap: 14 }}>
        {error ? <Alert>{error.message}</Alert> : null}
        {!data && !error ? (
          <>
            <Skeleton height={320} radius={20} />
            <Skeleton height={280} radius={20} />
          </>
        ) : null}
        {bundle ? (
          <Rise>
            <PriceCard product={bundle} featured />
          </Rise>
        ) : null}
        {singles.map((p, i) => (
          <Rise key={p.key} index={i + 1}>
            <PriceCard product={p} />
          </Rise>
        ))}
      </View>

      <Txt size={20} weight="bold" style={{ marginTop: 36, marginBottom: 6 }}>
        Common questions
      </Txt>
      {FAQ.map(([q, a], i) => (
        <View key={q}>
          {i ? <Divider /> : null}
          <View style={{ paddingVertical: 16 }}>
            <Txt size={15} weight="semibold">
              {q}
            </Txt>
            <Txt size={14} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 21 }}>
              {a}
            </Txt>
          </View>
        </View>
      ))}
    </Page>
  );
}
