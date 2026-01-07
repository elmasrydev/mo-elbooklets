/**
 * Color Configuration for ElBooklets Mobile
 * 
 * HSL-based color theme system matching the web frontend.
 * Each color theme is defined by a base hue value.
 */

export type ColorTheme = 'green' | 'purple' | 'blue' | 'orange';

// Base hue values for each color theme (matching web frontend)
export const COLOR_THEME_HUES: Record<ColorTheme, number> = {
  green: 142,
  purple: 270,
  blue: 210,
  orange: 30,
};

// Pre-computed color palettes for each theme
// Using HSL converted to hex for consistent mobile rendering
export interface ColorPalette {
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;
}

// Green theme palette (hue: 142)
const greenPalette: ColorPalette = {
  primary50: '#ecfdf5',
  primary100: '#d1fae5',
  primary200: '#a7f3d0',
  primary300: '#6ee7b7',
  primary400: '#34d399',
  primary500: '#10b981',
  primary600: '#059669',
  primary700: '#047857',
  primary800: '#065f46',
  primary900: '#064e3b',
};

// Purple theme palette (hue: 270)
const purplePalette: ColorPalette = {
  primary50: '#faf5ff',
  primary100: '#f3e8ff',
  primary200: '#e9d5ff',
  primary300: '#d8b4fe',
  primary400: '#c084fc',
  primary500: '#a855f7',
  primary600: '#9333ea',
  primary700: '#7c3aed',
  primary800: '#6b21a8',
  primary900: '#581c87',
};

// Blue theme palette (hue: 210)
const bluePalette: ColorPalette = {
  primary50: '#f0f9ff',
  primary100: '#e0f2fe',
  primary200: '#bae6fd',
  primary300: '#7dd3fc',
  primary400: '#38bdf8',
  primary500: '#0ea5e9',
  primary600: '#0284c7',
  primary700: '#0369a1',
  primary800: '#075985',
  primary900: '#0c4a6e',
};

// Orange theme palette (hue: 30)
const orangePalette: ColorPalette = {
  primary50: '#fff7ed',
  primary100: '#ffedd5',
  primary200: '#fed7aa',
  primary300: '#fdba74',
  primary400: '#fb923c',
  primary500: '#f97316',
  primary600: '#ea580c',
  primary700: '#c2410c',
  primary800: '#9a3412',
  primary900: '#7c2d12',
};

// Get palette for a specific theme
export const getColorPalette = (theme: ColorTheme): ColorPalette => {
  switch (theme) {
    case 'green':
      return greenPalette;
    case 'purple':
      return purplePalette;
    case 'blue':
      return bluePalette;
    case 'orange':
      return orangePalette;
    default:
      return greenPalette;
  }
};

// Color theme display names for UI
export const COLOR_THEME_NAMES: Record<ColorTheme, { en: string; ar: string }> = {
  green: { en: 'Green', ar: 'أخضر' },
  purple: { en: 'Purple', ar: 'بنفسجي' },
  blue: { en: 'Blue', ar: 'أزرق' },
  orange: { en: 'Orange', ar: 'برتقالي' },
};

// Visual colors for the color picker (main representative color)
export const COLOR_THEME_DISPLAY_COLORS: Record<ColorTheme, string> = {
  green: '#10b981',
  purple: '#a855f7',
  blue: '#0ea5e9',
  orange: '#f97316',
};

// Default color theme
export const DEFAULT_COLOR_THEME: ColorTheme = 'green';
