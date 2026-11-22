import { api } from '@/constants/api';
import {
  getCachedCourseFull,
  getCachedPurchasedCourses,
  setCachedPurchasedCourses,
  withCourseFullInflight,
} from '@/utils/courseCache';

function titleCase(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function instructorName(item) {
  const inst = item?.instructor;
  if (inst && typeof inst === 'object') return inst.fullName || inst.name || '';
  if (item?.createdBy && typeof item.createdBy === 'object') return item.createdBy.fullName || '';
  if (typeof item?.instructor === 'string') return item.instructor;
  return '';
}

function instructorAvatar(item) {
  const inst = item?.instructor;
  if (inst && typeof inst === 'object') {
    return inst.avatar || inst.profilePicture || '';
  }
  const tutor = item?.tutorProfile;
  if (tutor) return tutor.avatar || tutor.profilePicture || '';
  return '';
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.courses)) return data.courses;
  if (Array.isArray(data?.books)) return data.books;
  return [];
}

function parseDurationMins(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const text = String(value);
  const hm = text.match(/(\d+)\s*h(?:ours?)?\s*(\d+)?/i);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] || 0);
  const m = text.match(/(\d+)\s*m/i);
  if (m) return Number(m[1]);
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function mapLesson(lesson, moduleTitle = '', sectionTitle = '') {
  const type = String(lesson.lessonType || lesson.type || 'video').toLowerCase();
  return {
    id: String(lesson._id || lesson.id),
    title: lesson.title || 'Lesson',
    type,
    durationMins: parseDurationMins(lesson.duration),
    durationLabel: lesson.duration || '',
    free: Boolean(lesson.free || lesson.isPreview),
    isPreview: Boolean(lesson.isPreview || lesson.free),
    isLocked: lesson.isLocked !== false && !(lesson.free || lesson.isPreview),
    videoUrl: lesson.videoUrl || lesson.filePath || '',
    pdfUrl: lesson.pdfUrl || '',
    textContent: lesson.textContent || '',
    description: lesson.description || '',
    moduleTitle,
    sectionTitle,
  };
}

export function flattenCourseLessons(course) {
  if (!course) return [];
  if (Array.isArray(course.curriculum) && course.curriculum.length) {
    return course.curriculum.flatMap((mod) =>
      (mod.lessons || []).map((lesson) => ({
        ...lesson,
        moduleTitle: mod.title,
      }))
    );
  }
  return [];
}

export function mapCurriculum(modules = []) {
  return (modules || []).map((mod, mi) => {
    const moduleTitle = mod.title || `Module ${mi + 1}`;
    const lessons = [];
    (mod.sections || []).forEach((sec) => {
      (sec.lessons || []).forEach((lesson) => {
        lessons.push(mapLesson(lesson, moduleTitle, sec.title || ''));
      });
    });
    if (!lessons.length && Array.isArray(mod.lessons)) {
      mod.lessons.forEach((lesson) => lessons.push(mapLesson(lesson, moduleTitle)));
    }
    return {
      id: String(mod._id || mod.id || `m${mi}`),
      title: moduleTitle,
      description: mod.description || '',
      lessons,
    };
  });
}

export function mapCourse(raw, extras = {}) {
  const rating = Number(raw.averageRating || raw.rating || 0);
  const duration = Number(raw.totalDuration || raw.durationHours || 0);
  const curriculum = mapCurriculum(raw.modules || raw.curriculum || []);
  const lessons = curriculum.flatMap((m) => m.lessons);
  const previewCount = lessons.filter((l) => l.isPreview).length;
  const totalMins = lessons.reduce((sum, l) => sum + (l.durationMins || 0), 0);
  const reviews = Array.isArray(extras.reviews || raw.reviews)
    ? (extras.reviews || raw.reviews).map((r, i) => ({
        id: String(r._id || i),
        user: r.studentId?.fullName || r.user || r.name || 'Learner',
        rating: Number(r.rating || 0),
        text: r.comment || r.text || '',
      }))
    : [];

  const tutorProfile = extras.tutorProfile || raw.tutorProfile || null;
  const outcomes =
    (Array.isArray(raw.learningOutcomes) && raw.learningOutcomes.filter(Boolean)) ||
    (Array.isArray(raw.materials) && raw.materials.filter(Boolean)) ||
    [];

  return {
    id: String(raw._id || raw.id),
    title: raw.title || 'Untitled course',
    subtitle: raw.subtitle || raw.shortDescription || '',
    thumbnail: raw.thumbnail || '',
    promoVideo: raw.promoVideo || '',
    price: Number(raw.discountPrice ?? raw.price ?? 0),
    originalPrice: raw.discountPrice != null ? Number(raw.price || 0) : null,
    rating: rating ? Number(rating.toFixed(1)) : 0,
    ratingLabel: rating ? rating.toFixed(1) : 'New',
    level: titleCase(raw.level || 'Course'),
    language: raw.language || 'English',
    durationHours:
      duration > 24 ? Math.round(duration / 60) : duration || Math.round(totalMins / 60) || 0,
    totalLessons: Number(raw.totalLessons || lessons.length || 0),
    category: raw.category || raw.courseType || '',
    tutorName: instructorName(raw) || tutorProfile?.headline || '',
    tutorAvatar: instructorAvatar(raw),
    tutorHeadline: tutorProfile?.headline || tutorProfile?.bio || '',
    tutorId: raw.tutorId ? String(raw.tutorId) : null,
    description: raw.description || raw.shortDescription || '',
    students: Number(raw.totalStudents || raw.totalEnrollments || 0),
    materials: outcomes,
    requirements: Array.isArray(raw.requirements) ? raw.requirements.filter(Boolean) : [],
    hasCertificate: Boolean(raw.certificateEnabled),
    curriculum,
    reviews,
    relatedCourses: Array.isArray(extras.relatedCourses || raw.relatedCourses)
      ? (extras.relatedCourses || raw.relatedCourses).map((c) => mapCourse(c))
      : [],
    previewCount,
    enrollment: raw.enrollment || extras.enrollment || null,
    canAccess: Boolean(extras.canAccess || raw.canDownloadOffline || raw.enrollment),
  };
}

