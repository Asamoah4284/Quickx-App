import { api } from '@/constants/api';

export async function fetchBookings(token) {
  const data = await api('/bookings', { token });
  return (data.bookings || []).map((b) => ({
    id: b.id,
    tutorId: b.tutorId,
    tutorName: b.tutorName,
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    date: b.date,
    time: b.time,
    durationMins: b.durationMins,
    price: b.price,
    status: b.status,
  }));
}

export async function createBooking(token, booking) {
  return api('/bookings', { method: 'POST', token, body: booking });
}

export async function cancelBooking(token, bookingId) {
  return api(`/bookings/${bookingId}/cancel`, { method: 'PATCH', token, body: {} });
}
