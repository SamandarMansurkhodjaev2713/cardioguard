/**
 * Design tokens — the single source of truth for CardioGuard's visual language,
 * ported 1:1 from the Claude design (`cg-styles.css`). Raw values live here;
 * `buildTheme()` resolves them for a given density + corner-radius preset, the
 * way the CSS `[data-density]` / `[data-radius]` attributes did.
 *
 * Clinical palette: cardinal-red brand (cardio/pulse) + teal prevention accent,
 * warm near-white (light) / warm near-black (dark) surfaces, muted clinical
 * status colors. Danger red is brighter than the brand red so risk states stay
 * distinct from primary actions. Typeface: IBM Plex Sans, 8px grid.
 */

// ── Raw palette (light, clinical) ────────────────────────────────────────────
export const palette = {
  bg: '#F6F3F4',
  surface: '#FFFFFF',
  surfaceSoft: '#FBF6F7',
  surface2: '#F3ECEE',
  border: '#ECE2E4',
  border2: '#DCCFD2',
  hairline: '#F0E8EA',

  primary: '#BC2F2B',
  primary700: '#9F2522',
  primary800: '#831D1B',
  primarySoft: '#FBE9E8',
  primarySoft2: '#F2D0CE',
  onPrimary: '#FFFFFF',

  ink: '#2A1416',
  ink2: '#3A1C1E',
  ink3: '#4D272A',

  teal: '#0E7A70',
  teal700: '#0A5C54',
  tealSoft: '#E2EFEC',
  tealBorder: '#CDE6E0',

  // status: foreground / background / border triplets — danger red is brighter
  // than the brand red so "high/very-high" pops distinctly from primary actions.
  ok: '#2E7150',
  okBg: '#EBF2EE',
  okBd: '#CDE0D5',
  warn: '#97640F',
  warnBg: '#F7F0E2',
  warnBd: '#E9DABB',
  high: '#DC3A33',
  highBg: '#FCEBEA',
  highBd: '#F6CFCC',
  info: '#1C5E86',
  infoBg: '#E9F1F7',
  infoBd: '#C9DEEC',
  vhigh: '#931E1C',
  vhighBg: '#F6E5E4',
  vhighBd: '#E7C5C3',

  text: '#231619',
  text2: '#5B4D50',
  text3: '#897B7E',
  textOnSoft: '#382A2D',

  // auth hero accents
  heroGlow: 'rgba(224,80,80,0.30)',
  heroPulse: '#FF8A8A',

  overlay: 'rgba(30,16,18,0.42)',
  // neutral backdrop behind the on-web phone frame
  backdrop: '#E7DEE0',
} as const;

export type ColorToken = keyof typeof palette;
/** Widened so light and dark palettes share the same shape (string values). */
export type Palette = { readonly [K in keyof typeof palette]: string };
export type ColorScheme = 'light' | 'dark';

// ── Dark clinical palette (same token shape; tuned for AA contrast) ──────────
export const darkColors: Palette = {
  bg: '#120E0F',
  surface: '#1C1718',
  surfaceSoft: '#221B1C',
  surface2: '#2A2223',
  border: '#352B2C',
  border2: '#473A3B',
  hairline: '#281F20',

  primary: '#E8534B',
  primary700: '#DB453D',
  primary800: '#C2382F',
  primarySoft: '#2C1A19',
  primarySoft2: '#3D2422',
  onPrimary: '#FFFFFF',

  ink: '#3A2628', // tooltip / inverse surface (lighter than bg for contrast)
  ink2: '#43292B',
  ink3: '#4F3133',

  teal: '#34B3A4',
  teal700: '#3DBEAE',
  tealSoft: '#15302C',
  tealBorder: '#214A43',

  ok: '#6FD3A1', okBg: '#142820', okBd: '#244635',
  warn: '#E3B25E', warnBg: '#2A2415', warnBd: '#473C1F',
  high: '#F47B74', highBg: '#2E1918', highBd: '#502E2B',
  info: '#6FB6DD', infoBg: '#14242E', infoBd: '#234152',
  vhigh: '#EE8480', vhighBg: '#2E1A1A', vhighBd: '#4E2C2C',

  text: '#F2EAEB',
  text2: '#C2B2B4',
  text3: '#8C7C7E',
  textOnSoft: '#E8DCDE',

  heroGlow: 'rgba(232,83,75,0.28)',
  heroPulse: '#FF9A95',

  overlay: 'rgba(8,4,5,0.62)',
  backdrop: '#080606',
};

