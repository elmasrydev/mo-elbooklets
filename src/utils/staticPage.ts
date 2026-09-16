import { normalizeDigits } from './digits';

/**
 * Plain-text CMS page bodies → display blocks (BKLT-300).
 *
 * The CMS stores these pages as plain text, not HTML. Structure is carried by
 * a few line shapes, taken from the live about-us, terms, privacy, refund and
 * shipping pages in both languages (checked 2026-09-12). One line is one block;
 * blank lines only separate.
 *
 *   `•\t…`              bullet
 *   `1.\t…`             numbered step — number, dot, TAB (refund's "How to
 *                       request" list; ASCII digits even in the Arabic body)
 *   `1. …` / `١. …`     section heading — number, dot, SPACE. One Arabic
 *                       heading also has a space before the dot: `١ . القبول`
 *   `Our Story`         section heading — About Us has unnumbered ones: a
 *                       short line with no colon and no closing punctuation
 *   anything else       paragraph (`Email: …`, `You have the right to:`)
 *
 * The step/heading split is the character after the dot: a tab means step.
 * Digits are normalized before matching, so Arabic-Indic numbers classify the
 * same as ASCII ones; the original text is what gets displayed.
 */
export type StaticPageBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'step'; marker: string; text: string };

const BULLET = /^•\s*/;
const STEP = /^(\d+)\.\t+/;
const NUMBERED_HEADING = /^\d+\s*\.\s+\S/;
/** Longest line still read as an unnumbered heading; About Us's run to ~12. */
const SHORT_HEADING_MAX = 40;
const HAS_COLON = /[:：]/;
/** `.` `!` `?` `…` and the Arabic question mark `؟`. */
const CLOSING_PUNCTUATION = /[.!?…؟]$/;

const isUnnumberedHeading = (line: string): boolean =>
  line.length <= SHORT_HEADING_MAX && !HAS_COLON.test(line) && !CLOSING_PUNCTUATION.test(line);

const classifyLine = (line: string): StaticPageBlock => {
  const bullet = BULLET.exec(line);
  if (bullet) return { kind: 'bullet', text: line.slice(bullet[0].length) };

  // normalizeDigits maps each digit to exactly one character, so offsets found
  // on the normalized copy index the original line too.
  const normalized = normalizeDigits(line);
  const step = STEP.exec(normalized);
  if (step) {
    return {
      kind: 'step',
      marker: line.slice(0, step[1].length),
      text: line.slice(step[0].length).trim(),
    };
  }
  if (NUMBERED_HEADING.test(normalized) || isUnnumberedHeading(line)) {
    return { kind: 'heading', text: line };
  }
  return { kind: 'paragraph', text: line };
};

const sameText = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Splits a page body into blocks. When the body opens by repeating the page's
 * own title as a heading (the English refund policy does), that heading is
 * dropped — the screen header already shows it.
 */
export const parseStaticPage = (body: string, title?: string): StaticPageBlock[] => {
  const blocks = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(classifyLine);

  const [first, ...rest] = blocks;
  if (first?.kind === 'heading' && title && sameText(first.text, title)) return rest;
  return blocks;
};

export type ContentLanguage = 'en' | 'ar';

/**
 * Picks the body for the UI language, falling back to the other language when
 * the preferred one is missing or blank — a half-translated page should still
 * show something. Returns which language was used, so the screen can align and
 * set the font for the text it actually got. `null` when neither has content.
 */
export const pickLocalizedBody = (
  preferred: ContentLanguage,
  bodies: { en?: string | null; ar?: string | null },
): { text: string; language: ContentLanguage } | null => {
  const other: ContentLanguage = preferred === 'ar' ? 'en' : 'ar';
  for (const language of [preferred, other]) {
    const text = bodies[language];
    if (text && text.trim().length > 0) return { text, language };
  }
  return null;
};
