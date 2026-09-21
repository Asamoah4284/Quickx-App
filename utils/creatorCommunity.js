import { api } from '@/constants/api';

function asList(data, key) {
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data?.[key])) return data[key];
  return [];
}

export async function fetchCommunityReports(tutorId, token, status = 'open') {
  const data = await api(`/community/${tutorId}/reports?status=${status}`, { token });
  return asList(data, 'reports').map((r) => ({
    id: String(r._id || r.id),
    entityType: r.entityType,
    entityId: String(r.entityId || ''),
    reason: r.reason || '',
    status: r.status || 'open',
    createdAt: r.createdAt,
    reporter: {
      name: r.reporterId?.fullName || 'Member',
      id: String(r.reporterId?._id || r.reporterId || ''),
    },
  }));
}

export async function updateCommunityReport(tutorId, reportId, token, status) {
  return api(`/community/${tutorId}/reports/${reportId}`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function fetchCommunityBlocks(tutorId, token) {
  const data = await api(`/community/${tutorId}/blocks`, { token });
  return asList(data, 'blocks').map((b) => ({
    id: String(b._id || b.id),
    reason: b.reason || '',
    muted: Boolean(b.muted),
    blocked: Boolean(b.blocked),
    user: {
      id: String(b.userId?._id || b.userId || ''),
      name: b.userId?.fullName || 'User',
    },
  }));
}

export async function createCommunityBlock(tutorId, token, { userId, reason, muted, blocked }) {
  return api(`/community/${tutorId}/blocks`, {
    method: 'POST',
    token,
    body: { userId, reason, muted: Boolean(muted), blocked: Boolean(blocked) },
  });
}

export async function removeCommunityBlock(tutorId, userId, token) {
  return api(`/community/${tutorId}/blocks/${userId}`, { method: 'DELETE', token });
}

export async function fetchCommunitySettings(tutorId, token) {
  return api(`/community/${tutorId}/settings`, { token });
}

export async function updateCommunitySettings(tutorId, token, body) {
  return api(`/community/${tutorId}/settings`, { method: 'PATCH', token, body });
}

export async function updateCommunityPost(tutorId, postId, token, body) {
  return api(`/community/${tutorId}/posts/${postId}`, { method: 'PATCH', token, body });
}

export async function deleteCommunityPost(tutorId, postId, token) {
  return api(`/community/${tutorId}/posts/${postId}`, { method: 'DELETE', token });
}

export async function updateCommunityQuestion(tutorId, questionId, token, body) {
  return api(`/community/${tutorId}/questions/${questionId}`, { method: 'PATCH', token, body });
}

export async function fetchCommunityMembers(tutorId, token, query = '') {
  const q = query ? `?q=${encodeURIComponent(query)}` : '';
  const data = await api(`/community/${tutorId}/members${q}`, { token });
  return asList(data, 'members').map((m) => ({
    id: String(m._id || m.id),
    name: m.fullName || 'Member',
    avatar: m.profilePicture || m.avatar || '',
  }));
}

export async function fetchInstructorSubscribers(token) {
  const data = await api('/instructor/subscribers', { token });
  return asList(data, 'subscribers').map((s) => ({
    id: String(s.id || s._id),
    planId: s.planId,
    student: s.student
      ? {
          id: String(s.student.id || s.student._id),
          name: s.student.fullName || 'Student',
          email: s.student.email || '',
        }
      : null,
  }));
}
