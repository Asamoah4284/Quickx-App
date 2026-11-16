import { api } from '@/constants/api';

export const NETWORKS = [
  { value: 'MTN', label: 'MTN' },
  { value: 'Vodafone', label: 'Telecel' },
  { value: 'AirtelTigo', label: 'AirtelTigo' },
];

/** Guess the network from a Ghana number (024, 054… MTN; 020, 050 Telecel; 026, 027… AirtelTigo). */
export function guessNetwork(phone) {
  const local = String(phone || '').replace(/\D/g, '').replace(/^233/, '0');
  const prefix = local.slice(0, 3);
  if (['024', '025', '053', '054', '055', '059'].includes(prefix)) return 'MTN';
  if (['020', '050'].includes(prefix)) return 'Vodafone';
  if (['026', '027', '056', '057'].includes(prefix)) return 'AirtelTigo';
  return '';
}

/** Balance, referral earnings, withdrawal rules and history. */
export function fetchWallet(token) {
  return api('/wallet', { token });
}

/** Ask for wallet money to be sent to mobile money. The admin pays it out. */
export function withdrawWallet(token, { amount, momoNumber, network }) {
  return api('/wallet/withdraw', { method: 'POST', token, body: { amount: Number(amount), momoNumber, network } });
}

/** Ask for all referral earnings to be sent to mobile money. */
export function withdrawReferral(token, { momoNumber, network }) {
  return api('/withdrawals/withdraw', { method: 'POST', token, body: { momoNumber, network } });
}
