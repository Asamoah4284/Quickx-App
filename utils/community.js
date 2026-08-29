import { api } from '@/constants/api';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    label: 'Basic',
    periodNote: '1 month · videos only',
    defaultPrice: 49,
    features: ['videos'],
    benefits: ['Watch course videos'],
  },
  {
    id: 'premium',
    label: 'Premium',
    periodNote: '3 months · community & Q&A',
    defaultPrice: 99,
    features: ['videos', 'community', 'download', 'ask', 'post_trade', 'signals'],
    benefits: ['Watch videos', 'Join community', 'Ask questions', 'Signals', 'Offline downloads'],
  },
  {
    id: 'diamond',
    label: 'Diamond',
    periodNote: '1 year · full access + mentorship',
    defaultPrice: 599,
    badge: 'Best value',
    features: ['videos', 'community', 'download', 'ask', 'post_trade', 'signals', 'mentored'],
    benefits: ['Everything in Premium', '1-on-1 mentorship'],
  },
];

function asList(data, key) {
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data?.[key])) return data[key];
  return [];
}

export function planPriceFromTutor(tutor, planId) {
  const pricing = tutor?.subscriptionPricing || {};
  const def = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!def) return null;
  const value = pricing[planId] ?? pricing[def.id];
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return def.defaultPrice;
}

function normalizePlan(planId) {
  const id = String(planId || '').trim();
  if (['basic', 'premium', 'diamond'].includes(id)) return id;
  if (['1m'].includes(id)) return 'basic';
  if (['2m', '3m', 'premium_plus'].includes(id)) return 'premium';
  if (['1y'].includes(id)) return 'diamond';
  return id;
}

export async function fetchMySubscriptions(token) {
  const data = await api('/me/subscriptions', { token });
  return asList(data, 'subscriptions').map((row) => {
    const planId = normalizePlan(row.planId || 'basic');
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    return {
      id: String(row.id || row._id),
      planId,
      endsAt: row.endsAt || null,
      accessType: row.accessType || 'subscription',
      canAccessCommunity: Boolean(plan?.features?.includes('community')),
      tutor: row.tutor
        ? {
            id: String(row.tutor.id || row.tutor._id),
            name: row.tutor.fullName || 'Tutor',
            avatar: row.tutor.profilePicture || row.tutor.avatar || '',
          }
        : null,
    };
  });
}

export async function fetchTutorSubscriptionMe(tutorId, token) {
  return api(`/instructors/${tutorId}/subscription/me`, { token });
}

export async function fetchCommunityStats(tutorId) {
  return api(`/instructors/${tutorId}/community/stats`);
}

