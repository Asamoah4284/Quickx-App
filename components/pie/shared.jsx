import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { t } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

export const PIE_STATUS = {
  funding: { label: 'Open for slices', tone: 'brand', help: 'Members can still join.' },
  trading: { label: 'Trading now', tone: 'warn', help: 'Joining is closed while Maxwell trades.' },
  settling: { label: 'Paying out', tone: 'warn', help: 'Results are being paid into wallets.' },
  settled: { label: 'Finished', tone: 'neutral', help: 'The result has been paid out.' },
  cancelling: { label: 'Refunding', tone: 'neutral', help: 'Deposits are being refunded.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', help: 'Everyone was refunded in full.' },
};

export const OUTCOME = {
  win: { label: 'Profit', tone: 'up' },
  loss: { label: 'Loss', tone: 'down' },
  even: { label: 'Break-even', tone: 'neutral' },
};

export const RISK_TEXT =
  'Pie trading is real trading with real money. You can lose part or all of what you put in. Past results do not promise future ones. Only use money you can afford to lose.';

export function percentFunded(pie) {
  if (!pie?.targetAmount) return 0;
  return Math.min(100, Math.round((Number(pie.raisedAmount || 0) / Number(pie.targetAmount)) * 100));
}

export function isOpen(pie) {
  return pie.status === 'funding' && (!pie.fundingDeadline || new Date(pie.fundingDeadline) > new Date());
}

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A ring that fills up to how much of the Pie is funded. */
export function PieRing({ value = 0, size = 150, stroke = 12, children }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const progress = useSharedValue(reduce ? pct : 0);

  useEffect(() => {
    progress.value = reduce ? pct : withTiming(pct, { duration: 1200, easing: EASE });
  }, [pct, reduce, progress]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - progress.value / 100) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Defs>
          <LinearGradient id="pie-ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4b8bff" />
            <Stop offset="1" stopColor="#1b5ef5" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.tintStrong} strokeWidth={stroke} />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#pie-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Thin bar version for cards. */
export function FundingBar({ pie }) {
  const reduce = useReducedMotion();
  const pct = percentFunded(pie);
  const width = useSharedValue(reduce ? pct : 0);
  useEffect(() => {
    width.value = reduce ? pct : withTiming(pct, { duration: 1000, easing: EASE });
  }, [pct, reduce, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    track: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: t.tintStrong },
    fill: { height: '100%', borderRadius: 4, backgroundColor: t.brand500 },
  })
);
