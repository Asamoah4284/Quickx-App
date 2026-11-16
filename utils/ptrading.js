import { api } from '@/constants/api';

export const PIE_MARKETS = [
  { id: 'all', label: 'All markets' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'indices', label: 'Indices' },
];

export const PIE_STATUSES = [
  { id: 'funding', label: 'Funding' },
  { id: 'trading', label: 'Trading' },
  { id: 'settled', label: 'Settled' },
  { id: 'all', label: 'All' },
];

export const PIE_RISK_LEVELS = ['Low', 'Moderate', 'High', 'Aggressive'];

export const STATUS_META = {
  funding: { label: 'Funding', color: '#1B5EF5', bg: 'rgba(27,94,245,0.1)', icon: 'hourglass-half' },
  trading: { label: 'Trading live', color: '#B7791F', bg: 'rgba(246,156,8,0.14)', icon: 'line-chart' },
  settled: { label: 'Settled', color: '#13803C', bg: 'rgba(30,190,87,0.12)', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: 'ban' },
};

export const RISK_COLORS = {
  Low: '#1EBE57',
  Moderate: '#1B5EF5',
  High: '#F69C08',
  Aggressive: '#E04E52',
};

function authToken(token) {
  return token && token !== 'local' ? token : undefined;
}

export function pieId(pie) {
  return String(pie?._id || pie?.id || '');
}

export function fundingPercent(pie) {
  const target = Number(pie?.targetAmount) || 0;
  if (!target) return 0;
  return Math.min(100, Math.round(((Number(pie?.raisedAmount) || 0) / target) * 100));
}

export function isFundingOpen(pie) {
  if (pie?.status !== 'funding') return false;
  if (pie.fundingDeadline && new Date(pie.fundingDeadline).getTime() < Date.now()) return false;
  return true;
}

export function deadlineLabel(pie) {
  if (!pie?.fundingDeadline) return 'Open until filled';
  const ms = new Date(pie.fundingDeadline).getTime() - Date.now();
  if (Number.isNaN(ms)) return 'Open until filled';
  if (ms <= 0) return 'Funding closed';
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;
  const hours = Math.max(1, Math.floor(ms / 3600000));
  return `${hours} hour${hours === 1 ? '' : 's'} left`;
}

export async function fetchPies({ status = 'funding', market = 'all', tutorId, token } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (market) params.set('market', market);
  if (tutorId) params.set('tutorId', tutorId);
  params.set('limit', '50');
  const data = await api(`/ptrading?${params.toString()}`, { token: authToken(token) });
  return {
    pies: Array.isArray(data?.pies) ? data.pies : [],
    stats: data?.stats || null,
  };
}

export async function fetchPie(id, token) {
  const data = await api(`/ptrading/${id}`, { token: authToken(token) });
  return {
    pie: data?.pie || null,
    deposits: Array.isArray(data?.deposits) ? data.deposits : [],
    userDeposit: data?.userDeposit || null,
    isOwner: Boolean(data?.isOwner),
  };
}

export async function fetchMySlices(token) {
  const data = await api('/ptrading/my-slices', { token });
  return {
    deposits: Array.isArray(data?.deposits) ? data.deposits.filter((d) => d.pieId) : [],
    createdPies: Array.isArray(data?.createdPies) ? data.createdPies : [],
  };
}

export async function createPie(token, body) {
  return api('/ptrading', { method: 'POST', token, body });
}

export async function depositToPie(token, id, amount) {
  return api(`/ptrading/${id}/deposit`, { method: 'POST', token, body: { amount: Number(amount) } });
}

export async function startPieTrading(token, id) {
  return api(`/ptrading/${id}/start-trading`, { method: 'POST', token, body: {} });
}

export async function postPieUpdate(token, id, update) {
  return api(`/ptrading/${id}/trade-updates`, { method: 'POST', token, body: update });
}

export async function settlePie(token, id, { outcome, finalPnlPercent, settlementNotes }) {
  return api(`/ptrading/${id}/settle`, {
    method: 'POST',
    token,
    body: { outcome, finalPnlPercent: Number(finalPnlPercent), settlementNotes },
  });
}

export async function cancelPie(token, id, reason) {
  return api(`/ptrading/${id}/cancel`, { method: 'POST', token, body: { reason } });
}