// ── Typography ───────────────────────────────────────────────────────────────
/** IBM Plex Sans weight → loaded font-family name (see app/_layout font map). */
export const fontFamily = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
} as const;

export const fontSize = {
  display: 28,
  h1: 23,
  h2: 19,
  card: 16,
  metric: 33,
  body: 15,
  help: 13,
  badge: 12,
} as const;

// ── Radius presets ───────────────────────────────────────────────────────────
export type RadiusPreset = 'strict' | 'default' | 'soft';

export const radiusPresets = {
  default: { card: 16, btn: 12, chip: 999, pill: 999, field: 12, sm: 8, badge: 999 },
  strict: { card: 12, btn: 10, chip: 9, pill: 8, field: 10, sm: 8, badge: 6 },
  soft: { card: 22, btn: 14, chip: 999, pill: 999, field: 14, sm: 12, badge: 999 },
} as const satisfies Record<RadiusPreset, Record<string, number>>;

// ── Density presets (8px grid spacing) ───────────────────────────────────────
export type DensityPreset = 'compact' | 'default' | 'comfortable';

export const densityPresets = {
  default: { padCard: 16, gap: 14, gapSm: 10, sectionGap: 22, rowPad: 13, screenPad: 16, metricSize: 33 },
  compact: { padCard: 13, gap: 11, gapSm: 8, sectionGap: 16, rowPad: 10, screenPad: 14, metricSize: 30 },
  comfortable: { padCard: 18, gap: 16, gapSm: 12, sectionGap: 24, rowPad: 15, screenPad: 18, metricSize: 34 },
} as const satisfies Record<DensityPreset, Record<string, number>>;

// ── Elevation (very soft, border-first — cross-platform `boxShadow`) ──────────
// RN 0.85 deprecates the legacy `shadow*` props in favor of `boxShadow`, which
// renders consistently on iOS, Android (new arch) and web.
export const shadows = {
  none: {},
  sm: { boxShadow: '0px 1px 2px rgba(20,30,50,0.04)' },
  md: { boxShadow: '0px 4px 16px rgba(20,30,50,0.06)' },
  nav: { boxShadow: '0px -6px 20px rgba(20,30,50,0.05)' },
} as const;

// ── Status → token mapping (single place to resolve clinical states) ──────────
export type StatusTone = 'ok' | 'warn' | 'high' | 'info' | 'vhigh' | 'neutral';

export interface ToneColors {
  readonly fg: string;
  readonly bg: string;
  readonly bd: string;
}

export function toneColorsFor(colors: Palette): Record<StatusTone, ToneColors> {
  return {
    ok: { fg: colors.ok, bg: colors.okBg, bd: colors.okBd },
    warn: { fg: colors.warn, bg: colors.warnBg, bd: colors.warnBd },
    high: { fg: colors.high, bg: colors.highBg, bd: colors.highBd },
    info: { fg: colors.info, bg: colors.infoBg, bd: colors.infoBd },
    vhigh: { fg: colors.vhigh, bg: colors.vhighBg, bd: colors.vhighBd },
    neutral: { fg: colors.text2, bg: colors.surface2, bd: colors.border },
  };
}

// ── Resolved theme ───────────────────────────────────────────────────────────
export interface Theme {
  readonly colors: Palette;
  readonly font: typeof fontFamily;
  readonly fontSize: typeof fontSize;
  readonly radius: (typeof radiusPresets)[RadiusPreset];
  readonly space: (typeof densityPresets)[DensityPreset];
  readonly shadows: typeof shadows;
  readonly tone: (t: StatusTone) => ToneColors;
  readonly radiusPreset: RadiusPreset;
  readonly densityPreset: DensityPreset;
  readonly scheme: ColorScheme;
}

export interface ThemeOptions {
  readonly radius: RadiusPreset;
  readonly density: DensityPreset;
  readonly scheme: ColorScheme;
}

/** Resolves the full theme for a density + radius + color-scheme (memoized at provider). */
export function buildTheme({ radius, density, scheme }: ThemeOptions): Theme {
  const colors = scheme === 'dark' ? darkColors : palette;
  const tones = toneColorsFor(colors);
  return {
    colors,
    font: fontFamily,
    fontSize,
    radius: radiusPresets[radius],
    space: densityPresets[density],
    shadows,
    tone: (t) => tones[t],
    radiusPreset: radius,
    densityPreset: density,
    scheme,
  };
}
