import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, t } from '@/constants/theme';
import { themed } from '@/utils/themedStyles';

// The video area is dark in both themes, so its controls stay white.
const MEDIA_FG = '#ffffff';

function formatTime(ms = 0) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * The lesson video: a rounded 16:9 frame with our own controls. The screen around it shows
 * the title and the back button, so the overlay only has playback controls.
 */
export function LessonVideoPlayer({ uri, style }) {
  const videoRef = useRef(null);
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

  const togglePlay = () => {
    setControlsVisible(true);
    if (!loaded && !isPlaying) {
      player.play();
      return;
    }
    if (isPlaying) player.pause();
    else player.play();
  };

  const onTrackPress = (event) => {
    setControlsVisible(true);
    if (!player.duration) return;
    const ratio = event.nativeEvent.locationX / (trackWidth.current || 1);
    player.currentTime = Math.max(0, Math.min(player.duration, ratio * player.duration));
  };

  const openFullscreen = async () => {
    setControlsVisible(true);
    try {
      await videoRef.current?.enterFullscreen();
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.frame, style]}>
      <VideoView ref={videoRef} style={styles.video} player={player} nativeControls={false} contentFit="contain" />

      <Pressable style={StyleSheet.absoluteFill} onPress={() => setControlsVisible((v) => !v)}>
        {controlsVisible || buffering ? (
          <LinearGradient
            colors={['rgba(5,8,15,0.55)', 'transparent', 'rgba(5,8,15,0.8)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none">
            <View style={styles.topBar} pointerEvents="box-none">
              <Pressable style={styles.iconBtn} onPress={openFullscreen} hitSlop={10} accessibilityLabel="Full screen">
                <FontAwesome name="expand" size={15} color={MEDIA_FG} />
              </Pressable>
            </View>

            <View style={styles.center} pointerEvents="box-none">
              {buffering ? (
                <View style={styles.spinnerWrap}>
                  <ActivityIndicator color={MEDIA_FG} size="large" />
                </View>
              ) : (
                <Pressable style={styles.playBtn} onPress={togglePlay} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
                  <FontAwesome name={isPlaying ? 'pause' : 'play'} size={22} color={MEDIA_FG} style={isPlaying ? null : { marginLeft: 3 }} />
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
                onPressOut={() => setSeeking(false)}
                accessibilityLabel="Seek">
                <View style={styles.trackBg} />
                <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                <View style={[styles.thumb, { left: `${Math.min(100, progress * 100)}%` }]} />
              </Pressable>
              <Text style={styles.time}>{formatTime(durationMs)}</Text>
            </View>
          </LinearGradient>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    frame: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: radii.xl,
      overflow: 'hidden',
      backgroundColor: '#000',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.line,
    },
    video: { width: '100%', height: '100%', backgroundColor: '#000' },
    topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.md },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playBtn: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(27,94,245,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    spinnerWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    time: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 34 },
    track: { flex: 1, height: 28, justifyContent: 'center' },
    trackBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
    trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: t.brand500 },
    thumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, marginLeft: -6, backgroundColor: MEDIA_FG, top: 8 },
  })
);
