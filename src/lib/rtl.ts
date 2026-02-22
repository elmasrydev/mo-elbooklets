import { I18nManager, FlexStyle, TextStyle } from 'react-native';

/**
 * RTL Utilities for ElBooklets Mobile
 *
 * Static utility functions for use outside of React components.
 * For component-level RTL support, prefer the `useRTL` hook or `useCommonStyles`.
 *
 * Since I18nManager.isRTL is properly synced on app boot, all native
 * logical properties (marginStart, paddingStart, start/end, etc.)
 * work correctly without manual overrides.
 */

// Base RTL check
export const isRTL = (): boolean => I18nManager.isRTL;

// Flex direction — 'row' auto-flips when I18nManager.isRTL is true
export const rowDirection = (): FlexStyle['flexDirection'] => 'row';

export const textAlign = (): 'left' | 'right' | 'center' => 'left';

// Logical properties — these auto-flip with I18nManager.isRTL
export const marginStart = (value: number): object => ({ marginStart: value });
export const marginEnd = (value: number): object => ({ marginEnd: value });
export const paddingStart = (value: number): object => ({ paddingStart: value });
export const paddingEnd = (value: number): object => ({ paddingEnd: value });

// Arrow direction
export const backArrow = (): string => (I18nManager.isRTL ? '→' : '←');
export const forwardArrow = (): string => (I18nManager.isRTL ? '←' : '→');

// Alignment — auto-flips with I18nManager.isRTL
export const alignStart = (): FlexStyle['alignItems'] => 'flex-start';
export const alignEnd = (): FlexStyle['alignItems'] => 'flex-end';

// Positioning — logical start/end auto-flip with I18nManager.isRTL
export const startPosition = (value: number): object => ({ start: value });
export const endPosition = (value: number): object => ({ end: value });

// Border helpers — logical start/end auto-flip
export const borderStartWidth = (value: number): object => ({ borderStartWidth: value });
export const borderEndWidth = (value: number): object => ({ borderEndWidth: value });
export const borderStartColor = (color: string): object => ({ borderStartColor: color });
export const borderEndColor = (color: string): object => ({ borderEndColor: color });
