import { api } from '@/constants/api';

const NETWORKS = [
  { id: 'MTN', label: 'MTN MoMo' },
  { id: 'Vodafone', label: 'Telecel Cash' },
  { id: 'AirtelTigo', label: 'AT Money' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMomoNetworks() {
  return NETWORKS;
}

export function detectMomoNetwork(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const local = digits.length >= 9 ? digits.slice(-9) : digits;
  const prefix = local.slice(0, 2);
  if (['24', '54', '55', '59'].includes(prefix)) return 'MTN';
  if (['20', '50'].includes(prefix)) return 'Vodafone';
  if (['27', '57', '26', '56'].includes(prefix)) return 'AirtelTigo';
  return 'MTN';
}

export async function initiateMoolrePayment({ token, body }) {
  return api('/payments/moolre/initiate', {
    method: 'POST',
    token,
    body,
  });
}

export async function verifyMoolrePayment({ token, transactionId, otpcode, sessionid }) {
  return api('/payments/moolre/verify', {
    method: 'POST',
    token,
    body: { transactionId, otpcode, sessionid },
  });
}

export async function completeMoolrePayment({
  token,
  body,
  onPending,
  maxAttempts = 12,
  intervalMs = 3000,
}) {
  const initiated = await initiateMoolrePayment({ token, body });
  if (initiated.completed) return initiated;

  onPending?.(initiated);

  let sessionId = initiated.sessionId || body.sessionid || null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(intervalMs);
    const verified = await verifyMoolrePayment({
      token,
      transactionId: initiated.transactionId,
      sessionid: sessionId,
    });
    if (verified.completed) return verified;
    if (verified.failed) {
      throw new Error(verified.message || 'Payment failed or was cancelled');
    }
    if (verified.requiresOtp) {
      return { ...verified, pending: true, transactionId: initiated.transactionId, sessionId };
    }
    sessionId = verified.sessionId || sessionId;
  }

  throw new Error('Payment is still pending. Approve on your phone, then try again.');
}
