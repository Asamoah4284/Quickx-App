import { api } from '@/constants/api';
import { resolveCourseImageUrl } from '@/utils/instructorCourses';

export async function fetchCreatorDashboard(token) {
  return api('/instructor/courses/dashboard', { token });
}

export async function fetchCreatorStudents(token) {
  const data = await api('/instructor/courses/students', { token });
  return Array.isArray(data) ? data : [];
}

export async function fetchCreatorReviews(token) {
  const data = await api('/instructor/courses/reviews', { token });
  return Array.isArray(data) ? data : [];
}

export async function fetchCreatorEarnings(token) {
  return api('/instructor/courses/earnings', { token });
}

export async function fetchCreatorPayouts(token) {
  const data = await api('/instructor/courses/payouts', { token });
  return Array.isArray(data) ? data : [];
}

export function mapDashboardCourse(raw) {
  const id = String(raw._id || raw.id);
  return {
    id,
    title: raw.title || 'Untitled course',
    thumbnail: resolveCourseImageUrl(raw.thumbnail),
    listingStatus: raw.listingStatus || 'draft',
    updatedAt: raw.updatedAt || null,
  };
}

export function mapStudentEnrollment(raw) {
  return {
    id: String(raw._id || raw.id),
    studentName: raw.studentId?.fullName || 'Student',
    studentEmail: raw.studentId?.email || '',
    courseTitle: raw.courseId?.title || 'Course',
    progressPercent: Number(raw.progressPercent || 0),
    enrolledAt: raw.enrolledAt || raw.createdAt || null,
  };
}

export function mapCreatorReview(raw) {
  return {
    id: String(raw._id || raw.id),
    studentName: raw.studentId?.fullName || 'Student',
    courseTitle: raw.courseId?.title || 'Course',
    rating: Number(raw.rating || 0),
    comment: raw.comment || '',
    createdAt: raw.createdAt || null,
  };
}

export function mapCreatorPayout(raw) {
  return {
    id: String(raw._id || raw.id),
    amount: Number(raw.amount || 0),
    status: raw.status || 'pending',
    requestedAt: raw.requestedAt || raw.createdAt || null,
  };
}

export function mapCreatorTransaction(raw) {
  return {
    id: String(raw._id || raw.id),
    reference: raw.paymentReference || 'N/A',
    amount: Number(raw.tutorEarning || 0),
    status: raw.status || 'completed',
    createdAt: raw.createdAt || null,
  };
}

export function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
