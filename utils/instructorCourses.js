import { API_BASE, api } from '@/constants/api';
import { DEFAULT_MODULES, listToText, textToList } from '@/utils/courseWizard';

export const LISTING_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'under_review', label: 'In review' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'archived', label: 'Archived' },
];

export const COURSE_TYPES = [
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'webdev', label: 'Web Dev' },
];

export const COURSE_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const STATUS_TONES = {
  draft: 'muted',
  published: 'success',
  pending_review: 'warning',
  under_review: 'warning',
  rejected: 'danger',
  archived: 'muted',
};

export function listingStatusLabel(status) {
  const map = {
    draft: 'Draft',
    published: 'Published',
    pending_review: 'Pending review',
    under_review: 'In review',
    rejected: 'Rejected',
    archived: 'Archived',
  };
  return map[status] || status || 'Draft';
}

export function listingStatusTone(status) {
  return STATUS_TONES[status] || 'muted';
}

export function resolveCourseImageUrl(thumbnail) {
  const raw = String(thumbnail || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function countCurriculum(course) {
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  let lessons = 0;
  modules.forEach((mod) => {
    (mod.sections || []).forEach((section) => {
      lessons += (section.lessons || []).length;
    });
  });
  return { modules: modules.length, lessons };
}

export function mapInstructorCourse(raw) {
  const id = String(raw._id || raw.id);
  const counts = countCurriculum(raw);
  return {
    id,
    title: raw.title || 'Untitled course',
    shortDescription: raw.shortDescription || '',
    description: raw.description || '',
    thumbnail: resolveCourseImageUrl(raw.thumbnail),
    courseType: raw.courseType || 'forex',
    level: raw.level || 'beginner',
    category: raw.category || '',
    subcategory: raw.subcategory || '',
    language: raw.language || 'English',
    price: Number(raw.price || 0),
    pricingType: raw.pricingType || (Number(raw.price || 0) > 0 ? 'paid' : 'free'),
    certificateEnabled: Boolean(raw.certificateEnabled),
    listingStatus: raw.listingStatus || 'draft',
    isPublished: Boolean(raw.isPublished),
    modules: Array.isArray(raw.modules) ? raw.modules : [],
    moduleCount: counts.modules,
    lessonCount: counts.lessons,
    updatedAt: raw.updatedAt || null,
    rejectionReason: raw.rejectionReason || '',
  };
}

export async function fetchInstructorCourses(token, status = 'all') {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const data = await api(`/instructor/courses${query}`, { token });
  return (Array.isArray(data) ? data : []).map(mapInstructorCourse);
}

export async function fetchInstructorCourse(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}`, { token });
  return mapInstructorCourse(data);
}

export async function fetchInstructorCourseEditor(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}`, { token });
  const mapped = mapInstructorCourse(data);
  return {
    id: mapped.id,
    form: mapCourseToForm(data),
    listingStatus: mapped.listingStatus,
    rejectionReason: mapped.rejectionReason,
    moduleCount: mapped.moduleCount,
    lessonCount: mapped.lessonCount,
  };
}

export function buildCoursePayload(form) {
  return {
    title: form.title,
    subtitle: form.subtitle || '',
    category: form.category || form.courseType,
    subcategory: form.subcategory || '',
    courseType: form.courseType,
    level: form.level,
    language: form.language || 'English',
    thumbnail: form.thumbnail || '',
    promoVideo: form.promoVideo || '',
    shortDescription: form.shortDescription || '',
    description: form.description || '',
    learningOutcomes: textToList(form.learningOutcomes),
    requirements: textToList(form.requirements),
    targetAudience: textToList(form.targetAudience),
    skillsGained: textToList(form.skillsGained),
    pricingType: form.pricingType || 'paid',
    price: Number(form.pricingType === 'free' ? 0 : form.price || 0),
    currency: form.currency || 'GHS',
    discountPrice: form.discountPrice === '' || form.discountPrice == null ? null : Number(form.discountPrice),
    certificateEnabled: Boolean(form.certificateEnabled),
    modules: form.modules?.length ? form.modules : DEFAULT_MODULES,
    additionalMaterials: form.additionalMaterials || [],
  };
}

export function mapCourseToForm(raw) {
  return {
    title: raw.title || '',
    subtitle: raw.subtitle || '',
    category: raw.category || '',
    subcategory: raw.subcategory || '',
    courseType: raw.courseType || 'forex',
    level: raw.level || 'beginner',
    language: raw.language || 'English',
    thumbnail: raw.thumbnail || '',
    promoVideo: raw.promoVideo || '',
    shortDescription: raw.shortDescription || '',
    description: raw.description || '',
    learningOutcomes: listToText(raw.learningOutcomes),
    requirements: listToText(raw.requirements),
    targetAudience: listToText(raw.targetAudience),
    skillsGained: listToText(raw.skillsGained),
    pricingType: raw.pricingType || (Number(raw.price || 0) > 0 ? 'paid' : 'free'),
    price: String(raw.price ?? 0),
    currency: raw.currency || 'GHS',
    discountPrice: raw.discountPrice == null ? '' : String(raw.discountPrice),
    certificateEnabled: Boolean(raw.certificateEnabled),
    modules: raw.modules?.length ? raw.modules : DEFAULT_MODULES,
    additionalMaterials: raw.additionalMaterials?.length ? raw.additionalMaterials : [],
  };
}

export async function createInstructorCourse(token, form) {
  const data = await api('/instructor/courses', {
    method: 'POST',
    token,
    body: buildCoursePayload(form),
  });
  return mapInstructorCourse(data);
}

export async function updateInstructorCourse(token, courseId, form) {
  const data = await api(`/instructor/courses/${courseId}`, {
    method: 'PATCH',
    token,
    body: buildCoursePayload(form),
  });
  return mapInstructorCourse(data);
}

export async function submitInstructorCourse(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}/submit`, {
    method: 'POST',
    token,
    body: {},
  });
  return data;
}

export async function publishInstructorCourse(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}/publish`, {
    method: 'POST',
    token,
    body: {},
  });
  return data;
}

export async function unpublishInstructorCourse(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}/unpublish`, {
    method: 'POST',
    token,
    body: {},
  });
  return mapInstructorCourse(data);
}

export async function archiveInstructorCourse(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}/archive`, {
    method: 'POST',
    token,
    body: {},
  });
  return mapInstructorCourse(data);
}

export async function deleteInstructorCourse(token, courseId) {
  return api(`/instructor/courses/${courseId}`, {
    method: 'DELETE',
    token,
  });
}

export async function duplicateInstructorCourse(token, courseId) {
  const data = await api(`/instructor/courses/${courseId}/duplicate`, {
    method: 'POST',
    token,
    body: {},
  });
  return mapInstructorCourse(data);
}

export const EMPTY_COURSE_FORM = {
  title: '',
  subtitle: '',
  category: '',
  subcategory: '',
  courseType: 'forex',
  level: 'beginner',
  language: 'English',
  thumbnail: '',
  promoVideo: '',
  shortDescription: '',
  description: '',
  learningOutcomes: '',
  requirements: '',
  targetAudience: '',
  skillsGained: '',
  pricingType: 'paid',
  price: '0',
  currency: 'GHS',
  discountPrice: '',
  certificateEnabled: false,
  modules: DEFAULT_MODULES,
  additionalMaterials: [],
};
