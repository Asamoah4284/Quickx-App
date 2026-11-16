import { api } from '@/constants/api';

/**
 * Fetch list of events with query filters
 */
export async function fetchEvents({
  status = 'published',
  isFree,
  category,
  eventType,
  search,
  timeFilter = 'all',
  token,
} = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (isFree !== undefined && isFree !== null && isFree !== '') {
    params.set('isFree', String(isFree));
  }
  if (category && category !== 'all') params.set('category', category);
  if (eventType && eventType !== 'all') params.set('eventType', eventType);
  if (search) params.set('search', search);
  if (timeFilter) params.set('timeFilter', timeFilter);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api(`/events${query}`, { token });
  return Array.isArray(data?.events) ? data.events : [];
}

/**
 * Fetch a single event's details
 */
export async function fetchEventDetails(id, token) {
  const data = await api(`/events/${id}`, { token });
  return data?.event || null;
}

/**
 * Register for a free event
 */
export async function registerForEvent(id, { attendeeName, attendeeEmail, attendeePhone, notes } = {}, token) {
  return api(`/events/${id}/register`, {
    method: 'POST',
    body: { attendeeName, attendeeEmail, attendeePhone, notes },
    token,
  });
}

/**
 * Buy ticket for a paid event
 */
export async function buyEventTicket(
  id,
  { attendeeName, attendeeEmail, attendeePhone, paymentMethod, transactionId, momoNumber, network } = {},
  token
) {
  return api(`/events/${id}/buy-ticket`, {
    method: 'POST',
    body: {
      attendeeName,
      attendeeEmail,
      attendeePhone,
      paymentMethod,
      transactionId,
      momoNumber,
      network,
    },
    token,
  });
}

/**
 * Fetch the logged-in user's tickets
 */
export async function fetchMyEventTickets(token) {
  const data = await api('/events/my/tickets', { token });
  return Array.isArray(data?.tickets) ? data.tickets : [];
}

/**
 * Admin: Create an event
 */
export async function createEvent(eventData, token) {
  return api('/events', {
    method: 'POST',
    body: eventData,
    token,
  });
}

/**
 * Admin: Update an event
 */
export async function updateEvent(id, eventData, token) {
  return api(`/events/${id}`, {
    method: 'PUT',
    body: eventData,
    token,
  });
}

/**
 * Admin: Delete an event
 */
export async function deleteEvent(id, token) {
  return api(`/events/${id}`, {
    method: 'DELETE',
    token,
  });
}
