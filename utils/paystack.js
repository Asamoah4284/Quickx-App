import * as WebBrowser from 'expo-web-browser';

import { api } from '@/constants/api';

/** The website page Paystack returns to sends people back here (Frontend PaymentDone.jsx). */
const RETURN_URL = 'quickxlearn://payment-done';

/** Paystack says the payment did not go through, or never started. */
const NOT_PAID = new Set(['NOT_SUCCESSFUL', 'NOT_FOUND']);

/**
 * Pay with Mobile Money or card through Paystack.
 *
 * 1. The server prices the order and opens a Paystack checkout (the amount never comes from the phone).
 * 2. The checkout opens in a secure in-app browser.
 * 3. When the browser closes, `confirm(reference)` asks the matching endpoint to verify and deliver.
 *
 * Returns one of:
 *   { status: 'paid', result }        delivered
 *   { status: 'cancelled' }           closed before paying
 *   { status: 'pending', reference, message }   paid maybe, not confirmed yet: offer "Check payment again"
 * Throws if the checkout could not be opened.
 */
export async function payWithPaystack({ token, purpose, body = {}, confirm }) {
  const init = await api('/payments/paystack/initialize', {
    method: 'POST',
    token,
    body: { purpose, ...body },
  });

  const session = await WebBrowser.openAuthSessionAsync(init.url, RETURN_URL, {
    showTitle: true,
    enableBarCollapsing: true,
  });
  const returned = session.type === 'success';

  try {
    const result = await confirm(init.reference);
    return { status: 'paid', result, reference: init.reference };
  } catch (error) {
    // Closed the page without paying: nothing to report.
    if (!returned && NOT_PAID.has(error.code)) return { status: 'cancelled', reference: init.reference };
    // The server moved the money somewhere safe (for example into the wallet) and says why.
    if (error.code === 'MOVED_TO_WALLET') return { status: 'paid', result: { message: error.message, moved: true }, reference: init.reference };
    return {
      status: 'pending',
      reference: init.reference,
      message: NOT_PAID.has(error.code)
        ? 'We have not received this payment yet. If you approved it on your phone, wait a moment and check again.'
        : error.message,
    };
  }
}

/** Try confirming a reference again (after "Check payment again"). Same result shape. */
export async function confirmAgain(reference, confirm) {
  try {
    const result = await confirm(reference);
    return { status: 'paid', result, reference };
  } catch (error) {
    if (error.code === 'MOVED_TO_WALLET') return { status: 'paid', result: { message: error.message, moved: true }, reference };
    return { status: 'pending', reference, message: error.message };
  }
}

/** Confirm calls for each thing you can buy. Each returns what the website endpoint returns. */
export const confirmers = {
  product: (token, key, couponCode) => (reference) =>
    api(`/products/${key}/purchase/paystack`, { method: 'POST', token, body: { reference, couponCode: couponCode || undefined } }),

  event: (token, id, attendee = {}) => (reference) =>
    api(`/events/${id}/buy-ticket`, { method: 'POST', token, body: { ...attendee, transactionId: reference } }),

  pie: (token, id, amount) => (reference) =>
    api(`/ptrading/${id}/deposit`, { method: 'POST', token, body: { amount: Number(amount), acceptRisk: true, transactionId: reference } }),

  book: (token, order) => (reference) =>
    api('/payments/initialize', {
      method: 'POST',
      token,
      body: { ...order, transactionId: reference, paymentMethod: 'paystack', currency: 'GHS' },
    }),
};
