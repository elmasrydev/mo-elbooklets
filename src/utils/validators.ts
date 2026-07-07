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

// Password policy (BKLT-297): registration requires a minimum of 8 characters,
// nothing else required — no mandatory uppercase, digit, or special character.
// (Supersedes the earlier 6-char rule from BKLT-284.) Keep this in sync with the
// backend, which rejects passwords shorter than 8 at registration.
export const PASSWORD_REGEX = /^.{8,}$/;
