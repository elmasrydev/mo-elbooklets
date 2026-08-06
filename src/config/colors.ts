/**
 * Color Configuration for El-Booklets Mobile
 *
 * All colors are aligned with the official UI guide.
 */

export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange';

// Brand hero/banner gradient (navy → primary → blue) used by the parent screens.
export const PARENT_HERO_GRADIENT: [string, string, string] = ['#1E3063', '#004A9A', '#1E54B8'];

// Faint brand-tinted hairline for separators/dividers (design `--line`).
export const HAIRLINE_BLUE = 'rgba(0, 74, 154, 0.08)';

/**
 * Distinct colors for the connections in a `match` question — each drawn pair
 * (wire, ports, and both linked cards) takes one color so students can tell
 * connections apart. Assigned by pair index and cycled if a question has more
 * pairs than colors. Chosen to stay legible on white in light and dark mode and
 * to be distinguishable for the common color-vision deficiencies.
 */
export const MATCH_PAIR_COLORS = ['#2563EB', '#DB2777', '#D97706', '#0D9488'] as const;

/**
 * Palette for the quiz-taking / review surfaces (match, paragraph, choice cards).
 * These mirror the values the existing white quiz-taking screen already uses
 * inline (navy #284196, hairlines, correct/incorrect greens/reds) so the new
 * question types sit in the same visual language rather than introducing a new
 * one. The taking screen is intentionally light-only, like its mockups.
 */
export const QUIZ_COLORS = {
  navy: '#284196', // primary action / selected accent on the quiz screen
  sky: '#EFF6FF', // faint navy tint for chips/badges/selected cards
  selectedBg: '#F8FAFF', // selected option card background
  ink: '#111827', // primary question text
  secondary: '#6B7280', // secondary text
  muted: '#9CA3AF', // disabled / placeholder
  line: '#E5E7EB', // card borders / hairlines
  cardBg: '#FFFFFF',
  ok: '#16A34A', // correct
  okBg: '#ECFDF5',
  okBorder: '#BFE8D0',
  bad: '#DC2626', // incorrect
  badBg: '#FEF2F2',
  badBorder: '#F6C9C9',
  warning: '#D97706', // partial score (amber)
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
} as const;

// Brand & Palette Colors from UI Guide
export const COLORS = {
  // Brand Colors
  primaryBlue: '#005ab4',
  secondaryGreen: '#10B981',
  warningOrange: '#F59E0B',

  // Neutrals / Surfaces
  darkNavy: '#0F172A',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  backgroundGray: '#F3F5FB',
  navbarBackground: '#F3F5FB',
  white: '#FFFFFF',
  black: '#000000',

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#FF6B6B',

  // Text Colors
  textPrimary: '#0F172A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLink: '#005ab4',
  textOnDark: '#FFFFFF',
} as const;

export interface ColorPalette {
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string; // Brand Primary
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;
  secondary: string;
}

// Blue theme palette (hue: 226) - Based on #005ab4
const bluePalette: ColorPalette = {
  primary50: '#eff6ff',
  primary100: '#dbeafe',
  primary200: '#bfdbfe',
  primary300: '#93c5fd',
  primary400: '#60a5fa',
  primary500: COLORS.primaryBlue,
  primary600: '#2563eb',
  primary700: '#1d4ed8',
  primary800: '#005ab4',
  primary900: '#1e3a8a',
  secondary: COLORS.secondaryGreen,
};

export const getColorPalette = (theme: ColorTheme): ColorPalette => {
  return bluePalette;
};

export const COLOR_THEME_NAMES: Record<ColorTheme, { en: string; ar: string }> = {
  blue: { en: 'Blue', ar: 'أزرق' },
  green: { en: 'Green', ar: 'أخضر' },
  purple: { en: 'Purple', ar: 'بنفسجي' },
  orange: { en: 'Orange', ar: 'برتقالي' },
};

export const COLOR_THEME_DISPLAY_COLORS: Record<ColorTheme, string> = {
  blue: COLORS.primaryBlue,
  green: COLORS.secondaryGreen,
  purple: '#8B5CF6',
  orange: COLORS.warningOrange,
};

export const DEFAULT_COLOR_THEME: ColorTheme = 'blue';
