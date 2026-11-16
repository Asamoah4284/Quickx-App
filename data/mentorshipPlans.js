// Mirrors the website's mentorship plans (Frontend/my-app/src/pages/Analysis.jsx).
export const MENTORSHIP_WHATSAPP = '233555756303';

export const mentorshipPlans = [
  {
    id: '1w',
    duration: '1 Week',
    price: 120,
    description: 'Perfect for quick learning',
    features: ['Free Beginner Ebook', 'Free Strategy Ebook', 'Confluence and Strategy', '1 on 1 Chat Review', 'Exclusive Signal Access'],
  },
  {
    id: '2w',
    duration: '2 Weeks',
    price: 200,
    description: 'Balanced learning period',
    popular: true,
    features: ['Everything in Week 1, plus:', 'Psychology Mastery', 'Risk Management', 'Live Trading Sessions', 'Daily Signals Support'],
  },
  {
    id: '1m',
    duration: '1 Month',
    price: 350,
    description: 'Comprehensive mentorship',
    features: ['Everything in Weeks 1 & 2, plus:', 'Full Custom Strategy Development', 'Weekly Reviews and Corrections', 'Extended Access to All Sessions'],
  },
];

export function mentorshipWhatsAppUrl(name, plan) {
  const message = `My name is ${name} and I want to make payment for ${plan.duration} mentorship`;
  return `https://wa.me/${MENTORSHIP_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
