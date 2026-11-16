/** Signal helpers, the same rules as the website (features/signals/SignalCard.jsx). */

export const STATUS_META = {
  active: { label: 'Live', tone: 'up' },
  tp_hit: { label: 'Target hit', tone: 'up' },
  sl_hit: { label: 'Stopped out', tone: 'down' },
  closed: { label: 'Closed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** Every level of a signal uses the same number of decimals, so 1.085 and 1.08750 line up. */
export function levelFormatter(values) {
  const decimals = Math.min(
    6,
    Math.max(0, ...values.filter((v) => v != null && v !== '').map((v) => (String(v).split('.')[1] || '').length))
  );
  return (v) => (v == null || v === '' ? '' : Number(v).toFixed(decimals));
}

/** "Buy now (market)", "Buy limit" … in the words a trading app uses. */
export function orderLabel(signal) {
  const type = String(signal.orderType || 'market').toLowerCase();
  if (type === 'market') return `${signal.direction === 'buy' ? 'Buy' : 'Sell'} now (market)`;
  return type.replace(/^\w/, (c) => c.toUpperCase());
}

export function rewardRatio(signal, tp) {
  const risk = Math.abs(Number(signal.entry) - Number(signal.stopLoss));
  if (!risk) return null;
  return Math.round((Math.abs(Number(tp) - Number(signal.entry)) / risk) * 10) / 10;
}

/** Plain text that pastes cleanly into MT4/MT5 notes, Telegram or WhatsApp. */
export function signalAsText(signal) {
  const tps = signal.takeProfits || [];
  const fmt = levelFormatter([signal.entry, signal.stopLoss, ...tps]);
  return [
    `${String(signal.direction).toUpperCase()} ${signal.pair}${signal.timeframe ? ` (${signal.timeframe})` : ''}`,
    `Order: ${orderLabel(signal)}`,
    `Entry: ${fmt(signal.entry)}`,
    `Stop loss: ${fmt(signal.stopLoss)}`,
    ...tps.map((tp, i) => `${tps.length > 1 ? `TP${i + 1}` : 'TP'}: ${fmt(tp)}`),
  ].join('\n');
}

/** Same check the server makes, shown while Maxwell types. Returns '' when the levels make sense. */
export function levelProblem(form) {
  if (form.entry === '' || form.stopLoss === '') return '';
  const entry = Number(form.entry);
  const sl = Number(form.stopLoss);
  const buy = form.direction === 'buy';
  if (buy ? sl >= entry : sl <= entry) {
    return buy ? 'For a buy, the stop loss must be below the entry.' : 'For a sell, the stop loss must be above the entry.';
  }
  const bad = [form.tp1, form.tp2, form.tp3].findIndex((tp) => tp !== '' && (buy ? Number(tp) <= entry : Number(tp) >= entry));
  if (bad >= 0) return `Target ${bad + 1} must be ${buy ? 'above' : 'below'} the entry for a ${form.direction}.`;
  return '';
}
