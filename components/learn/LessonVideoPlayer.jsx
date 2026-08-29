import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Audio, ResizeMode, Video } from 'expo-av';
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
  const [status, setStatus] = useState({});
  const [controlsVisible, setControlsVisible] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const hideTimer = useRef(null);
  const trackWidth = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setControlsVisible(true);
    setStatus({});
  }, [uri]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!controlsVisible || !status.isPlaying || seeking) return undefined;
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3200);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [controlsVisible, status.isPlaying, seeking, status.positionMillis]);

  const loaded = Boolean(status.isLoaded);
  const buffering = !loaded || (status.isBuffering && !status.isPlaying);
  const position = loaded ? status.positionMillis || 0 : 0;
  const duration = loaded ? status.durationMillis || 0 : 0;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  const revealControls = () => {
    setControlsVisible(true);
  };

  const togglePlay = async () => {
    revealControls();
    if (!videoRef.current || !loaded) return;
    if (status.isPlaying) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
  };

  const seekToRatio = async (ratio) => {
    if (!videoRef.current || !duration) return;
    const next = Math.max(0, Math.min(duration, ratio * duration));
    await videoRef.current.setPositionAsync(next);
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
      await videoRef.current?.presentFullscreenPlayer();
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.shell, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.frame}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri }}
          posterSource={posterUri ? { uri: posterUri } : undefined}
          usePoster={Boolean(posterUri)}
          posterStyle={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          useNativeControls={false}
          progressUpdateIntervalMillis={250}
          onPlaybackStatusUpdate={(next) => {
            if (!seeking) setStatus(next);
          }}
          onLoadStart={() => setStatus((prev) => ({ ...prev, isLoaded: false }))}
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
                      name={status.isPlaying ? 'pause' : 'play'}
                      size={22}
                      color={colors.white}
                      style={status.isPlaying ? null : { marginLeft: 3 }}
                    />
                  </Pressable>
                )}
              </View>

              <View style={styles.bottomBar}>
                <Text style={styles.time}>{formatTime(position)}</Text>
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
                <Text style={styles.time}>{formatTime(duration)}</Text>
                <Pressable style={styles.smallPlay} onPress={togglePlay} hitSlop={8}>
                  <FontAwesome
                    name={status.isPlaying ? 'pause' : 'play'}
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
