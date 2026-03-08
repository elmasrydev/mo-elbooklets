import { Platform } from 'react-native';
import { COLORS } from './colors';

/**
 * Font and Typography Configuration for El-Booklets
 *
 * Defines font families, sizes, and styles matching the UI guide.
 * Uses Lexend (Latin) and Cairo (Arabic) variable fonts.
 */

// Font family names
export const fontFamilies = {
  regular: 'Lexend',
  medium: 'Lexend',
  semiBold: 'Lexend',
  bold: 'Lexend',

  arabicRegular: 'Cairo',
  arabicMedium: 'Cairo',
  arabicSemiBold: 'Cairo',
  arabicBold: 'Cairo',
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

/**
 * Returns a complete text style object including font family and
 * Arabic adjustments (+2px as per guide).
 */
export const getTextStyle = (style: keyof typeof textStyles, isArabic: boolean = false) => {
  const baseStyle = textStyles[style] || textStyles.body;
  const weight = (baseStyle as any).fontWeight || fontWeights.regular;

  // Resolve precise font-family for Android static fonts
  let resolvedFontFamily = isArabic ? 'Cairo' : 'Lexend';
  if (Platform.OS === 'android') {
    if (isArabic) {
      if (weight === '700' || weight === 'bold') resolvedFontFamily = 'Cairo-Bold';
      else if (weight === '600') resolvedFontFamily = 'Cairo-SemiBold';
      else if (weight === '500') resolvedFontFamily = 'Cairo-Medium';
      else resolvedFontFamily = 'Cairo-Regular';
    } else {
      if (weight === '700' || weight === 'bold') resolvedFontFamily = 'Lexend-Bold';
      else if (weight === '600') resolvedFontFamily = 'Lexend-SemiBold';
      else if (weight === '500') resolvedFontFamily = 'Lexend-Medium';
      else resolvedFontFamily = 'Lexend-Regular';
    }
  }

  // Keep the fontWeight value on Android alongside the weight-specific fontFamily.
  // Setting undefined strips the weight and causes bold fonts to render as normal.
  const resolvedWeight = weight;

  if (isArabic) {
    return {
      ...baseStyle,
      fontFamily: resolvedFontFamily,
      fontWeight: resolvedWeight,
      // Decrease size by 2px as requested
      fontSize: baseStyle.fontSize - 1.6,
      // Adjust line height
      lineHeight: (baseStyle as any).lineHeight
        ? Math.round((baseStyle as any).lineHeight * 1.15)
        : undefined,
    };
  }

  return {
    ...baseStyle,
    fontFamily: resolvedFontFamily,
    fontWeight: resolvedWeight,
    lineHeight: Math.round(baseStyle.fontSize * 1.5),
  };
};

export type TextStyleType = keyof typeof textStyles;
