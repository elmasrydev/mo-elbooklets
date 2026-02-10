import { I18nManager, FlexStyle, TextStyle } from 'react-native';

/**
 * RTL Utilities for ElBooklets Mobile
 * Provides consistent layout and alignment helpers based on the active language.
 */

// Base RTL check
export const isRTL = (): boolean => I18nManager.isRTL;

// Flex direction based on RTL
// In RN, 'row' is already RTL-aware (Right-to-Left if matches I18nManager)
export const rowDirection = (): FlexStyle['flexDirection'] => 'row';

// Text alignment based on RTL
// Note: textAlign: 'left' is ALWAYS left in RN, so we must toggle it based on RTL
export const textAlign = (): 'left' | 'right' | 'center' => (I18nManager.isRTL ? 'right' : 'left');

// Margin/padding helpers
// Modern RN supports these properties natively
export const marginStart = (value: number): object => ({ marginStart: value });
export const marginEnd = (value: number): object => ({ marginEnd: value });
export const paddingStart = (value: number): object => ({ paddingStart: value });
export const paddingEnd = (value: number): object => ({ paddingEnd: value });

// Arrow direction
export const backArrow = (): string => (I18nManager.isRTL ? '→' : '←');
export const forwardArrow = (): string => (I18nManager.isRTL ? '←' : '→');

// Alignment helpers
// In RN, 'flex-start' is RTL-aware (Start is Right in RTL)
export const alignStart = (): FlexStyle['alignItems'] => 'flex-start';
export const alignEnd = (): FlexStyle['alignItems'] => 'flex-end';

// Positioning helpers
export const startPosition = (value: number): object => ({ start: value });
export const endPosition = (value: number): object => ({ end: value });

// Border helpers
export const borderStartWidth = (value: number): object => ({ borderStartWidth: value });
export const borderEndWidth = (value: number): object => ({ borderEndWidth: value });
export const borderStartColor = (color: string): object => ({ borderStartColor: color });
export const borderEndColor = (color: string): object => ({ borderEndColor: color });
