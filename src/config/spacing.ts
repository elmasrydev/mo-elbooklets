/**
 * Spacing and Border Radius Configuration for El-Booklets
 * Defined as a single source of truth for the design system layout tokens.
 */

export const spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  ssm: 12,
  /** 10px */
  sectionGap: 10,
  /** 16px */
  md: 16,
  /** 20px */
  mdd: 20,
  /** 24px */
  lg: 24,
  /** 32px */
  xl: 32,
  /** 40px */
  '2xl': 40,
  /** 48px */
  '3xl': 48,
  /** 64px */
  '4xl': 64,
  /** 80px */
  '5xl': 80,

  /** Icon Sizes */
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
} as const;

export const borderRadius = {
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
  /** Full circle */
  full: 9999,
} as const;

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type IconSize = keyof typeof iconSizes;
