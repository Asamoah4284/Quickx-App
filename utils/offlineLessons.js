import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { API_BASE } from '@/constants/api';
import { fetchLessonDownload } from '@/utils/catalog';

/**
 * Offline lesson videos. Files live in the app's document directory (not visible to other apps);
 * an index in AsyncStorage tracks owner, course/lesson titles and the 30-day offline licence expiry
 * issued by GET /courses/:id/lessons/:lessonId/download. Expired downloads are deleted on access.
 */
const INDEX_KEY = 'quickx.offlineLessons';
const DIR_NAME = 'offline-lessons';

export const offlineSupported = Platform.OS === 'ios' || Platform.OS === 'android';

function keyOf(courseId, lessonId) {
  return `${courseId}:${lessonId}`;
}

function lessonsDir() {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function readIndex() {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeIndex(index) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

function safeDelete(uri) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // already gone
  }
}

function isUsable(entry, userId) {
  if (!entry || (userId && entry.userId && String(entry.userId) !== String(userId))) return false;
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) return false;
  try {
    return new File(entry.uri).exists;
  } catch {
    return false;
  }
}

/** Download a lesson video for offline playback. Throws a user-friendly Error on failure. */
export async function downloadLesson({ courseId, lessonId, token, userId, onProgress }) {
  if (!offlineSupported) throw new Error('Offline downloads are available in the iOS and Android app.');

  const grant = await fetchLessonDownload(courseId, lessonId, token);
  const origin = API_BASE.replace(/\/api\/?$/, '');
  const path = grant.streamPath || grant.url;
  if (!path) throw new Error('This lesson can’t be downloaded.');
  const url = path.startsWith('http') ? path : `${origin}${path}`;
  const sendAuth = !path.startsWith('http'); // only our API stream needs the bearer token

  const safeName = `${String(courseId)}_${String(lessonId)}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const destination = new File(lessonsDir(), `${safeName}.mp4`);

  let file;
  try {
    file = await File.downloadFileAsync(url, destination, {
      idempotent: true,
      headers: sendAuth ? { Authorization: `Bearer ${token}` } : undefined,
      onProgress: ({ bytesWritten, totalBytes }) => {
        if (totalBytes > 0) onProgress?.(Math.min(1, bytesWritten / totalBytes));
      },
    });
  } catch (err) {
    safeDelete(destination.uri);
    throw new Error('Download failed. Try again on a stable Wi-Fi connection.');
  }

  const index = await readIndex();
  index[keyOf(courseId, lessonId)] = {
    courseId: String(courseId),
    lessonId: String(lessonId),
    courseTitle: grant.courseTitle || '',
    lessonTitle: grant.lessonTitle || '',
    uri: file.uri,
    size: file.size || null,
    userId: userId ? String(userId) : null,
    savedAt: new Date().toISOString(),
    expiresAt: grant.offlineLicenseExpiresAt || null,
  };
  await writeIndex(index);
  return index[keyOf(courseId, lessonId)];
}

/** The saved lesson for this user, or null. Cleans up expired/missing entries. */
export async function getOfflineLesson(courseId, lessonId, userId) {
  if (!offlineSupported) return null;
  const index = await readIndex();
  const key = keyOf(courseId, lessonId);
  const entry = index[key];
  if (!entry) return null;
  if (isUsable(entry, userId)) return entry;
  if (!userId || !entry.userId || String(entry.userId) === String(userId)) {
    safeDelete(entry.uri);
    delete index[key];
    await writeIndex(index);
  }
  return null;
}

export async function listOfflineLessons(userId) {
  if (!offlineSupported) return [];
  const index = await readIndex();
  let changed = false;
  const list = [];
  for (const [key, entry] of Object.entries(index)) {
    if (userId && entry.userId && String(entry.userId) !== String(userId)) continue;
    if (isUsable(entry, userId)) {
      list.push(entry);
    } else {
      safeDelete(entry.uri);
      delete index[key];
      changed = true;
    }
  }
  if (changed) await writeIndex(index);
  return list.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

export async function removeOfflineLesson(courseId, lessonId) {
  const index = await readIndex();
  const key = keyOf(courseId, lessonId);
  if (index[key]) {
    safeDelete(index[key].uri);
    delete index[key];
    await writeIndex(index);
  }
}

export async function removeAllOfflineLessons(userId) {
  const index = await readIndex();
  for (const [key, entry] of Object.entries(index)) {
    if (!userId || !entry.userId || String(entry.userId) === String(userId)) {
      safeDelete(entry.uri);
      delete index[key];
    }
  }
  await writeIndex(index);
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
