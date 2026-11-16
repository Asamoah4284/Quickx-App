/** The four things a member can have. Keys match the backend (constants/features.js). */
export const FEATURES = {
  courses: {
    key: 'courses',
    label: 'Courses',
    icon: 'play-circle',
    route: '/courses',
    blurb: 'Step-by-step video lessons you can watch online or download for later.',
  },
  signals: {
    key: 'signals',
    label: 'Signals',
    icon: 'activity',
    route: '/signals',
    blurb: 'Live trade ideas with entry, stop loss and targets, sent to your phone.',
  },
  community: {
    key: 'community',
    label: 'Community',
    icon: 'users',
    route: '/community',
    blurb: 'Ask questions, share your trades and learn alongside other members.',
  },
  mentorship: {
    key: 'mentorship',
    label: 'Mentorship',
    icon: 'target',
    route: '/mentorship',
    blurb: '1-on-1 sessions and direct guidance from Maxwell.',
  },
};

export const FEATURE_LIST = Object.values(FEATURES);

export const LINKS = {
  website: 'https://quickxlearn.com',
  privacy: 'https://quickxlearn.com/privacy',
  deleteAccount: 'https://quickxlearn.com/delete-account',
  whatsappMaxwell: `https://wa.me/233559037872?text=${encodeURIComponent('Hello Maxwell, I am a mentorship member on QuickX.')}`,
};
