/**
 * The main parts of QuickX. Keys match the backend (constants/features.js).
 * Courses, Signals and Mentorship are sold; the Community is free for everyone signed in.
 */
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
    free: true,
    blurb: 'Free for every member. Ask questions, share your trades and learn alongside other traders.',
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

/** What can be bought (Account, Pricing). */
export const PAID_FEATURE_LIST = FEATURE_LIST.filter((f) => !f.free);

export const LINKS = {
  website: 'https://quickxlearn.com',
  privacy: 'https://quickxlearn.com/privacy',
  deleteAccount: 'https://quickxlearn.com/delete-account',
  whatsappMaxwell: `https://wa.me/233559037872?text=${encodeURIComponent('Hello Maxwell, I am a mentorship member on QuickX.')}`,
};
