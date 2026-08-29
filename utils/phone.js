export const LOCAL_OTP = '123456';

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeGhPhone(value) {
  let digits = digitsOnly(value);
  if (digits.startsWith('233') && digits.length >= 12) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.length === 9 && !digits.startsWith('0')) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 10);
}

export function isValidGhPhone(value) {
  return /^0\d{9}$/.test(normalizeGhPhone(value));
}

export function formatGhPhone(value) {
  const digits = digitsOnly(value).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function formatIntlPhone(value) {
  const digits = normalizeGhPhone(value);
  if (digits.length < 4) return '+233';
  return `+233 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim();
}

