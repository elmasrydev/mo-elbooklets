import { I18nManager, FlexStyle } from 'react-native';

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

// TextInput alignment — do NOT use plain textAlign:'left' here (BKLT-312).
//
// The "let native RTL flip 'left'" rule works for <Text> only: the RTL swap
// lives behind a layoutDirection check that ONLY the text/paragraph path sets
// (ParagraphShadowNode.cpp on Fabric, RCTTextShadowView.mm on paper). No
// TextInput view propagates layoutDirection, so it stays LTR and 'left'/'right'
// stay PHYSICAL for inputs on both platforms — which is why Arabic placeholders
// rendered hard-left on iOS AND Android.
//
// So pin the PHYSICAL side to the native RTL flag on both platforms: right in
// RTL, left in LTR — the same direction the input's own box, icons and padding
// are laid out with, so text and container can't disagree. An explicit value is
// also required on Android: leaving it unset (Gravity.START) lets typed text
// scroll out of view as you type in an RTL field — the search "text disappears"
// bug. Do NOT also set textAlign in the input's own style (it would win).
// Module scope is safe: I18nManager.isRTL is a boot-time snapshot that only
// changes across a restart, so reading it later returns the same value.
//
// Typed narrowly so it fits both the style property and the TextInput
// `textAlign` prop (which rejects 'auto' | 'justify').
export const INPUT_TEXT_ALIGN: 'left' | 'right' = I18nManager.isRTL ? 'right' : 'left';

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
