import { api } from '@/constants/api';

/** Public website origin used for shareable certificate verification links. */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://quick-x.com').replace(/\/$/, '');

export function certificateUrl(code) {
  return `${WEB_URL}/certificates/${code}`;
}

export async function fetchMyCertificates(token) {
  const data = await api('/certificates/me', { token });
  return {
    certificates: Array.isArray(data?.certificates) ? data.certificates : [],
    completedWithoutCertificate: Number(data?.completedWithoutCertificate || 0),
  };
}

export async function verifyCertificate(code) {
  const data = await api(`/certificates/verify/${encodeURIComponent(code)}`);
  return data?.certificate || null;
}
