/**
 * Color Configuration for ElBooklets Mobile
 *
 * HSL-based color theme system matching the web frontend.
 * Each color theme is defined by a base hue value.
 */

export type ColorTheme = 'blue';

// Base hue values for each color theme
export const COLOR_THEME_HUES: Record<ColorTheme, number> = {
  blue: 226,
};

// Pre-computed color palettes for each theme
// Using HSL converted to hex for consistent mobile rendering
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
  secondary: string; // Greenish secondary
}

// Blue theme palette (hue: 226) - Based on #1E40AF as main
const bluePalette: ColorPalette = {
  primary50: '#eff6ff',
  primary100: '#dbeafe',
  primary200: '#bfdbfe',
  primary300: '#93c5fd',
  primary400: '#60a5fa',
  primary500: '#1E40AF', // Main Color Blue
  primary600: '#2563eb',
  primary700: '#1d4ed8',
  primary800: '#1e40af', 
  primary900: '#1e3a8a',
  secondary: '#10B981', // Greeny Secondary
};

// Get palette for a specific theme
export const getColorPalette = (theme: ColorTheme): ColorPalette => {
  return bluePalette;
};

// Color theme display names for UI
export const COLOR_THEME_NAMES: Record<ColorTheme, { en: string; ar: string }> = {
  blue: { en: 'Blue', ar: 'أزرق' },
};

// Visual colors for the color picker (main representative color)
export const COLOR_THEME_DISPLAY_COLORS: Record<ColorTheme, string> = {
  blue: '#1E40AF',
};

// Default color theme
export const DEFAULT_COLOR_THEME: ColorTheme = 'blue';
