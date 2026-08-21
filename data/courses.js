export const courses = [
  {
    id: 'c1',
    title: 'Forex Foundations for African Traders',
    tutorId: 't1',
    category: 'forex',
    level: 'Beginner',
    price: 199,
    rating: 4.9,
    students: 3200,
    durationHours: 12,
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
    description:
      'Learn currency pairs, risk rules, and a simple trading plan designed for Ghana market hours.',
    curriculum: [
      {
        id: 'm1',
        title: 'Market Basics',
        lessons: [
          { id: 'l1', title: 'What moves FX markets', durationMins: 14, type: 'video' },
          { id: 'l2', title: 'Pairs & pips', durationMins: 18, type: 'video' },
          { id: 'l3', title: 'Quiz: Market basics', durationMins: 10, type: 'quiz' },
        ],
      },
      {
        id: 'm2',
        title: 'Risk First',
        lessons: [
          { id: 'l4', title: 'Position sizing', durationMins: 20, type: 'video' },
          { id: 'l5', title: 'Stop loss discipline', durationMins: 16, type: 'video' },
          { id: 'l6', title: 'Worksheet: Risk plan', durationMins: 12, type: 'material' },
        ],
      },
      {
        id: 'm3',
        title: 'Your First Strategy',
        lessons: [
          { id: 'l7', title: 'Price action setup', durationMins: 22, type: 'video' },
          { id: 'l8', title: 'Journaling trades', durationMins: 15, type: 'video' },
          { id: 'l9', title: 'Final quiz', durationMins: 15, type: 'quiz' },
        ],
      },
    ],
    reviews: [
      { id: 'cr1', user: 'Fiifi', rating: 5, text: 'Best intro I’ve taken locally.' },
      { id: 'cr2', user: 'Serwaa', rating: 5, text: 'Clear and practical.' },
    ],
    materials: ['Risk calculator PDF', 'Trade journal template'],
    hasCertificate: true,
  },
  {
    id: 'c2',
    title: 'React Native Crash Course',
    tutorId: 't2',
    category: 'coding',
    level: 'Intermediate',
    price: 249,
    rating: 4.8,
    students: 2100,
    durationHours: 16,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
    description: 'Build mobile apps with Expo and React Native, from screens to navigation.',
    curriculum: [
      {
        id: 'm1',
        title: 'Expo Setup',
        lessons: [
          { id: 'l1', title: 'Project structure', durationMins: 12, type: 'video' },
          { id: 'l2', title: 'Components & props', durationMins: 20, type: 'video' },
        ],
      },
      {
        id: 'm2',
        title: 'Navigation',
        lessons: [
          { id: 'l3', title: 'Expo Router tabs', durationMins: 18, type: 'video' },
          { id: 'l4', title: 'Quiz: Navigation', durationMins: 10, type: 'quiz' },
        ],
      },
    ],
    reviews: [{ id: 'cr1', user: 'Kofi', rating: 5, text: 'Shipped my first app.' }],
    materials: ['Starter repo notes'],
    hasCertificate: true,
  },
  {
    id: 'c3',
    title: 'Meta Ads for Small Businesses',
    tutorId: 't3',
    category: 'marketing',
    level: 'Beginner',
    price: 149,
    rating: 4.7,
    students: 1750,
    durationHours: 8,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
    description: 'Create profitable ad campaigns with modest budgets and clear funnels.',
    curriculum: [
      {
        id: 'm1',
        title: 'Campaign Basics',
        lessons: [
          { id: 'l1', title: 'Audience targeting', durationMins: 15, type: 'video' },
          { id: 'l2', title: 'Creative that converts', durationMins: 17, type: 'video' },
        ],
      },
    ],
    reviews: [{ id: 'cr1', user: 'Esi', rating: 4, text: 'Got my first paid leads.' }],
    materials: ['Ad checklist'],
    hasCertificate: false,
  },
  {
    id: 'c4',
    title: 'AI Study Systems',
    tutorId: 't4',
    category: 'ai',
    level: 'Beginner',
    price: 0,
    rating: 4.6,
    students: 5400,
    durationHours: 5,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
    description: 'Use AI assistants to summarize lessons, make quizzes, and plan study weeks.',
    curriculum: [
      {
        id: 'm1',
        title: 'Prompt Patterns',
        lessons: [
          { id: 'l1', title: 'Explain like a tutor', durationMins: 12, type: 'video' },
          { id: 'l2', title: 'Generate a quiz', durationMins: 10, type: 'video' },
        ],
      },
    ],
    reviews: [{ id: 'cr1', user: 'Papa', rating: 5, text: 'Free and genuinely useful.' }],
    materials: ['Prompt pack'],
    hasCertificate: false,
  },
  {
    id: 'c5',
    title: 'Advanced Price Action',
    tutorId: 't1',
    category: 'forex',
    level: 'Advanced',
    price: 349,
    rating: 4.9,
    students: 980,
    durationHours: 14,
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&q=80',
    description: 'Deep dive into structure, liquidity, and high-probability setups.',
    curriculum: [
      {
        id: 'm1',
        title: 'Market Structure',
        lessons: [
          { id: 'l1', title: 'BOS & CHOCH', durationMins: 25, type: 'video' },
          { id: 'l2', title: 'Quiz: Structure', durationMins: 12, type: 'quiz' },
        ],
      },
    ],
    reviews: [{ id: 'cr1', user: 'Richmond', rating: 5, text: 'Elevated my chart reading.' }],
    materials: ['Setup playbook'],
    hasCertificate: true,
  },
];

export function getCourseById(id) {
  return courses.find((c) => c.id === id);
}

export function getCoursesByTutor(tutorId) {
  return courses.filter((c) => c.tutorId === tutorId);
}

export function flattenLessons(course) {
  return course.curriculum.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title }))
  );
}
