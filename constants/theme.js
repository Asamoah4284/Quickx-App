/**
 * QuickX design tokens, the same values as the website (Frontend/my-app/src/index.css).
 *
 * There are two palettes, dark and light. `t` is one live object: applyTheme() copies the
 * chosen palette into it, and the app remounts its screens (context/ThemeContext.jsx), so
 * everything that reads `t.something` while rendering picks up the new colours.
 * Module-level styles must be wrapped in themed() (utils/themedStyles.js) for the same reason.
 */
const shared = {
  brand500: '#2f6bff',
  brand600: '#1b5ef5',
  brand700: '#1246c4',
  logoNavy: '#0e3f7e',
  logoGreen: '#1fb07f',
  white: '#ffffff',
  // Always-dark areas: the video player and photo overlays.
  media: '#05080f',
};

export const palettes = {
  dark: {
    ...shared,
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
    // Hairlines and soft fills
    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.16)',
    glass: 'rgba(255,255,255,0.05)',
    tint: 'rgba(255,255,255,0.06)',
    tintStrong: 'rgba(255,255,255,0.12)',
    focusBg: '#0f1830',
    // Brand (300/400 are used for text and icons)
    brand300: '#8fb4ff',
    brand400: '#5b8fff',
    brandSoft: 'rgba(47,107,255,0.15)',
    // Market colours: only for buy/sell, profit/loss, success/error
    up: '#2fd08c',
    upSoft: 'rgba(47,208,140,0.14)',
    down: '#ff5d6c',
    downSoft: 'rgba(255,93,108,0.14)',
    warn: '#f5b84a',
    warnSoft: 'rgba(245,184,74,0.14)',
    overlay: 'rgba(2,4,10,0.72)',
    glow: 'rgba(47,107,255,0.16)',
    glowStrong: 'rgba(47,107,255,0.28)',
    glowEnd: 'rgba(5,8,15,0)',
    statusBar: 'light',
    tabBar: 'rgba(13,19,34,0.97)',
    shadow: 0.35,
  },
  light: {
    ...shared,
    bg: '#f5f7fb',
    bgRaised: '#ffffff',
    card: '#ffffff',
    cardHi: '#f0f3f9',
    ink700: '#e4e9f2',
    ink600: '#d3dae8',
    fg: '#0b1220',
    fgMuted: '#4a5670',
    fgSubtle: '#76839c',
    line: 'rgba(11,18,32,0.08)',
    lineStrong: 'rgba(11,18,32,0.16)',
    glass: 'rgba(11,18,32,0.04)',
    tint: 'rgba(11,18,32,0.05)',
    tintStrong: 'rgba(11,18,32,0.09)',
    focusBg: '#eef3ff',
    // Lighter blues are for text on dark; on white they need to be deeper to read.
    brand300: '#1246c4',
    brand400: '#1b5ef5',
    brandSoft: 'rgba(47,107,255,0.10)',
    up: '#0e9a5f',
    upSoft: 'rgba(14,154,95,0.12)',
    down: '#e0364a',
    downSoft: 'rgba(224,54,74,0.10)',
    warn: '#b7791f',
    warnSoft: 'rgba(183,121,31,0.13)',
    overlay: 'rgba(11,18,32,0.45)',
    glow: 'rgba(47,107,255,0.10)',
    glowStrong: 'rgba(47,107,255,0.16)',
    glowEnd: 'rgba(245,247,251,0)',
    statusBar: 'dark',
    tabBar: 'rgba(255,255,255,0.97)',
    shadow: 0.1,
  },
};

/** The live tokens. Read them while rendering, never copy them into module-level constants. */
export const t = { ...palettes.dark, scheme: 'dark' };

export function applyTheme(scheme) {
  const name = scheme === 'light' ? 'light' : 'dark';
  Object.assign(t, palettes[name], { scheme: name });
}

const live = (map) =>
  Object.defineProperties(
    {},
    Object.fromEntries(
      Object.entries(map).map(([k, read]) => [k, { enumerable: true, get: typeof read === 'function' ? read : () => read }])
    )
  );

/** Older names, read through getters so they follow the theme. */
export const colors = live({
  primary: () => t.brand500,
  primaryDark: () => t.brand700,
  navy: () => t.bg,
  navyMid: () => t.fg,
  accent: () => t.brand300,
  success: () => t.up,
  warning: () => t.warn,
  danger: () => t.down,
  surface: () => t.bg,
  surfaceAlt: () => t.bgRaised,
  card: () => t.card,
  text: () => t.fg,
  muted: () => t.fgMuted,
  border: () => t.line,
  white: () => t.white,
  star: () => t.warn,
  gold: () => t.warn,
  goldDark: '#d99a2b',
  tabInactive: () => t.fgSubtle,
  overlay: () => t.overlay,
});

/** One spacing scale for every screen. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

/** Page rhythm: side padding, gap between sections, padding inside cards. */
export const layout = { side: 20, section: 24, card: 16, row: 14 };

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, card: 20, full: 999 };

/** Plus Jakarta Sans, loaded in app/_layout.jsx. Pick the family by weight (Android ignores fontWeight). */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

const type = (fontSize, fontFamily, tone = 'fg', extra = {}) => () => ({ fontSize, fontFamily, color: t[tone], ...extra });

export const typography = live({
  h1: type(28, fonts.bold, 'fg', { letterSpacing: -0.6 }),
  h2: type(22, fonts.bold, 'fg', { letterSpacing: -0.4 }),
  h3: type(18, fonts.semibold),
  body: type(15, fonts.regular),
  bodyBold: type(15, fonts.semibold),
  caption: type(13, fonts.regular, 'fgMuted'),
  small: type(12, fonts.medium, 'fgMuted'),
});

export const shadow = live({
  card: () => ({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: t.shadow,
    shadowRadius: 24,
    elevation: t.scheme === 'light' ? 2 : 4,
  }),
  glow: () => ({
    shadowColor: t.brand500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: t.scheme === 'light' ? 0.3 : 0.45,
    shadowRadius: 24,
    elevation: 8,
  }),
});
