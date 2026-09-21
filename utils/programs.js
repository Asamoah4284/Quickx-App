import { api } from '@/constants/api';
import { completeMoolrePayment, detectMomoNetwork } from '@/utils/moolre';

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.programs)) return data.programs;
  if (Array.isArray(data?.enrollments)) return data.enrollments;
  return [];
}

const TYPE_META = {
  forex: { label: 'Forex', icon: 'line-chart', color: '#1B5EF5' },
  crypto: { label: 'Crypto', icon: 'money', color: '#F69C08' },
  webdev: { label: 'Web Dev', icon: 'code', color: '#1EBE57' },
};

export function formatProgramTrack(courseType) {
  return TYPE_META[courseType]?.label || courseType || 'Creator track';
}

export function mapProgram(raw) {
  return {
    id: String(raw._id || raw.id),
    name: raw.name || 'Creator program',
    slug: raw.slug || '',
    description: raw.description || '',
    courseType: raw.courseType || '',
    price: Number(raw.price || 0),
    currency: raw.currency || 'GHS',
    billingPeriod: raw.billingPeriod || 'one_time',
    isActive: raw.isActive !== false,
  };
}

export function mapEnrollment(raw) {
  const program = raw.programId && typeof raw.programId === 'object' ? mapProgram(raw.programId) : null;
  return {
    id: String(raw._id || raw.id),
    status: raw.status || 'active',
    startsAt: raw.startsAt || raw.createdAt || null,
    endsAt: raw.endsAt || null,
    program,
    programId: program?.id || String(raw.programId || ''),
  };
}

export async function fetchPrograms() {
  const data = await api('/programs');
  return asList(data).map(mapProgram);
}

export async function fetchProgram(slug) {
  const data = await api(`/programs/${slug}`);
  return mapProgram(data);
}

export async function fetchMyProgramEnrollments(token) {
  const data = await api('/programs/user/me', { token });
  return asList(data).map(mapEnrollment);
}

export async function joinProgram({ token, programId, amount, phone, email, network, otpcode, sessionid, onPending }) {
  const momo = String(phone || '').replace(/\D/g, '');
  const normalized = momo.length === 10 && momo.startsWith('0') ? momo : `0${momo.slice(-9)}`;
  return completeMoolrePayment({
    token,
    body: {
      itemType: 'program',
      itemId: programId,
      amount,
      transactionId: `qx_prog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      momoNumber: normalized,
      network: network || detectMomoNetwork(normalized),
      shippingAddress: {
        email: email || `${normalized}@phone.quickxlearn.com`,
        phone: normalized,
      },
      otpcode,
      sessionid,
    },
    onPending,
  });
}
