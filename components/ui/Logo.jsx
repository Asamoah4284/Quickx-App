import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Txt } from '@/components/ui/kit';
import { t } from '@/constants/theme';

/**
 * The QuickX Learn logo, the same drawing as the website (src/ui/Logo.jsx):
 * a ring with a green arc around an open book. `onDark` lifts the navy to brand blue.
 */
export function LogoMark({ size = 36, onDark = true }) {
  const ring = onDark ? t.brand500 : t.logoNavy;
  const book = onDark ? '#ffffff' : t.logoNavy;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="22.5" cy="24" r="19" stroke={ring} strokeWidth="4" />
      <Path d="M26 5.2 A19 19 0 0 1 26 42.8" stroke={t.logoGreen} strokeWidth="3.2" strokeLinecap="round" />
      <G stroke={book} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <Path d="M22.5 17.5 C20 15.6 16.5 15 12.5 15.5 V31 C16.5 30.5 20 31.1 22.5 33 Z" />
        <Path d="M22.5 17.5 C25 15.6 28.5 15 32.5 15.5 V31 C28.5 30.5 25 31.1 22.5 33" />
        <Path d="M26 21.5 H29.5 M26 25.5 H29.5" />
      </G>
    </Svg>
  );
}

/** Mark plus the two-line "QuickX / Learn" wordmark. */
export function Logo({ size = 34, onDark = true }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} onDark={onDark} />
      <View>
        <Txt size={size * 0.5} weight="extrabold" color={onDark ? t.fg : t.logoNavy} style={{ lineHeight: size * 0.56, letterSpacing: -0.3 }}>
          QuickX
        </Txt>
        <Txt size={size * 0.38} weight="bold" color={t.logoGreen} style={{ lineHeight: size * 0.44 }}>
          Learn
        </Txt>
      </View>
    </View>
  );
}

export default Logo;
