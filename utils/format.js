export function formatCurrency(amount, currency = 'GH₵') {
  const value = Number(amount) || 0;
  return `${currency} ${value.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatPriceCedi(amount) {
  if (amount === 0) return 'Free';
  return `₵${amount}`;
}