export async function subscribeToTutor({
  token,
  instructorId,
  planId,
  amount,
  phone,
  email,
}) {
  const momo = String(phone || '').replace(/\D/g, '');
  const normalized = momo.length === 10 && momo.startsWith('0') ? momo : `0${momo.slice(-9)}`;
  return api('/payments/initialize-creator-subscription', {
    method: 'POST',
    token,
    body: {
      instructorId,
      planId,
      amount: Math.max(0.01, Number(amount) || 0),
      transactionId: `qx_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      paymentMethod: 'direct',
      momoNumber: normalized,
      shippingAddress: {
        email: email || `${normalized}@phone.quickxlearn.com`,
        phone: normalized,
      },
      currency: 'GHS',
    },
  });
}

export async function fetchCommunityPosts(tutorId, token, { roomId } = {}) {
  const params = new URLSearchParams();
  if (roomId) params.set('roomId', roomId);
  params.set('limit', '40');
  const q = params.toString();
  const data = await api(`/community/${tutorId}/posts?${q}`, { token });
  return asList(data, 'posts').map((post) => ({
    id: String(post._id || post.id),
    type: post.type || 'post',
    body: post.body || '',
    media: Array.isArray(post.media)
      ? post.media
          .filter((m) => m?.url)
          .map((m) => ({
            url: String(m.url),
            type: String(m.type || 'image').toLowerCase(),
            name: m.name || '',
          }))
      : [],
    likeCount: Number(post.likeCount || 0),
    commentCount: Number(post.commentCount || 0),
    likedByMe: Boolean(post.likedByMe),
    pinned: Boolean(post.pinned),
    createdAt: post.createdAt,
    author: {
      id: String(post.authorId?._id || post.authorId || ''),
      name: post.authorId?.fullName || 'Member',
      avatar: post.authorId?.profilePicture || '',
      role: post.authorId?.role || 'student',
    },
  }));
}

export async function likeCommunityPost(tutorId, postId, token) {
  return api(`/community/${tutorId}/posts/${postId}/like`, { method: 'POST', token });
}

export async function unlikeCommunityPost(tutorId, postId, token) {
  return api(`/community/${tutorId}/posts/${postId}/like`, { method: 'DELETE', token });
}

export async function createCommunityPost(tutorId, token, body) {
  return api(`/community/${tutorId}/posts`, {
    method: 'POST',
    token,
    body: { body: String(body || '').trim(), type: 'post' },
  });
}

export async function fetchPostComments(tutorId, postId, token) {
  const data = await api(`/community/${tutorId}/posts/${postId}/comments`, { token });
  return asList(data, 'comments').map((c) => ({
    id: String(c._id || c.id),
    body: c.body || '',
    parentId: c.parentId ? String(c.parentId) : null,
    createdAt: c.createdAt,
    author: {
      id: String(c.authorId?._id || c.authorId || ''),
      name: c.authorId?.fullName || 'Member',
      avatar: c.authorId?.profilePicture || '',
    },
  }));
}

export async function createPostComment(tutorId, postId, token, body, parentId = null) {
  const payload = { body: String(body || '').trim() };
  if (parentId) payload.parentId = parentId;
  const data = await api(`/community/${tutorId}/posts/${postId}/comments`, {
    method: 'POST',
    token,
    body: payload,
  });
  const c = data?.comment || data;
  return {
    id: String(c._id || c.id),
    body: c.body || payload.body,
    parentId: c.parentId ? String(c.parentId) : null,
    createdAt: c.createdAt || new Date().toISOString(),
    author: {
      id: String(c.authorId?._id || c.authorId || ''),
      name: c.authorId?.fullName || 'You',
      avatar: c.authorId?.profilePicture || '',
    },
  };
}

export async function fetchCommunityQuestions(tutorId, token) {
  const data = await api(`/community/${tutorId}/questions`, { token });
  return asList(data, 'questions').map((q) => ({
    id: String(q._id || q.id),
    title: q.title || q.body?.slice(0, 80) || 'Question',
    body: q.body || q.title || '',
    status: q.status || 'open',
    answerCount: Number(q.answerCount || q.answers?.length || 0),
    createdAt: q.createdAt,
    author: {
      name: q.authorId?.fullName || q.userId?.fullName || 'Member',
      avatar: q.authorId?.profilePicture || '',
    },
  }));
}

export async function askCommunityQuestion(tutorId, token, { title, body }) {
  return api(`/community/${tutorId}/questions`, {
    method: 'POST',
    token,
    body: { title, body },
  });
}

export async function fetchCommunityLiveSessions(tutorId, token) {
  const data = await api(`/community/${tutorId}/live-sessions`, { token });
  return asList(data, 'sessions').map((s) => ({
    id: String(s._id || s.id),
    title: s.title || 'Live session',
    description: s.description || '',
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    joinUrl: s.joinUrl || s.meetingUrl || s.link || '',
    location: s.location || (!/^https?:\/\//i.test(String(s.joinUrl || '').trim()) ? String(s.joinUrl || '').trim() : ''),
    cancelled: Boolean(s.cancelled),
  }));
}

export async function fetchCommunityResources(tutorId, token) {
  const data = await api(`/community/${tutorId}/resources`, { token });
  return asList(data, 'resources').map((r) => ({
    id: String(r._id || r.id),
    title: r.title || 'Resource',
    description: r.description || '',
    url: r.url || r.fileUrl || '',
    type: r.type || 'link',
    createdAt: r.createdAt,
  }));
}

export async function fetchMentorships() {
  const data = await api('/mentorships');
  return asList(data).map((m) => ({
    id: String(m._id || m.id),
    title: m.title || 'Mentorship session',
    summary: m.summary || '',
    date: m.date || '',
    time: m.time || '',
    isPremium: Boolean(m.isPremium),
    mentor: m.mentor || 'QuickX Mentor',
    icon: m.icon || 'users',
    imageUrl: m.imageUrl || '',
  }));
}
