import { api } from '@/constants/api';

export async function saveMomoDetails(token, { momoNumber, network }) {
  return api('/withdrawals/momo-details', {
    method: 'POST',
    token,
    body: { momoNumber, network },
  });
}

export async function fetchMomoDetails(token) {
  return api('/withdrawals/momo-details', { token });
}

export async function requestReferralWithdrawal(token) {
  return api('/withdrawals/withdraw', { method: 'POST', token, body: {} });
}

export async function fetchWithdrawalHistory(token) {
  return api('/withdrawals/history', { token });
}
