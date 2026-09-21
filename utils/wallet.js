import { api } from '@/constants/api';
import { detectMomoNetwork } from '@/utils/moolre';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(phone) {
  const momo = String(phone || '').replace(/\D/g, '');
  if (!momo) return '';
  return momo.length === 10 && momo.startsWith('0') ? momo : `0${momo.slice(-9)}`;
}

export async function fetchWallet(token) {
  return api('/wallet', { token });
}

export async function topUpWallet({
  token,
  amount,
  phone,
  network,
  otpcode,
  sessionid,
  onPending,
  maxAttempts = 12,
  intervalMs = 3000,
}) {
  const momoNumber = normalizePhone(phone);
  const initiated = await api('/wallet/topup/initiate', {
    method: 'POST',
    token,
    body: {
      amount: Number(amount),
      momoNumber,
      network: network || detectMomoNetwork(momoNumber),
      otpcode,
      sessionid,
    },
  });

  if (initiated.completed) return initiated;
  onPending?.(initiated);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(intervalMs);
    const verified = await api('/wallet/topup/verify', {
      method: 'POST',
      token,
      body: { transactionId: initiated.transactionId },
    });
    if (verified.completed) return verified;
    if (verified.failed) {
      throw new Error('Top-up failed or was cancelled');
    }
  }

  throw new Error('Top-up is still pending. Approve on your phone, then refresh your wallet.');
}

export async function payFromWallet({ token, amount, label }) {
  return api('/wallet/pay', {
    method: 'POST',
    token,
    body: { amount: Number(amount), label },
  });
}

export async function withdrawWallet({ token, amount, phone, network }) {
  const momoNumber = normalizePhone(phone);
  return api('/wallet/withdraw', {
    method: 'POST',
    token,
    body: {
      amount: Number(amount),
      momoNumber,
      network,
    },
  });
}
