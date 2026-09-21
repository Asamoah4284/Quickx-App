import { api } from '@/constants/api';

export async function fetchReferrals(token) {
  return api('/users/referrals', { token });
}
