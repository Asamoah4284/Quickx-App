import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useAppState } from '@/context/AppState';

export function UserAvatar({ size = 40, fontSize = 16, style }) {
  const { avatarUri } = useAppState();

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.letter, { fontSize }]}>Q</Text>
      )}
    </View>
  );
}

export function CameraBadge({ size = 28 }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <FontAwesome name="camera" size={size * 0.38} color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: colors.white,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.navy,
  },
});
