import { api } from '@/constants/api';

function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Same rules as the server's notificationDeepLink, so a tap in the list opens the same place as a push. */
function webPathFor(item) {
  if (item.type === 'signal') return '/signals';
  if (item.type === 'withdrawal') return '/account#wallet';
  if (item.entityType === 'booking') return '/mentorship';
  if (item.entityType === 'conversation') return '/community?tab=messages';
  if (['question', 'answer'].includes(item.entityType)) return '/community?tab=questions';
  if (item.entityType === 'resource') return '/community?tab=resources';
  if (item.entityType === 'live_session') return '/community?tab=live';
  if (item.tutorId) return '/community';
  return '';
}

export function mapNotification(item) {
  return {
    id: String(item._id || item.id),
    title: item.title || 'Notification',
    body: item.body || '',
    read: Boolean(item.readAt),
    time: formatRelativeTime(item.createdAt),
    type: item.type || '',
  };
}

export async function fetchNotifications(token, { unreadOnly = false } = {}) {
  const qs = unreadOnly ? '?unread=true' : '';
  const data = await api(`/notifications${qs}`, { token });
  return {
    notifications: (data.notifications || []).map(mapNotification),
    unreadCount: Number(data.unreadCount) || 0,
  };
}

export async function markNotificationRead(token, id) {
  return api(`/notifications/${id}/read`, { method: 'PATCH', token });
}

export async function markAllNotificationsRead(token) {
  return api('/notifications/read-all', { method: 'PATCH', token });
}
