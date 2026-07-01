/**
 * Shared form validators — the single source of truth for auth/profile input rules.
 *
 * These regexes were previously duplicated inline across ~7 screens/components,
 * which meant the unit tests could only ever test a *copy*. Import from here so the
 * tests exercise the same code the screens run.
 */

// Egyptian mobile: 11 digits starting 010 / 011 / 012 / 015.
export const EGYPT_MOBILE_REGEX = /^01[0125]\d{8}$/;

// Pragmatic email shape check (not RFC-complete on purpose — matches the app's UX).
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password policy (BKLT-284): minimum 6 characters, nothing else required —
// no mandatory uppercase, digit, or special character. Keep this in sync with the
// backend policy so registration/login can't disagree.
export const PASSWORD_REGEX = /^.{6,}$/;
