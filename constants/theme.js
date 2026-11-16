/**
 * QuickX design tokens, the same values as the website (Frontend/my-app/src/index.css).
 * New screens use `t`. The older `colors` names are kept, mapped onto the dark theme,
 * so screens that were not rewritten still match.
 */
export const t = {
  // Surfaces, darkest to lightest
  bg: '#05080f',
  bgRaised: '#090d18',
  card: '#0d1322',
  cardHi: '#121a2c',
  ink700: '#1a2438',
  ink600: '#263250',

  // Text
  fg: '#e9eef8',
  fgMuted: '#94a1bb',
  fgSubtle: '#64708a',

  // Hairlines
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.16)',
  glass: 'rgba(255,255,255,0.05)',

  // Brand
  brand300: '#8fb4ff',
  brand400: '#5b8fff',
  brand500: '#2f6bff',
  brand600: '#1b5ef5',
  brand700: '#1246c4',
  brandSoft: 'rgba(47,107,255,0.15)',
  logoNavy: '#0e3f7e',
  logoGreen: '#1fb07f',

  // Market colours: only for buy/sell, profit/loss, success/error
  up: '#2fd08c',
  upSoft: 'rgba(47,208,140,0.14)',
  down: '#ff5d6c',
  downSoft: 'rgba(255,93,108,0.14)',
  warn: '#f5b84a',
  warnSoft: 'rgba(245,184,74,0.14)',

  white: '#ffffff',
  overlay: 'rgba(2,4,10,0.72)',
};

/** Older names, now pointing at the dark theme. */
export const colors = {
  primary: t.brand500,
  primaryDark: t.brand700,
  navy: t.bg,
  navyMid: t.fg,
  accent: t.brand300,
  success: t.up,
  warning: t.warn,
  danger: t.down,
  surface: t.bg,
  surfaceAlt: t.bgRaised,
  card: t.card,
  text: t.fg,
  muted: t.fgMuted,
  border: t.line,
  white: t.white,
  star: t.warn,
  gold: t.warn,
  goldDark: '#d99a2b',
  tabInactive: t.fgSubtle,
  overlay: t.overlay,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, card: 20, full: 999 };

/** Plus Jakarta Sans, loaded in app/_layout.jsx. Pick the family by weight (Android ignores fontWeight). */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const typography = {
  h1: { fontSize: 28, fontFamily: fonts.bold, color: t.fg, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontFamily: fonts.bold, color: t.fg, letterSpacing: -0.4 },
  h3: { fontSize: 18, fontFamily: fonts.semibold, color: t.fg },
  body: { fontSize: 15, fontFamily: fonts.regular, color: t.fg },
  bodyBold: { fontSize: 15, fontFamily: fonts.semibold, color: t.fg },
  caption: { fontSize: 13, fontFamily: fonts.regular, color: t.fgMuted },
  small: { fontSize: 12, fontFamily: fonts.medium, color: t.fgMuted },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 4,
  },
  glow: {
    shadowColor: t.brand500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
};

export default {
  light: { text: t.fg, background: t.bg, tint: t.brand400, tabIconDefault: t.fgSubtle, tabIconSelected: t.brand400 },
  dark: { text: t.fg, background: t.bg, tint: t.brand400, tabIconDefault: t.fgSubtle, tabIconSelected: t.brand400 },
};
