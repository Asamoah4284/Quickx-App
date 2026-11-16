import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/constants/theme';

function formatTime(ms = 0) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LessonVideoPlayer({
  uri,
  posterUri,
  title,
  subtitle,
  lessonIndex,
  lessonTotal,
}) {
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: player.currentTime });

  const [controlsVisible, setControlsVisible] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const hideTimer = useRef(null);
  const trackWidth = useRef(0);

  useEffect(() => {
    setControlsVisible(true);
  }, [uri]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!controlsVisible || !isPlaying || seeking) return undefined;
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3200);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [controlsVisible, isPlaying, seeking, currentTime]);

  const loaded = status === 'readyToPlay';
  const buffering = status === 'loading';
  const positionMs = (currentTime || 0) * 1000;
  const durationMs = (player.duration || 0) * 1000;
  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  const revealControls = () => {
    setControlsVisible(true);
  };

  const togglePlay = () => {
    revealControls();
    if (!loaded && !isPlaying) {
      player.play();
      return;
    }
    if (isPlaying) player.pause();
    else player.play();
  };

  const seekToRatio = (ratio) => {
    if (!player.duration) return;
    const nextSec = Math.max(0, Math.min(player.duration, ratio * player.duration));
    player.currentTime = nextSec;
  };

  const onTrackPress = (event) => {
    const x = event.nativeEvent.locationX;
    const width = trackWidth.current || 1;
    seekToRatio(x / width);
    revealControls();
  };

  const openFullscreen = async () => {
    revealControls();
    try {
      await videoRef.current?.enterFullscreen();
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.shell, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.frame}>
        <VideoView
          ref={videoRef}
          style={styles.video}
          player={player}
          nativeControls={false}
          contentFit="contain"
        />

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setControlsVisible((v) => !v)}>
          {controlsVisible || buffering ? (
            <LinearGradient
              colors={['rgba(7,21,47,0.72)', 'transparent', 'rgba(7,21,47,0.82)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="box-none">
              <View style={styles.topBar} pointerEvents="box-none">
                <View style={{ flex: 1 }} pointerEvents="none">
                  {lessonTotal ? (
                    <Text style={styles.eyebrow}>
                      Lesson {lessonIndex}/{lessonTotal}
                    </Text>
                  ) : null}
                  <Text style={styles.title} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable style={styles.iconBtn} onPress={openFullscreen} hitSlop={10}>
                  <FontAwesome name="expand" size={16} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.center} pointerEvents="box-none">
                {buffering ? (
                  <View style={styles.spinnerWrap}>
                    <ActivityIndicator color={colors.white} size="large" />
                  </View>
                ) : (
                  <Pressable style={styles.playBtn} onPress={togglePlay}>
                    <FontAwesome
                      name={isPlaying ? 'pause' : 'play'}
                      size={22}
                      color={colors.white}
                      style={isPlaying ? null : { marginLeft: 3 }}
                    />
                  </Pressable>
                )}
              </View>

              <View style={styles.bottomBar}>
                <Text style={styles.time}>{formatTime(positionMs)}</Text>
                <Pressable
                  style={styles.track}
                  onLayout={(e) => {
                    trackWidth.current = e.nativeEvent.layout.width;
                  }}
                  onPress={onTrackPress}
                  onPressIn={() => setSeeking(true)}
                  onPressOut={() => setSeeking(false)}>
                  <View style={styles.trackBg} />
                  <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                  <View style={[styles.thumb, { left: `${Math.min(100, progress * 100)}%` }]} />
                </Pressable>
                <Text style={styles.time}>{formatTime(durationMs)}</Text>
                <Pressable style={styles.smallPlay} onPress={togglePlay} hitSlop={8}>
                  <FontAwesome
                    name={isPlaying ? 'pause' : 'play'}
                    size={12}
                    color={colors.white}
                  />
                </Pressable>
              </View>
            </LinearGradient>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#050B18',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(27,94,245,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  spinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  time: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 34,
  },
  track: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  trackBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    backgroundColor: colors.white,
    top: 6,
  },
  smallPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
