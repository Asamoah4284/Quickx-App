import { api } from '@/constants/api';

export async function loginWithEmail(email, password) {
  return api('/users/login', {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase(), password },
  });
}

export async function requestPasswordReset(email) {
  return api('/users/forgot-password', {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase() },
  });
}

export async function resetPassword(token, password) {
  return api('/users/reset-password', {
    method: 'POST',
    body: { token, password },
  });
}

export function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(String(password || ''));
}
