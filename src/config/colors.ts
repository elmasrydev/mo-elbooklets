/**
 * Color Configuration for El-Booklets Mobile
 *
 * All colors are aligned with the official UI guide.
 */

export type ColorTheme = 'blue';

// Brand & Palette Colors from UI Guide
export const COLORS = {
  // Brand Colors
  primaryBlue: '#1E40AF',
  secondaryGreen: '#10B981',
  warningOrange: '#F59E0B',

  // Neutrals / Surfaces
  darkNavy: '#0F172A',
  darkGray: '#1F2937',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  backgroundGray: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Text Colors
  textPrimary: '#0F172A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLink: '#1E40AF',
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

// Blue theme palette (hue: 226) - Based on #1E40AF
const bluePalette: ColorPalette = {
  primary50: '#eff6ff',
  primary100: '#dbeafe',
  primary200: '#bfdbfe',
  primary300: '#93c5fd',
  primary400: '#60a5fa',
  primary500: COLORS.primaryBlue,
  primary600: '#2563eb',
  primary700: '#1d4ed8',
  primary800: '#1e40af',
  primary900: '#1e3a8a',
  secondary: COLORS.secondaryGreen,
};

export const getColorPalette = (theme: ColorTheme): ColorPalette => {
  return bluePalette;
};

export const COLOR_THEME_NAMES: Record<ColorTheme, { en: string; ar: string }> = {
  blue: { en: 'Blue', ar: 'أزرق' },
};

export const COLOR_THEME_DISPLAY_COLORS: Record<ColorTheme, string> = {
  blue: COLORS.primaryBlue,
};

export const DEFAULT_COLOR_THEME: ColorTheme = 'blue';
