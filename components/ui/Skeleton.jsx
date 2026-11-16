import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii, spacing } from '@/constants/theme';

/** Pulsing placeholder block shown while content loads. */
export function Skeleton({ width = '100%', height = 14, radius = radii.sm, style }) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: '#E3E9F2' }, animatedStyle, style]}
    />
  );
}

/** Card-shaped skeleton matching list cards (image + two text lines). */
export function SkeletonCard({ imageHeight = 140, style }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={imageHeight} radius={0} />
      <View style={styles.body}>
        <Skeleton width="40%" height={10} />
        <Skeleton width="85%" height={16} style={{ marginTop: spacing.sm }} />
        <Skeleton width="60%" height={12} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3, imageHeight, gap = spacing.lg }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} imageHeight={imageHeight} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { padding: spacing.lg },
});
