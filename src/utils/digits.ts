/**
 * Arabic-Indic digit normalization.
 *
 * The backend accepts Arabic-Indic numerals anywhere a number or an OTP code is
 * expected and converts them itself (mobile-otp-guide.md section 1). The hazard
 * is on our side: JavaScript's `\d` and a `[^0-9]` character class are
 * ASCII-only, so stripping before normalizing silently deletes an Arabic code
 * and leaves the user staring at an empty field with no error.
 *
 * Always normalize first, then strip — `digitsOnly()` below does both in order.
 *
 * The ranges are built with `new RegExp` over ASCII-only sources so the code
 * points stay explicit and survive any tooling that mangles non-ASCII source.
 * A `\p{...}` property escape must never be used here: it is a bundle-load
 * parse error on Hermes.
 */

/** Arabic-Indic digits U+0660..U+0669 (٠ through ٩). */
const ARABIC_INDIC_ZERO = 0x0660;
/** Extended Arabic-Indic (Persian/Urdu) digits U+06F0..U+06F9 (۰ through ۹). */
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;
const ASCII_ZERO = 0x30;

const ARABIC_INDIC_RANGE = new RegExp('[\\u0660-\\u0669]', 'g');
const EXTENDED_ARABIC_INDIC_RANGE = new RegExp('[\\u06F0-\\u06F9]', 'g');

const toAscii = (rangeStart: number) => (char: string) =>
  String.fromCharCode(char.charCodeAt(0) - rangeStart + ASCII_ZERO);

/**
 * Converts Arabic-Indic and Extended Arabic-Indic digits to ASCII `0`-`9`,
 * leaving every other character untouched.
 */
export const normalizeDigits = (value: string): string =>
  value
    .replace(ARABIC_INDIC_RANGE, toAscii(ARABIC_INDIC_ZERO))
    .replace(EXTENDED_ARABIC_INDIC_RANGE, toAscii(EXTENDED_ARABIC_INDIC_ZERO));

/**
 * Normalizes then keeps only ASCII digits — the safe replacement for a bare
 * `replace(/[^0-9]/g, '')` on any field a user may type in Arabic.
 */
export const digitsOnly = (value: string): string => normalizeDigits(value).replace(/[^0-9]/g, '');
