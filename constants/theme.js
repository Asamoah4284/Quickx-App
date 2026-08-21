export const colors = {
  primary: '#1B5EF5',
  primaryDark: '#1246C4',
  navy: '#07152F',
  navyMid: '#0C2340',
  accent: '#00B8FF',
  success: '#1EBE57',
  warning: '#F69C08',
  danger: '#E04E52',
  surface: '#F4F7FB',
  surfaceAlt: '#F7F9FC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E8EDF5',
  white: '#FFFFFF',
  star: '#F69C08',
  gold: '#E8B020',
  goldDark: '#D4A017',
  tabInactive: '#9AA0A6',
  overlay: 'rgba(7, 21, 47, 0.45)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  bodyBold: { fontSize: 15, fontWeight: '600', color: colors.text },
  caption: { fontSize: 13, fontWeight: '400', color: colors.muted },
  small: { fontSize: 12, fontWeight: '500', color: colors.muted },
};

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export default {
  light: {
    text: colors.text,
    background: colors.surface,
    tint: colors.primary,
    tabIconDefault: colors.muted,
    tabIconSelected: colors.primary,
  },
  dark: {
    text: colors.white,
    background: colors.navy,
    tint: colors.accent,
    tabIconDefault: colors.muted,
    tabIconSelected: colors.accent,
  },
};
