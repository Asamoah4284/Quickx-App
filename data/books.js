export const books = [
  {
    id: 'b1',
    title: 'The Disciplined Trader Playbook',
    author: 'Kwame Mensah',
    tutorId: 't1',
    category: 'forex',
    type: 'digital',
    price: 80,
    rating: 4.8,
    reviewsCount: 210,
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
    description: 'A practical journal-first approach to trading psychology and risk.',
    preview:
      'Chapter 1 — Before you click buy: define risk per trade, max daily loss, and your review ritual...',
    reviews: [{ id: 'br1', user: 'Leo', rating: 5, text: 'Short and actionable.' }],
  },
  {
    id: 'b2',
    title: 'Shipping Mobile Apps with Expo',
    author: 'Abena Owusu',
    tutorId: 't2',
    category: 'coding',
    type: 'physical',
    price: 120,
    rating: 4.7,
    reviewsCount: 88,
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    description: 'From blank screen to Play Store — patterns that save weeks.',
    preview: 'Chapter 1 — Structure your Expo Router project for growth...',
    reviews: [{ id: 'br1', user: 'Maya', rating: 5, text: 'Worth every cedi.' }],
  },
  {
    id: 'b3',
    title: 'Growth Ads Starter Kit',
    author: 'Efua Boateng',
    tutorId: 't3',
    category: 'marketing',
    type: 'bundle',
    price: 150,
    rating: 4.6,
    reviewsCount: 64,
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&q=80',
    description: 'Digital guide + worksheets + creative swipe file for Meta ads.',
    preview: 'Bundle includes: funnel map, 20 ad hooks, and weekly review sheet...',
    reviews: [{ id: 'br1', user: 'Ibrahim', rating: 4, text: 'Great templates.' }],
  },
  {
    id: 'b4',
    title: 'Prompt Like a Pro',
    author: 'Daniel Addo',
    tutorId: 't4',
    category: 'ai',
    type: 'digital',
    price: 45,
    rating: 4.5,
    reviewsCount: 140,
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    description: 'Reusable prompt frameworks for learning, work, and trading journals.',
    preview: 'Framework 1 — Role, Goal, Constraints, Output format...',
    reviews: [{ id: 'br1', user: 'Gloria', rating: 5, text: 'I use these daily.' }],
  },
];

export function getBookById(id) {
  return books.find((b) => b.id === id);
}

export function getBooksByTutor(tutorId) {
  return books.filter((b) => b.tutorId === tutorId);
}
