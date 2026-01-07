/**
 * Font and Typography Configuration for ElBooklets Mobile
 * 
 * Defines font families, sizes, and spacing matching the web frontend design.
 * Uses Inter (Latin) and Cairo (Arabic) variable fonts from Google Fonts.
 */

// Font family names (must match the loaded font names in useFonts)
export const fontFamilies = {
  // Latin fonts (Inter) - using variable font
  regular: 'Inter',
  medium: 'Inter',
  semiBold: 'Inter',
  bold: 'Inter',
  
  // Arabic fonts (Cairo) - using variable font
  arabicRegular: 'Cairo',
  arabicMedium: 'Cairo',
  arabicSemiBold: 'Cairo',
  arabicBold: 'Cairo',
};

// Font weights to use with variable fonts
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

// Get appropriate font family based on language
export const getFontFamily = (
  weight: 'regular' | 'medium' | 'semiBold' | 'bold',
  isArabic: boolean = false
): string => {
  if (isArabic) {
    return fontFamilies.arabicRegular; // All weights use the same variable font
  }
  return fontFamilies.regular; // All weights use the same variable font
};

// Get appropriate font weight
export const getFontWeight = (
  weight: 'regular' | 'medium' | 'semiBold' | 'bold'
): string => {
  return fontWeights[weight];
};

// Typography scale - reasonable mobile sizes
export const fontSizes = {
  /** 12px - Captions, metadata, timestamps */
  xs: 12,
  /** 14px - Secondary text, labels, subtitles */
  sm: 14,
  /** 16px - Body text, default size */
  base: 16,
  /** 18px - Emphasized body, important text */
  lg: 18,
  /** 20px - Section titles, card headers */
  xl: 20,
  /** 24px - Screen titles, main headers */
  '2xl': 24,
  /** 28px - Large headers, hero subtext */
  '3xl': 28,
  /** 32px - Hero text, splash screen */
  '4xl': 32,
  /** 40px - Extra large display text */
  '5xl': 40,
} as const;

// Line heights matching font sizes
export const lineHeights = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 48,
} as const;

// Spacing scale for consistent padding/margins
export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 48px */
  '5xl': 48,
  /** 64px */
  '6xl': 64,
} as const;

// Border radius scale
export const borderRadius = {
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 20px */
  '2xl': 20,
  /** 24px */
  '3xl': 24,
  /** Full circle */
  full: 9999,
} as const;

// Pre-defined text styles for common use cases
export const textStyles = {
  // Headers
  h1: {
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
  },
  h2: {
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
  },
  h3: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  
  // Body
  body: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  
  // Labels
  label: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  
  // Buttons
  button: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
  },
  buttonSmall: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
} as const;

export type FontSize = keyof typeof fontSizes;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
