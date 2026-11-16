import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with a subtle spring "press-in" scale and optional haptic tap.
 * Drop-in replacement for Pressable on cards, tiles, and buttons.
 */
export function PressableScale({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  scaleTo = 0.97,
  haptic = 'tap',
  ...rest
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && haptics[haptic]) haptics[haptic]();
        onPress?.(e);
      }}
      style={[typeof style === 'function' ? undefined : style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
