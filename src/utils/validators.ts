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

/*
 * Name policy (BKLT-318) — for person names and for user-suggested place names
 * (the "Can't find it? Add …" rows for city and school).
 *
 * Whitelist, not blacklist: anything not listed below is not a name character.
 *
 * Person and place names differ in exactly one way: DIGITS. "6th of October
 * City" and "10th of Ramadan City" (مدينة ٦ أكتوبر / مدينة ١٠ رمضان) are real
 * Egyptian cities, and the add-city field exists precisely for cities the list
 * is missing — so places allow digits and people do not. Digits were never the
 * injection risk anyway; `< > " ; \ ( )` are, and those are excluded from both.
 *
 * Explicit \uXXXX ranges rather than \p{L}: no Unicode property escape is used
 * anywhere else in this app, and an unsupported escape is a bundle-load parse
 * error on Hermes rather than a catchable exception. The Arabic ranges mirror
 * the ones already used by isArabicText in src/config/fonts.ts.
 *
 * NOTE: this is a UX and data-quality guard, not a security boundary. The
 * GraphQL endpoint is reachable directly, so the backend still owes us its own
 * validation + parameterized queries (see BKLT-318's expected result).
 */

// True letters only — this set also answers "does the input contain a letter?",
// so a character that cannot stand on its own as one does not belong here.
const LETTER_CHARS =
  'A-Za-z' + // Latin
  // Latin-1 Supplement + Extended-A/B (é, ü, ñ — "Béni Suef"), with U+00D7 (×)
  // and U+00F7 (÷) carved out: they sit inside the block but are math symbols.
  '\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u024F' +
  '\\u0621-\\u063A' + // Arabic ء–غ
  '\\u0641-\\u064A' + // Arabic ف–ي
  '\\u0750-\\u077F' + // Arabic Supplement
  '\\u08A0-\\u08FF'; // Arabic Extended-A

// Allowed inside a name but never sufficient on their own: tatweel is a
// justification stretch, the rest are combining marks that need a base letter.
const MARK_CHARS =
  '\\u0640' + // tatweel (ـ)
  '\\u064B-\\u0652' + // tashkeel (fatha, damma, shadda, sukun, …)
  '\\u0670-\\u0671'; // superscript alef, alef wasla

const DIGIT_CHARS = '0-9\\u0660-\\u0669\\u06F0-\\u06F9'; // Latin + Arabic-Indic digits

// Space, period, apostrophe (straight + curly), hyphen. The hyphen MUST stay
// last in the assembled class or it reads as a range operator — which is why
// PUNCT_CHARS is appended last below rather than PLACE_CHARS being built as
// `PERSON_CHARS + DIGIT_CHARS` (that yields "…'’-0-9" → "range out of order").
// The hyphen is escaped so it stays a literal wherever this set is concatenated.
// Unescaped it is only safe when it lands last in the class (PERSON_CHARS); in
// PLACE_CHARS the digits follow it, making `’-0` an out-of-order range and
// throwing "Invalid regular expression" at module load.
const PUNCT_CHARS = " .'’\\-";

const PERSON_CHARS = LETTER_CHARS + MARK_CHARS + PUNCT_CHARS;
const PLACE_CHARS = LETTER_CHARS + MARK_CHARS + DIGIT_CHARS + PUNCT_CHARS;

// Two instances of the person set on purpose: the /g one carries lastIndex state
// and must never be used with .test(), so validation gets a stateless copy.
const DISALLOWED_PERSON_CHARS_GLOBAL = new RegExp(`[^${PERSON_CHARS}]`, 'g');
const DISALLOWED_PERSON_CHARS = new RegExp(`[^${PERSON_CHARS}]`);
const DISALLOWED_PLACE_CHARS = new RegExp(`[^${PLACE_CHARS}]`);
const HAS_LETTER = new RegExp(`[${LETTER_CHARS}]`);

// Punctuation is legal inside a name but never at an edge or doubled up:
// "El-Sheikh" yes, "-Cairo" / "Cairo--" / "a..b" no. Doubling is also the shape
// SQL comment probes (`--`) take.
const EDGE_PUNCT = /^['’.-]|['’.-]$/;
const REPEATED_PUNCT = /['’.-]{2,}/;

/** Place names can be short ("6th"); person names keep the pre-existing min of 3. */
export const PLACE_NAME_MIN_LENGTH = 2;
export const PERSON_NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 60;

const hasValidShape = (trimmed: string, min: number): boolean =>
  trimmed.length >= min &&
  trimmed.length <= NAME_MAX_LENGTH &&
  HAS_LETTER.test(trimmed) &&
  !EDGE_PUNCT.test(trimmed) &&
  !REPEATED_PUNCT.test(trimmed);

/**
 * Drop every character a person's name cannot contain (digits included),
 * collapse runs of whitespace, and cap the length. Safe to call on every
 * keystroke — this is the `onChangeText` filter for the registration name
 * input. Do NOT use it on a search box: silently eating characters would stop
 * the user finding an entry that already exists.
 */
export const sanitizePersonName = (value: string): string =>
  value
    .replace(DISALLOWED_PERSON_CHARS_GLOBAL, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, NAME_MAX_LENGTH);

/**
 * Whether `value` is acceptable to submit as a person's name: at least 3
 * characters, letters/marks/punctuation only (no digits), contains at least one
 * real letter, and no edge or repeated punctuation.
 */
export const isValidPersonName = (value: string): boolean => {
  const trimmed = value.trim();
  return hasValidShape(trimmed, PERSON_NAME_MIN_LENGTH) && !DISALLOWED_PERSON_CHARS.test(trimmed);
};

/**
 * Whether `value` is acceptable to submit as a user-suggested city or school
 * name. Same rules as a person's name, but digits are allowed and the minimum
 * is 2 characters.
 */
export const isValidPlaceName = (value: string): boolean => {
  const trimmed = value.trim();
  return hasValidShape(trimmed, PLACE_NAME_MIN_LENGTH) && !DISALLOWED_PLACE_CHARS.test(trimmed);
};
