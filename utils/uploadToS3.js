import { API_BASE } from '@/constants/api';

function apiOrigin() {
  return API_BASE.replace(/\/api\/?$/, '');
}

function publicUrlFromSigned(signedUrl) {
  return String(signedUrl || '').split('?')[0];
}

function resolveContentType({ mimeType, fileName, type }) {
  const raw = String(mimeType || '').trim();
  const name = String(fileName || '').toLowerCase();

  if (type === 'video') {
    if (raw.startsWith('video/')) return raw;
    if (name.endsWith('.webm')) return 'video/webm';
    if (name.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }

  if (raw.length > 0) return raw;
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function uploadFileToS3({ uri, token, type = 'image', mimeType, fileName, onProgress }) {
  if (!uri || !token) return '';

  const contentType = resolveContentType({ mimeType, fileName, type });
  const origin = apiOrigin();
  const endpoint = type === 'video' ? '/s3VideoUrl' : '/s3Url';

  const presignRes = await fetch(`${origin}${endpoint}?contentType=${encodeURIComponent(contentType)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const presignData = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) {
    throw new Error(presignData.message || 'Could not start upload');
  }

  const uploadUrl = presignData.url;
  if (!uploadUrl) throw new Error('Missing upload URL');

  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.send(blob);
  });

  return publicUrlFromSigned(uploadUrl);
}
