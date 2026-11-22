import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, IconBox, Loading, Rise, Row, Txt } from '@/components/ui/kit';
import { FEATURES } from '@/constants/features';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { useApi } from '@/hooks/useApi';
import { money } from '@/utils/currency';
import { durationLabel } from '@/utils/format';
import { themed } from '@/utils/themedStyles';

/** The plan that sells just this feature, and the bundle that includes it. */
export function plansFor(products, feature) {
  const list = products || [];
  return {
    single: list.find((p) => p.grants.length === 1 && p.grants[0] === feature),
    bundle: list.find((p) => p.grants.length > 1 && p.grants.includes(feature)),
  };
}

/** What a feature is, what it costs and how to get it. Shown to anyone without access. */
/**
 * title/text replace the default heading and blurb, for one part of a screen
 * (for example a community room) instead of a whole feature.
 */
export function FeatureOffer({ feature, compact, title, text }) {
  const { isSignedIn, requireSignIn } = useAppState();
  const meta = FEATURES[feature];
  const { data } = useApi('/products');
  const { single, bundle } = plansFor(data?.products, feature);

  return (
    <Rise>
      <Card style={styles.offer} padded={false}>
        <LinearGradient colors={[t.glowStrong, t.glowEnd]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.8 }} style={StyleSheet.absoluteFill} />
        <View style={{ padding: 22 }}>
          <IconBox name={meta.icon} size={52} />
          <Row gap={6} style={{ marginTop: 18 }}>
            <Icon name="lock" size={13} color={t.fgSubtle} />
            <Txt size={13} weight="semibold" color={t.fgSubtle}>
              {title ? `Part of ${meta.label}` : `${meta.label} is a members feature`}
            </Txt>
          </Row>
          <Txt size={compact ? 22 : 26} weight="bold" style={{ marginTop: 6, letterSpacing: -0.5 }}>
            {title || `Unlock ${meta.label}`}
          </Txt>
          <Txt size={15} color={t.fgMuted} style={{ marginTop: 6, lineHeight: 22 }}>
            {text || meta.blurb}
          </Txt>

          {single?.highlights?.length && !compact ? (
            <View style={{ marginTop: 16, gap: 10 }}>
              {single.highlights.map((item) => (
                <Row key={item} gap={10} align="flex-start">
                  <Icon name="check" size={15} color={t.up} style={{ marginTop: 3 }} />
                  <Txt size={14} color={t.fgMuted} style={{ flex: 1 }}>
                    {item}
                  </Txt>
                </Row>
              ))}
            </View>
          ) : null}

          <View style={{ marginTop: 22, gap: 10 }}>
            {single ? (
              <Button
                size="lg"
                label={`Get ${single.name} · ${money(single.price)} / ${durationLabel(single.durationDays)}`}
                onPress={() => router.push(`/checkout/${single.key}`)}
              />
            ) : (
              <Button size="lg" label="See plans" onPress={() => router.push('/pricing')} />
            )}
            {bundle ? (
              <Button
                variant="secondary"
                label={`Or get everything · ${money(bundle.price)}`}
                onPress={() => router.push(`/checkout/${bundle.key}`)}
              />
            ) : null}
            {!isSignedIn ? (
              <Button variant="ghost" size="sm" label="Already a member? Sign in" onPress={() => requireSignIn(`Sign in to open ${meta.label}.`)} />
            ) : null}
          </View>
        </View>
      </Card>
    </Rise>
  );
}

/**
 * Shows `children` only to members who have `feature`. Everyone else sees `preview`
 * (optional, for example the signals track record) and the offer.
 */
export default function FeatureGate({ feature, preview, children }) {
  const { isSignedIn, has, accessLoaded } = useAppState();
  if (isSignedIn && !accessLoaded) return <Loading label="Checking your access" />;
  if (isSignedIn && has(feature)) return children;
  return (
    <View style={{ gap: 24 }}>
      {preview}
      <FeatureOffer feature={feature} />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    offer: { borderColor: 'rgba(91,143,255,0.3)' },
  })
);
