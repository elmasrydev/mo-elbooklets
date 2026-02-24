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
  isArabic: boolean = false,
): string => {
  if (isArabic) {
    return fontFamilies.arabicRegular; // All weights use the same variable font
  }
  return fontFamilies.regular; // All weights use the same variable font
};

// Get appropriate font weight
export const getFontWeight = (weight: 'regular' | 'medium' | 'semiBold' | 'bold'): string => {
  return fontWeights[weight];
};

// Typography scale - aligned with HedeyaStores design system
export const fontSizes = {
  /** 10px - Captions, metadata, timestamps */
  xs: 10,
  /** 12px - Secondary text, labels, subtitles */
  sm: 12,
  /** 14px - Body text, default size */
  base: 14,
  /** 18px - Emphasized body, important text */
  lg: 18,
  /** 24px - Section titles, card headers */
  xl: 24,
  /** 30px - Screen titles, main headers */
  '2xl': 30,
  /** 36px - Large headers, hero subtext */
  '3xl': 36,
  /** 36px - Hero text, splash screen */
  '4xl': 36,
  /** 40px - Extra large display text */
  '5xl': 40,
} as const;

// Line heights matching font sizes
export const lineHeights = {
  xs: 14,
  sm: 16,
  base: 20,
  lg: 24,
  xl: 32,
  '2xl': 38,
  '3xl': 44,
  '4xl': 44,
  '5xl': 48,
} as const;

// Spacing scale - aligned with HedeyaStores design system
export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 16px */
  md: 16,
  /** 24px */
  lg: 24,
  /** 32px */
  xl: 32,
  /** 48px */
  '2xl': 48,
  /** 32px (kept for backward compat) */
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

// Pre-defined text styles for common use cases (HedeyaStores-aligned sizes)
export const textStyles = {
  display: { fontSize: 36, fontWeight: '700', lineHeight: 44, fontFamily: 'Inter' },
  h1: { fontSize: 30, fontWeight: '700', lineHeight: 38, fontFamily: 'Inter' },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, fontFamily: 'Inter' },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24, fontFamily: 'Inter' },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: 'Inter' },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16, fontFamily: 'Inter' },
  // Utility styles
  button: { fontSize: 14, fontWeight: '600', lineHeight: 20, fontFamily: 'Inter' },
  buttonSmall: { fontSize: 12, fontWeight: '600', lineHeight: 16, fontFamily: 'Inter' },
  label: { fontSize: 12, fontWeight: '500', lineHeight: 16, fontFamily: 'Inter' },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16, fontFamily: 'Inter' },
} as const;

/**
 * Returns a complete text style object including the correct font family
 * based on the current language (Inter for Latin, Cairo for Arabic).
 */
export const getTextStyle = (style: keyof typeof textStyles, isArabic: boolean = false) => {
  const baseStyle = textStyles[style];

  if (isArabic) {
    // For Arabic, use Cairo and slightly bump size for readability
    // Also increase line height by ~20% because Arabic (Cairo) has taller ascenders/descenders
    return {
      ...baseStyle,
      fontFamily: 'Cairo',
      fontSize:
        style === 'caption' || style === 'bodySmall' || style === 'label' || style === 'buttonSmall'
          ? baseStyle.fontSize + 1
          : baseStyle.fontSize,
      lineHeight: baseStyle.lineHeight ? Math.round(baseStyle.lineHeight * 1.25) : undefined,
    };
  }

  return baseStyle;
};

export type FontSize = keyof typeof fontSizes;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type TextStyleType = keyof typeof textStyles;
