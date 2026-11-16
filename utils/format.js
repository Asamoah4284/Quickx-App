import { cedis, money } from '@/utils/currency';

export { cedis, money };

/** Exact cedis with a space, kept for older screens ("GH₵ 120"). */
export function formatCurrency(amount) {
  return cedis(amount);
}

/** A catalog price, or "Free". */
export function formatPriceCedi(amount) {
  if (!amount || Number(amount) === 0) return 'Free';
  return money(amount);
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Whole days from now until `value` (0 if it has passed). */
export function daysLeft(value) {
  if (!value) return 0;
  const ms = new Date(value).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

/** 30 days → "1 month", 365 → "1 year". */
export function durationLabel(days) {
  const d = Number(days) || 0;
  if (d && d % 365 === 0) return d === 365 ? '1 year' : `${d / 365} years`;
  if (d && d % 30 === 0) return d === 30 ? '1 month' : `${d / 30} months`;
  if (d && d % 7 === 0) return d === 7 ? '1 week' : `${d / 7} weeks`;
  return d === 1 ? '1 day' : `${d} days`;
}

export function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

/** "Good morning" etc. */
export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
