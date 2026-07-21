import { Platform } from 'react-native';
import { COLORS } from './colors';

/**
 * Font and Typography Configuration for El-Booklets
 *
 * Defines font families, sizes, and styles matching the UI guide.
 * Uses Lexend (Latin) and IBM Plex Sans Arabic (Arabic).
 */

// Base family names. IBM Plex Sans Arabic ships static weights only (no
// variable font), so Arabic text always resolves a weight-suffixed family on
// BOTH platforms — see resolveFontFamily below.
export const ARABIC_FONT = 'IBMPlexSansArabic';
const LATIN_FONT = 'Lexend';

// Arabic tuning knobs. Cairo (the previous Arabic font) needed a −1.6px size
// compensation for its oversized glyphs and shipped huge built-in leading;
// Plex Arabic tracks the Latin optical size, so the delta starts at 0 and the
// line height is set explicitly (same 1.5 ratio as Latin, which also leaves
// headroom for diacritics). Adjust these two values to retune Arabic app-wide.
export const ARABIC_FONT_SIZE_DELTA = 0;
export const ARABIC_LINE_HEIGHT_RATIO = 1.5;

export const fontFamilies = {
  latin: LATIN_FONT,
  arabic: ARABIC_FONT,
};

// Font weights matching the guide reference
export const fontWeights = {
  regular: 'normal' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

// Typography scale (English)
export const fontSizes = {
  xs: 12, // Label
  sm: 14, // Caption
  base: 16, // Body Small
  md: 18, // Body Regular, Button, Link
  lg: 20, // H3 Card Title, Body Large
  xl: 22, // H2 Section Header
  '2xl': 24, // H1 Screen Title, Number Medium
  '3xl': 40, // Number Large
} as const;

// Text styles mapping based on English scale
export const textStyles = {
  h1: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: COLORS.textPrimary },
  h2: { fontSize: fontSizes.xl, fontWeight: fontWeights.semiBold, color: COLORS.textPrimary },
  h3: { fontSize: fontSizes.lg, fontWeight: fontWeights.semiBold, color: COLORS.textPrimary },
  bodyLarge: { fontSize: fontSizes.lg, fontWeight: fontWeights.regular, color: COLORS.textPrimary },
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular, color: COLORS.textPrimary },
  bodySmall: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    color: COLORS.textSecondary,
  },
  caption: { fontSize: fontSizes.sm, fontWeight: fontWeights.regular, color: COLORS.textSecondary },
  label: { fontSize: fontSizes.xs, fontWeight: fontWeights.medium, color: COLORS.textSecondary },
  button: { fontSize: fontSizes.md, fontWeight: fontWeights.semiBold, color: COLORS.textOnDark },
  link: { fontSize: fontSizes.md, fontWeight: fontWeights.medium, color: COLORS.textLink },
  numberLarge: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: COLORS.textPrimary,
  },
  numberMedium: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: COLORS.primaryBlue,
  },
  display: { fontSize: fontSizes['3xl'], fontWeight: fontWeights.bold, color: COLORS.textPrimary },
  buttonSmall: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    color: COLORS.textOnDark,
  },
} as const;

export type FontWeightInput = 'normal' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'black';

/**
 * True when `text` contains Arabic script, i.e. it needs the Arabic family
 * regardless of the app's UI language (an Arabic name in an English UI still
 * has to render in Plex Arabic — Lexend has no Arabic glyphs).
 * Single source of truth: pass the result as `forceArabic` to useTypography.
 * Covers Arabic (0600-06FF), Supplement (0750-077F), Extended-A (08A0-08FF)
 * and the Presentation Forms blocks (FB50-FDFF, FE70-FEFF).
 */
export const isArabicText = (text?: string | null): boolean =>
  !!text && /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);

// Weight → static file suffix. Plex Arabic and Lexend both ship
// Regular/Medium/SemiBold/Bold, so 800/900/black clamp to Bold.
const weightSuffix = (weight: string): string => {
  switch (weight) {
    case '700':
    case '800':
    case '900':
    case 'bold':
    case 'black':
      return 'Bold';
    case '600':
      return 'SemiBold';
    case '500':
      return 'Medium';
    default:
      return 'Regular';
  }
};

/**
 * Weight → concrete font-family, shared by getTextStyle and useTypography.
 * Arabic always gets the weight-suffixed family (static files on both
 * platforms — Plex Arabic has no variable font). Latin suffixes on Android
 * only; iOS resolves Lexend faces natively from family + fontWeight.
 */
export const resolveFontFamily = (weight: string, isArabic: boolean): string => {
  if (isArabic) return `${ARABIC_FONT}-${weightSuffix(weight)}`;
  return Platform.OS === 'android' ? `${LATIN_FONT}-${weightSuffix(weight)}` : LATIN_FONT;
};

/**
 * fontWeight to pair with resolveFontFamily's result.
 * Android: always 'normal' — the weight is encoded in the family name, and any
 * other value makes Android synthesize bold on top of the static file.
 * iOS Arabic: the numeric weight of the face the suffix picked, so the render
 * is identical whether iOS uses the exact PostScript face or traverses the
 * family (both land on the same file). iOS Latin: the requested weight.
 */
export const resolveFontWeight = (weight: string, isArabic: boolean) => {
  if (Platform.OS === 'android') return 'normal' as const;
  if (isArabic) {
    switch (weightSuffix(weight)) {
      case 'Bold':
        return '700' as const;
      case 'SemiBold':
        return '600' as const;
      case 'Medium':
        return '500' as const;
      default:
        return 'normal' as const;
    }
  }
  return weight === 'black' ? ('900' as const) : (weight as FontWeightInput);
};

/**
 * Returns a complete text style object (family, size, weight, line height)
 * for the given named style, adjusted for Arabic when requested.
 */
export const getTextStyle = (style: keyof typeof textStyles, isArabic: boolean = false) => {
  const baseStyle = textStyles[style] || textStyles.body;
  const weight = (baseStyle as any).fontWeight || fontWeights.regular;

  const fontFamily = resolveFontFamily(weight, isArabic);
  const fontWeight = resolveFontWeight(weight, isArabic);

  if (isArabic) {
    const fontSize = baseStyle.fontSize + ARABIC_FONT_SIZE_DELTA;
    return {
      ...baseStyle,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight: Math.round(fontSize * ARABIC_LINE_HEIGHT_RATIO),
    };
  }

  return {
    ...baseStyle,
    fontFamily,
    fontWeight,
    lineHeight: Math.round(baseStyle.fontSize * 1.5),
  };
};

export type TextStyleType = keyof typeof textStyles;
