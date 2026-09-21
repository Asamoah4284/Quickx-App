import { api } from '@/constants/api';
import { resolveCourseImageUrl } from '@/utils/instructorCourses';

export const BOOK_STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'pending_review', label: 'In review' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
];

export const BOOK_TYPES = [
  { id: 'ebook', label: 'E-book' },
  { id: 'hardcopy', label: 'Hard copy' },
];

export const BOOK_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'business', label: 'Business' },
  { id: 'tech', label: 'Tech' },
];

const STATUS_TONES = {
  draft: 'muted',
  pending_review: 'warning',
  published: 'success',
  rejected: 'danger',
};

export function bookStatusLabel(status) {
  const map = {
    draft: 'Draft',
    pending_review: 'In review',
    published: 'Published',
    rejected: 'Rejected',
  };
  return map[status] || status || 'Draft';
}

export function bookStatusTone(status) {
  return STATUS_TONES[status] || 'muted';
}

function textToList(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToText(value) {
  if (!Array.isArray(value)) return '';
  return value.filter(Boolean).join('\n');
}

export const EMPTY_BOOK_FORM = {
  title: '',
  author: '',
  description: '',
  whatYoullLearn: '',
  afterReadingOutcomes: '',
  type: 'ebook',
  price: '0',
  hardcopyPrice: '',
  category: 'general',
  fileUrl: '',
  thumbnail: '',
  isbn: '',
  stock: '0',
  deliveryFee: '0',
};

export function mapInstructorBook(raw) {
  const id = String(raw._id || raw.id);
  return {
    id,
    title: raw.title || 'Untitled book',
    author: raw.author || '',
    description: raw.description || '',
    type: raw.type || 'ebook',
    price: Number(raw.price || 0),
    category: raw.category || 'general',
    thumbnail: resolveCourseImageUrl(raw.thumbnail),
    listingStatus: raw.listingStatus || 'draft',
    rejectionReason: raw.rejectionReason || '',
    fileUrl: raw.fileUrl || '',
    updatedAt: raw.updatedAt || null,
  };
}

export function mapBookToForm(raw) {
  return {
    title: raw.title || '',
    author: raw.author || '',
    description: raw.description || '',
    whatYoullLearn: listToText(raw.whatYoullLearn),
    afterReadingOutcomes: listToText(raw.afterReadingOutcomes),
    type: raw.type || 'ebook',
    price: String(raw.price ?? 0),
    hardcopyPrice: raw.hardcopyPrice == null ? '' : String(raw.hardcopyPrice),
    category: raw.category || 'general',
    fileUrl: raw.fileUrl || '',
    thumbnail: raw.thumbnail || '',
    isbn: raw.isbn || '',
    stock: String(raw.stock ?? 0),
    deliveryFee: String(raw.deliveryFee ?? 0),
  };
}

export function buildBookPayload(form) {
  const payload = {
    title: form.title.trim(),
    author: form.author.trim(),
    description: form.description.trim(),
    type: form.type,
    price: Number(form.price || 0),
    category: form.category || 'general',
    thumbnail: form.thumbnail || '',
    isbn: form.isbn || '',
    whatYoullLearn: textToList(form.whatYoullLearn),
    afterReadingOutcomes: textToList(form.afterReadingOutcomes),
    testimonials: [],
  };

  if (form.type === 'ebook') {
    if (form.fileUrl) payload.fileUrl = form.fileUrl;
    const hc = String(form.hardcopyPrice ?? '').trim();
    payload.hardcopyPrice = hc === '' ? null : Number(form.hardcopyPrice);
  } else {
    payload.stock = Number(form.stock || 0);
    payload.deliveryFee = Number(form.deliveryFee || 0);
  }

  return payload;
}

export async function fetchInstructorBooks(token, status = 'all') {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const data = await api(`/instructor/books${query}`, { token });
  return (Array.isArray(data) ? data : []).map(mapInstructorBook);
}

export async function fetchInstructorBook(token, bookId) {
  const data = await api(`/instructor/books/${bookId}`, { token });
  return {
    ...mapInstructorBook(data),
    form: mapBookToForm(data),
  };
}

export async function createInstructorBook(token, form) {
  const data = await api('/instructor/books', {
    method: 'POST',
    token,
    body: buildBookPayload(form),
  });
  return mapInstructorBook(data);
}

export async function updateInstructorBook(token, bookId, form) {
  const data = await api(`/instructor/books/${bookId}`, {
    method: 'PATCH',
    token,
    body: buildBookPayload(form),
  });
  return mapInstructorBook(data);
}

export async function submitInstructorBook(token, bookId) {
  return api(`/instructor/books/${bookId}/submit`, {
    method: 'POST',
    token,
    body: {},
  });
}

export async function deleteInstructorBook(token, bookId) {
  return api(`/instructor/books/${bookId}`, {
    method: 'DELETE',
    token,
  });
}
