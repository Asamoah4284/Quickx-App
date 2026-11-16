import { api } from '@/constants/api';
import { completeMoolrePayment, detectMomoNetwork } from '@/utils/moolre';

export function normalizeMomoPhone(phone) {
  const momo = String(phone || '').replace(/\D/g, '');
  if (!momo) return '';
  return momo.length === 10 && momo.startsWith('0') ? momo : `0${momo.slice(-9)}`;
}

function makeTransactionId(prefix) {
  return `qx_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function initializePurchase({
  token,
  itemType,
  itemId,
  amount,
  phone,
  email,
  referralCode,
  couponId,
  offerOptionId,
  items,
  network,
  otpcode,
  sessionid,
  onPending,
}) {
  const momoNumber = normalizeMomoPhone(phone);
  const body = {
    itemType,
    amount: Number(amount),
    transactionId: makeTransactionId(itemType),
    momoNumber,
    network: network || detectMomoNetwork(momoNumber),
    shippingAddress: {
      email: email || (momoNumber ? `${momoNumber}@phone.quickxlearn.com` : ''),
      phone: momoNumber,
    },
    referralCode: String(referralCode || '').trim().toUpperCase(),
    otpcode,
    sessionid,
  };
  // Server re-checks discounted course prices against the coupon.
  if (couponId) body.couponId = couponId;

  if (itemType === 'book_cart') {
    body.items = items;
  } else {
    body.itemId = itemId;
  }
  if (offerOptionId) body.offerOptionId = offerOptionId;

  return completeMoolrePayment({ token, body, onPending });
}

export async function validateCoupon(code, price) {
  return api('/validate-coupon', {
    method: 'POST',
    body: { code: String(code || '').trim(), price: Number(price) },
  });
}

export async function repairCourseAccess(token) {
  return api('/payments/repair-course-access', { method: 'POST', token, body: {} });
}

export function applyDiscount(price, discountPercent) {
  const base = Number(price) || 0;
  const pct = Number(discountPercent) || 0;
  const final = base * (1 - pct / 100);
  return Math.max(0.01, Number(final.toFixed(2)));
}
