import { api } from '@/constants/api';

export const COURSE_WIZARD_STEPS = [
  { label: 'Basics', description: 'Title, cover, and description' },
  { label: 'Pricing', description: 'Basic, Premium & Diamond' },
  { label: 'Curriculum', description: 'Modules and lessons' },
  { label: 'Review', description: 'Check and publish' },
];

export const LESSON_TYPES = [
  { id: 'video', label: 'Video' },
  { id: 'text', label: 'Text' },
  { id: 'pdf', label: 'PDF' },
  { id: 'resource', label: 'Resource' },
];

export function textToList(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToText(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

export function createLesson(index = 0) {
  return {
    title: '',
    description: '',
    lessonType: 'video',
    type: 'video',
    duration: '',
    videoUrl: '',
    pdfUrl: '',
    textContent: '',
    resourceUrl: '',
    resources: [],
    isPreview: false,
    isLocked: true,
    order: index + 1,
  };
}

export function createSection(index = 0) {
  return {
    title: '',
    description: '',
    order: index + 1,
    lessons: [createLesson()],
  };
}

export const DEFAULT_MODULES = [
  {
    title: 'Getting started',
    description: '',
    level: 'beginner',
    price: 0,
    order: 1,
    sections: [createSection()],
  },
];

export function countLessons(modules) {
  return (modules || []).reduce(
    (total, mod) =>
      total +
      (mod.sections || []).reduce((sum, section) => sum + (section.lessons || []).length, 0),
    0
  );
}

export function reindexModules(modules) {
  return (modules || []).map((mod, modIndex) => ({
    ...mod,
    order: modIndex + 1,
    sections: (mod.sections || []).map((section, sectionIndex) => ({
      ...section,
      order: sectionIndex + 1,
      lessons: (section.lessons || []).map((lesson, lessonIndex) => ({
        ...lesson,
        order: lessonIndex + 1,
      })),
    })),
  }));
}

export const EMPTY_SUBSCRIPTION_PRICING = {
  basic: '49',
  premium: '99',
  diamond: '599',
};

export async function saveCreatorSubscriptionPricing(token, pricing) {
  const basic = Math.max(0, Math.round(Number(pricing.basic) || 0));
  const premium = Math.max(0, Math.round(Number(pricing.premium) || 0));
  const diamond = Math.max(0, Math.round(Number(pricing.diamond) || 0));

  return api('/users/creator/profile', {
    method: 'PUT',
    token,
    body: {
      subscriptionPricing: {
        basic,
        premium,
        diamond,
        month1: basic,
        month3: premium,
        year1: diamond,
      },
    },
  });
}

export async function fetchCreatorCourseSettings(token) {
  const data = await api('/users/creator/profile', { token });
  const sp = data?.tutorProfile?.subscriptionPricing || {};
  return {
    courseAutoApproval: Boolean(data?.settings?.courseAutoApproval),
    subscriptionPricing: {
      basic: String(sp.basic ?? sp.month1 ?? 49),
      premium: String(sp.premium ?? sp.premiumPlus ?? sp.month3 ?? 99),
      diamond: String(sp.diamond ?? sp.year1 ?? 599),
    },
  };
}
