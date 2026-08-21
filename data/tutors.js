export const tutors = [
  {
    id: 't1',
    name: 'Kwame Mensah',
    title: 'Forex & Risk Mentor',
    bio: 'Ex-broker analyst with 9 years teaching Ghanaian traders how to manage risk and build consistent strategies.',
    expertise: ['Forex', 'Risk Management', 'Price Action'],
    experience: '9 years',
    rating: 4.9,
    students: 4200,
    followers: 1800,
    avatar: 'https://i.pravatar.cc/150?img=11',
    category: 'forex',
    services: [
      { id: 's1', name: '1-on-1 Strategy Session', durationMins: 60, price: 150 },
      { id: 's2', name: 'Portfolio Review', durationMins: 45, price: 120 },
      { id: 's3', name: 'Mentorship Kickoff', durationMins: 90, price: 250 },
    ],
    availableSlots: ['09:00', '11:00', '14:00', '16:00', '18:00'],
    reviews: [
      { id: 'r1', user: 'Ama B.', rating: 5, text: 'Cleared up my risk mistakes in one session.' },
      { id: 'r2', user: 'Kojo A.', rating: 5, text: 'Practical and patient. Highly recommend.' },
    ],
  },
  {
    id: 't2',
    name: 'Abena Owusu',
    title: 'Full-Stack Developer',
    bio: 'Builds production apps and teaches React Native, Node, and modern web stacks to beginners.',
    expertise: ['React Native', 'JavaScript', 'Node.js'],
    experience: '6 years',
    rating: 4.8,
    students: 3100,
    followers: 920,
    avatar: 'https://i.pravatar.cc/150?img=5',
    category: 'coding',
    services: [
      { id: 's1', name: 'Code Review Session', durationMins: 45, price: 100 },
      { id: 's2', name: 'Career Coaching', durationMins: 60, price: 130 },
    ],
    availableSlots: ['10:00', '13:00', '15:00', '17:00'],
    reviews: [
      { id: 'r1', user: 'Yaw D.', rating: 5, text: 'Helped me land my first junior role.' },
    ],
  },
  {
    id: 't3',
    name: 'Efua Boateng',
    title: 'Digital Marketing Strategist',
    bio: 'Specializes in Meta ads, content funnels, and brand growth for African SMEs.',
    expertise: ['Meta Ads', 'Content Strategy', 'SEO'],
    experience: '7 years',
    rating: 4.7,
    students: 2500,
    followers: 1100,
    avatar: 'https://i.pravatar.cc/150?img=9',
    category: 'marketing',
    services: [
      { id: 's1', name: 'Ad Account Audit', durationMins: 60, price: 140 },
      { id: 's2', name: 'Funnel Design Workshop', durationMins: 90, price: 200 },
    ],
    availableSlots: ['09:30', '12:00', '16:30'],
    reviews: [
      { id: 'r1', user: 'Nana K.', rating: 4, text: 'Great ads tips for small budgets.' },
    ],
  },
  {
    id: 't4',
    name: 'Daniel Addo',
    title: 'AI & Automation Coach',
    bio: 'Helps learners use AI tools for studying, content, and workflow automation.',
    expertise: ['AI Tools', 'Prompt Engineering', 'Automation'],
    experience: '4 years',
    rating: 4.6,
    students: 1800,
    followers: 740,
    avatar: 'https://i.pravatar.cc/150?img=12',
    category: 'ai',
    services: [
      { id: 's1', name: 'AI Study Plan Session', durationMins: 45, price: 90 },
      { id: 's2', name: 'Automation Setup', durationMins: 60, price: 160 },
    ],
    availableSlots: ['11:00', '14:30', '19:00'],
    reviews: [
      { id: 'r1', user: 'Akosua M.', rating: 5, text: 'My study workflow is 2x faster now.' },
    ],
  },
];

export function getTutorById(id) {
  return tutors.find((t) => t.id === id);
}
