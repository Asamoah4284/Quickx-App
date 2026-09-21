import { api } from '@/constants/api';
import { completeMoolrePayment, detectMomoNetwork } from '@/utils/moolre';

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
  network,
  otpcode,
  sessionid,
  onPending,
}) {
  const momo = String(phone || '').replace(/\D/g, '');
  const normalized = momo.length === 10 && momo.startsWith('0') ? momo : `0${momo.slice(-9)}`;
  return completeMoolrePayment({
    token,
    body: {
      itemType: 'creator_subscription',
      itemId: instructorId,
      planId,
      amount: Math.max(0.01, Number(amount) || 0),
      transactionId: `qx_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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

export async function fetchCommunityPosts(tutorId, token, { roomId } = {}) {
  const params = new URLSearchParams();
  if (roomId) params.set('roomId', roomId);
  params.set('limit', '40');
  const q = params.toString();
  const data = await api(`/community/${tutorId}/posts?${q}`, { token });
  return asList(data, 'posts').map((post) => {
    const pollRaw = post.pollId && typeof post.pollId === 'object' ? post.pollId : null;
    return {
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
      featured: Boolean(post.featured),
      createdAt: post.createdAt,
      poll: pollRaw
        ? {
            id: String(pollRaw._id || pollRaw.id),
            question: pollRaw.question || post.body || '',
            closed: Boolean(pollRaw.closed),
            options: (pollRaw.options || []).map((opt, index) => ({
              index,
              text: opt.text || '',
              voteCount: Number(opt.voteCount || 0),
            })),
          }
        : null,
      author: {
        id: String(post.authorId?._id || post.authorId || ''),
        name: post.authorId?.fullName || 'Member',
        avatar: post.authorId?.profilePicture || '',
        role: post.authorId?.role || 'student',
      },
    };
  });
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

export async function submitCommunityReport(tutorId, token, { entityType, entityId, reason }) {
  return api(`/community/${tutorId}/reports`, {
    method: 'POST',
    token,
    body: { entityType, entityId, reason },
  });
}

export async function fetchCommunityRooms(tutorId, token) {
  const data = await api(`/community/${tutorId}/rooms`, { token });
  return asList(data, 'rooms').map((r) => ({
    id: String(r._id || r.id),
    name: r.name || 'Room',
    archived: Boolean(r.archived),
  }));
}

export async function fetchCommunityBadges(tutorId, token) {
  const data = await api(`/community/${tutorId}/badges`, { token });
  return asList(data, 'badges').map((b) => ({
    key: b.key || b.badgeKey || '',
    label: b.label || b.name || b.key || 'Badge',
    earnedAt: b.earnedAt || b.createdAt,
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

export async function voteCommunityPoll(tutorId, pollId, token, optionIndex) {
  const data = await api(`/community/${tutorId}/polls/${pollId}/vote`, {
    method: 'POST',
    token,
    body: { optionIndex },
  });
  const poll = data.poll || data;
  return {
    id: String(poll._id || poll.id),
    question: poll.question || '',
    closed: Boolean(poll.closed),
    options: (poll.options || []).map((opt, index) => ({
      index,
      text: opt.text || '',
      voteCount: Number(opt.voteCount || 0),
    })),
  };
}

export async function fetchCommunityLeaderboard(tutorId, token) {
  const data = await api(`/community/${tutorId}/leaderboard`, { token });
  return asList(data, 'leaderboard').map((row, index) => ({
    rank: index + 1,
    userId: String(row.userId?._id || row.userId || row._id || ''),
    name: row.userId?.fullName || row.fullName || 'Member',
    xp: Number(row.xp || row.totalXp || 0),
    avatar: row.userId?.profilePicture || row.profilePicture || '',
  }));
}

export async function fetchCommunityConversations(tutorId, token) {
  const data = await api(`/community/${tutorId}/conversations`, { token });
  return asList(data, 'conversations').map((c) => ({
    id: String(c._id || c.id),
    title: c.title || '',
    isGroup: Boolean(c.isGroup),
    lastMessageAt: c.lastMessageAt || c.updatedAt || null,
    participants: (c.participantIds || []).map((p) => ({
      id: String(p._id || p.id || p),
      name: p.fullName || 'Member',
      avatar: p.profilePicture || '',
    })),
  }));
}

export async function fetchConversationMessages(tutorId, conversationId, token) {
  const data = await api(`/community/${tutorId}/conversations/${conversationId}/messages`, { token });
  return asList(data, 'messages').map((m) => ({
    id: String(m._id || m.id),
    body: m.body || '',
    createdAt: m.createdAt,
    author: {
      id: String(m.senderId?._id || m.senderId || m.authorId?._id || ''),
      name: m.senderId?.fullName || m.authorId?.fullName || 'Member',
    },
  }));
}

export async function sendConversationMessage(tutorId, conversationId, token, body) {
  return api(`/community/${tutorId}/conversations/${conversationId}/messages`, {
    method: 'POST',
    token,
    body: { body: String(body || '').trim() },
  });
}

export async function startTutorConversation(tutorId, token) {
  const data = await api(`/community/${tutorId}/conversations`, {
    method: 'POST',
    token,
    body: { participantIds: [tutorId], isGroup: false },
  });
  const c = data.conversation || data;
  return String(c._id || c.id);
}

export async function searchCommunity(tutorId, token, query) {
  const q = encodeURIComponent(String(query || '').trim());
  if (!q) return { posts: [], questions: [] };
  const data = await api(`/community/${tutorId}/search?q=${q}`, { token });
  return {
    posts: asList(data, 'posts').map((post) => ({
      id: String(post._id || post.id),
      body: post.body || '',
    })),
    questions: asList(data, 'questions').map((item) => ({
      id: String(item._id || item.id),
      title: item.title || item.body || 'Question',
    })),
  };
}
