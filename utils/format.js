import { toGhs } from '@/utils/currency';

/** Format an amount that is already in GHS (wallet, pies, events, earnings). */
export function formatCurrency(amount, currency = 'GH₵') {
  const value = Number(amount) || 0;
  return `${currency} ${value.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Format a catalog price (course, book, program, subscription) — converted to the GHS actually charged. */
export function formatPriceCedi(amount) {
  if (!amount || Number(amount) === 0) return 'Free';
  const ghs = toGhs(amount);
  return `GH₵${ghs.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
