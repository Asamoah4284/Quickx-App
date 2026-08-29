import { api } from '@/constants/api';

export const CREATOR_STEPS = [
  { label: 'Basic account', description: 'Creator identity and contact details' },
  { label: 'Tutor profile', description: 'Professional background and trust signals' },
  { label: 'Teaching preferences', description: 'What and how you want to teach' },
  { label: 'Review and submit', description: 'Check everything before you apply' },
];

export const EMPTY_CREATOR_FORM = {
  fullName: '',
  email: '',
  phone: '',
  country: '',
  headline: '',
  bio: '',
  expertise: '',
  experienceYears: '0',
  languages: '',
  website: '',
  youtube: '',
  teachingCategories: '',
  preferredCourseLanguage: 'English',
  teachesFreeCourses: true,
  teachesPaidCourses: true,
  offersMentorship: false,
};

export function isApprovedCreator(user) {
  // Must match backend requireApprovedCreator: role tutor + creatorStatus approved
  return user?.role === 'tutor' && user?.creatorStatus === 'approved';
}

export function hasSubmittedCreatorApplication(user) {
  const status = user?.creatorStatus || 'not_applied';
  return status === 'approved' || status === 'pending' || status === 'rejected' || status === 'suspended';
}

export function creatorStatusLabel(status) {
  return String(status || 'not_applied').replace(/_/g, ' ');
}

export function creatorStatusTone(status) {
  const normalized = String(status || 'not_applied').toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'pending') return 'warning';
  if (normalized === 'rejected' || normalized === 'suspended') return 'danger';
  return 'muted';
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapCreatorProfileResponse(data) {
  const user = data?.user || {};
  const profile = data?.tutorProfile || {};
  return {
    user,
    tutorProfile: profile,
    creatorStatus: user.creatorStatus || profile.applicationStatus || 'not_applied',
    form: {
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      country: user.country || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      expertise: (profile.expertise || []).join(', '),
      experienceYears: String(profile.experienceYears ?? 0),
      languages: (profile.languages || []).join(', '),
      website: profile.socialLinks?.website || '',
      youtube: profile.socialLinks?.youtube || '',
      teachingCategories: (profile.teachingCategories || []).join(', '),
      preferredCourseLanguage: profile.preferredCourseLanguage || 'English',
      teachesFreeCourses: profile.teachesFreeCourses ?? true,
      teachesPaidCourses: profile.teachesPaidCourses ?? true,
      offersMentorship: profile.offersMentorship ?? false,
    },
  };
}

export function buildCreatorProfilePayload(form) {
  return {
    headline: form.headline,
    bio: form.bio,
    expertise: splitList(form.expertise),
    experienceYears: Number(form.experienceYears || 0),
    languages: splitList(form.languages),
    socialLinks: {
      website: form.website,
      youtube: form.youtube,
    },
    teachingCategories: splitList(form.teachingCategories),
    preferredCourseLanguage: form.preferredCourseLanguage,
    teachesFreeCourses: form.teachesFreeCourses,
    teachesPaidCourses: form.teachesPaidCourses,
    offersMentorship: form.offersMentorship,
    certificates: [],
    idDocumentUrl: '',
  };
}

export async function fetchCreatorProfile(token) {
  const data = await api('/users/creator/profile', { token });
  return mapCreatorProfileResponse(data);
}

export async function saveCreatorAccount(token, form) {
  return api('/users/me/account', {
    method: 'PATCH',
    token,
    body: {
      fullName: form.fullName,
      phone: form.phone,
      country: form.country,
    },
  });
}

export async function saveCreatorProfileDraft(token, form) {
  return api('/users/creator/profile', {
    method: 'PUT',
    token,
    body: buildCreatorProfilePayload(form),
  });
}

export async function submitCreatorApplication(token) {
  return api('/users/creator/profile/submit', {
    method: 'POST',
    token,
    body: {},
  });
}

export function buildCreatorSummary(form) {
  return [
    { label: 'Full name', value: form.fullName || 'Not provided' },
    { label: 'Email', value: form.email || 'Not provided' },
    { label: 'Phone', value: form.phone || 'Not provided' },
    { label: 'Country', value: form.country || 'Not provided' },
    { label: 'Headline', value: form.headline || 'Not provided' },
    { label: 'Expertise', value: form.expertise || 'Not provided' },
    { label: 'Languages', value: form.languages || 'Not provided' },
    { label: 'Teaching categories', value: form.teachingCategories || 'Not provided' },
    { label: 'Preferred language', value: form.preferredCourseLanguage || 'Not provided' },
  ];
}