export const BOOK_TYPE = { digital: 'E-book', physical: 'Hardcopy', bundle: 'Bundle' };

export function mapBook(raw) {
  const reviews = Array.isArray(raw.reviews) ? raw.reviews : [];
  const quotes = Array.isArray(raw.testimonials) ? raw.testimonials : [];
  const ratingFromReviews = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
    : 0;
  const type = raw.type === 'hardcopy' ? 'physical' : raw.type === 'ebook' ? 'digital' : raw.type || 'digital';
  return {
    id: String(raw._id || raw.id),
    title: raw.title || 'Untitled book',
    author: raw.author || 'QuickXLearn',
    cover: raw.thumbnail || raw.cover || '',
    price: Number(raw.price ?? 0),
    type,
    rating: ratingFromReviews ? ratingFromReviews.toFixed(1) : 'New',
    description: raw.description || '',
    preview: quotes[0]?.quote || raw.description || '',
    reviews: (reviews.length ? reviews : quotes).map((item, index) => ({
      id: String(item._id || index),
      user: item.user || item.name || item.studentId?.fullName || 'Learner',
      rating: item.rating || 5,
      text: item.text || item.quote || item.comment || '',
    })),
  };
}

export async function fetchCourses() {
  const data = await api('/courses');
  return asList(data).map((item) => mapCourse(item));
}

export async function fetchBooks() {
  const data = await api('/books');
  return asList(data).map(mapBook);
}

export async function fetchCoursePreview(id) {
  const data = await api(`/courses/${id}/preview`);
  return mapCourse(data, {
    reviews: data.reviews,
    relatedCourses: data.relatedCourses,
    tutorProfile: data.tutorProfile,
  });
}

export async function fetchCourseFull(id, token, { force = false } = {}) {
  const key = String(id);
  if (!force) {
    const cached = getCachedCourseFull(key);
    if (cached) return cached;
  }
  return withCourseFullInflight(key, async () => {
    const data = await api(`/courses/${key}/full`, { token });
    return mapCourse(data, {
      enrollment: data.enrollment,
      canAccess: true,
    });
  });
}

export async function updateCourseProgress(id, token, { progressPercent, completedLessonId }) {
  return api(`/courses/${id}/progress`, {
    method: 'POST',
    token,
    body: { progressPercent, completedLessonId },
  });
}

export async function fetchBookPreview(id) {
  const data = await api(`/books/${id}/preview`);
  if (data?.redirectTo) return fetchBookPreview(data.redirectTo);
  return mapBook(data);
}

export async function fetchBookOffers(id) {
  const data = await api(`/books/${id}/offers`);
  const group = data?.offerGroup;
  if (!group) return null;
  return {
    id: String(group._id || group.id),
    title: group.title || 'Bundle options',
    options: (group.options || []).map((opt) => ({
      id: String(opt._id || opt.id),
      label: opt.label || opt.name || 'Option',
      price: Number(opt.price || 0),
      description: opt.description || '',
      bookIds: (opt.bookIds || []).map(String),
    })),
  };
}

export async function fetchBookContent(id, token) {
  const data = await api(`/books/${id}/content`, { token });
  return {
    ...mapBook(data),
    fileUrl: data.fileUrl || '',
    whatYoullLearn: data.whatYoullLearn || [],
    afterReadingOutcomes: data.afterReadingOutcomes || [],
  };
}

export async function fetchLessonDownload(courseId, lessonId, token) {
  return api(`/courses/${courseId}/lessons/${lessonId}/download`, { token });
}

export async function fetchPurchasedCourses(token, { force = false } = {}) {
  if (!force) {
    const cached = getCachedPurchasedCourses();
    if (cached) return cached;
  }
  const data = await api('/courses/user/purchased', { token });
  const list = asList(data).map((item) => ({
    id: String(item.id || item._id),
    title: item.title || 'Course',
    description: item.description || '',
    thumbnail: item.thumbnail || '',
    price: Number(item.price || 0),
    instructor: item.instructor || '',
    pct: Math.round(Number(item.progress) || 0),
    lastLessonTitle: item.lastAccessed || 'Continue where you left off',
    purchaseDate: item.purchaseDate || null,
  }));
  setCachedPurchasedCourses(list);
  return list;
}
