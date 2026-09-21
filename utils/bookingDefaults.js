export const DEFAULT_SESSION_SERVICES = [
  { id: 'strategy', name: '1-on-1 Strategy Session', price: 150 },
  { id: 'review', name: 'Portfolio Review', price: 100 },
  { id: 'coaching', name: 'Quick Coaching Call', price: 80 },
];

export const DEFAULT_TIME_SLOTS = ['09:00', '11:00', '14:00', '16:00', '18:00'];

export function tutorWithBookingOptions(tutor) {
  if (!tutor) return null;
  return {
    ...tutor,
    services: tutor.services?.length ? tutor.services : DEFAULT_SESSION_SERVICES,
    availableSlots: tutor.availableSlots?.length ? tutor.availableSlots : DEFAULT_TIME_SLOTS,
  };
}
