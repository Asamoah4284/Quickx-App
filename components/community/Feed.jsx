import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import PostCard from '@/components/community/PostCard';
import { BASE, useCommunity } from '@/components/community/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Avatar, Button, Card, Chips, Icon, Input, Rise, Row, Txt } from '@/components/ui/kit';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, assetUrl } from '@/constants/api';
import { t } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { haptics } from '@/utils/haptics';
import { uploadFileToS3 } from '@/utils/uploadToS3';

const MAX_IMAGES = 4;

function Composer({ roomId, onPosted }) {
  const { token, user } = useAppState();
  const { me } = useCommunity();
  const [body, setBody] = useState('');
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [announcement, setAnnouncement] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  if (me.muted) return <Alert tone="warn">You are muted in this community. You can read posts but not write.</Alert>;

  const addImage = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to add a chart or screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: MAX_IMAGES - media.length });
    if (result.canceled) return;
    setUploading(true);
    try {
      for (const asset of result.assets.slice(0, MAX_IMAGES - media.length)) {
        const url = await uploadFileToS3({ uri: asset.uri, token, type: 'image', mimeType: asset.mimeType, fileName: asset.fileName });
        if (url) setMedia((list) => [...list, { url, type: 'image', name: asset.fileName || 'image' }]);
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!body.trim() && !media.length) return;
    setBusy(true);
    setError('');
    try {
      const data = await api(`${BASE}/posts`, {
        method: 'POST',
        token,
        body: { body, media, roomId: roomId || undefined, type: announcement ? 'announcement' : 'post' },
      });
      haptics.success();
      onPosted(data.post);
      setBody('');
      setMedia([]);
      setAnnouncement(false);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Could not post. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Card onPress={() => setOpen(true)} padded={false}>
        <Row gap={12} style={{ padding: 14 }}>
          <Avatar uri={assetUrl(user?.profilePicture)} name={user?.fullName} size={36} />
          <Txt size={14.5} color={t.fgSubtle} style={{ flex: 1 }}>
            {me.isModerator ? 'Share an update with your members' : 'Share a trade, a win or a question'}
          </Txt>
          <Icon name="image" size={18} color={t.fgSubtle} />
        </Row>
      </Card>
    );
  }

  return (
    <Card>
      <Input multiline autoFocus value={body} onChangeText={setBody} placeholder="What do you want to share?" maxLength={5000} />
      {media.length ? (
        <Row gap={8} style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {media.map((m, i) => (
            <View key={m.url} style={styles.thumb}>
              <Image source={{ uri: assetUrl(m.url) }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Pressable onPress={() => setMedia((list) => list.filter((_, j) => j !== i))} style={styles.remove} hitSlop={6} accessibilityLabel="Remove image">
                <Icon name="x" size={12} color={t.white} />
              </Pressable>
            </View>
          ))}
        </Row>
      ) : null}
      {error ? <Alert style={{ marginTop: 10 }}>{error}</Alert> : null}
      <Row justify="space-between" style={{ marginTop: 12 }}>
        <Row gap={4}>
          <Button variant="ghost" size="sm" icon="image" label={uploading ? 'Uploading' : 'Image'} loading={uploading} disabled={media.length >= MAX_IMAGES} onPress={addImage} />
          {me.isModerator && !roomId ? (
            <PressableScale haptic="select" onPress={() => setAnnouncement((v) => !v)} style={[styles.toggle, announcement && { borderColor: t.warn, backgroundColor: t.warnSoft }]}>
              <Icon name="volume-2" size={14} color={announcement ? t.warn : t.fgMuted} />
              <Txt size={12.5} weight="semibold" color={announcement ? t.warn : t.fgMuted}>
                Announcement
              </Txt>
            </PressableScale>
          ) : null}
        </Row>
        <Row gap={6}>
          <Button variant="ghost" size="sm" label="Cancel" onPress={() => setOpen(false)} />
          <Button size="sm" label="Post" loading={busy} disabled={!body.trim() && !media.length} onPress={submit} />
        </Row>
      </Row>
    </Card>
  );
}

export default function Feed() {
  const { token } = useAppState();
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [posts, setPosts] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`${BASE}/rooms`, { token })
      .then((data) => setRooms(data.rooms || []))
      .catch(() => {});
  }, [token]);

  const load = useCallback(
    (before) => {
      const q = [roomId ? `roomId=${roomId}` : '', before ? `before=${encodeURIComponent(before)}` : ''].filter(Boolean).join('&');
      return api(`${BASE}/posts${q ? `?${q}` : ''}`, { token });
    },
    [roomId, token]
  );

  useEffect(() => {
    let cancelled = false;
    setPosts(null);
    setError('');
    load()
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setCursor(data.nextCursor);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await load(cursor);
      setPosts((list) => [...list, ...data.posts.filter((p) => !list.some((x) => x._id === p._id))]);
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const activeRoom = rooms.find((r) => r._id === roomId);

  return (
    <View style={{ gap: 14 }}>
      {rooms.length ? (
        <Chips items={[{ value: '', label: 'Main feed' }, ...rooms.map((r) => ({ value: r._id, label: r.name }))]} value={roomId} onChange={setRoomId} />
      ) : null}
      {activeRoom?.description ? (
        <Txt size={13} color={t.fgMuted}>
          {activeRoom.description}
        </Txt>
      ) : null}
      <Composer roomId={roomId} onPosted={(post) => setPosts((list) => [post, ...(list || [])])} />
      {error ? <Alert>{error}</Alert> : null}
      {posts === null && !error ? (
        <>
          <Skeleton height={160} radius={20} />
          <Skeleton height={220} radius={20} />
        </>
      ) : null}
      {posts && !posts.length ? <EmptyState icon="comments-o" title="Nothing here yet" subtitle="Be the first to post." /> : null}
      {(posts || []).map((post, i) => (
        <Rise key={post._id} index={i}>
          <PostCard
            post={post}
            onChange={(next) => setPosts((list) => list.map((p) => (p._id === next._id ? next : p)))}
            onRemove={(id) => setPosts((list) => list.filter((p) => p._id !== id))}
          />
        </Rise>
      ))}
      {cursor ? <Button variant="secondary" label="Load older posts" loading={loadingMore} onPress={loadMore} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: t.ink700 },
  remove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: t.line },
});
