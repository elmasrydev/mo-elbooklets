import { MATH_DELIMITERS } from '../config/math';

/**
 * Splits server text into plain text and LaTeX formulas (BKLT-399).
 *
 * A port of KaTeX auto-render's `splitAtDelimiters` — the code the admin panel
 * previews content with — so a string splits here exactly as it does there:
 *   - the leftmost opening delimiter wins; at the same position the earlier
 *     one in MATH_DELIMITERS (`$$` before `$`);
 *   - the closing delimiter is only looked for outside `{…}`, and a backslash
 *     skips the next character, so `\}` and `\$` inside a formula never close it;
 *   - an opening delimiter with no closing one is left as plain text.
 * KaTeX's auto-render has no escape for an opening `$` in text, so neither
 * does this: `\$5` still opens a formula, as it does in the admin preview.
 */
export type MathSegment =
  | { kind: 'text'; text: string }
  | { kind: 'math'; tex: string; display: boolean };

const escapeRegex = (value: string): string => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const OPENING = new RegExp(MATH_DELIMITERS.map((d) => escapeRegex(d.left)).join('|'));

/** Index of `right` in `text` from `start`, outside braces; -1 when it never closes. */
const findEndOfMath = (right: string, text: string, start: number): number => {
  let braceLevel = 0;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (braceLevel <= 0 && text.startsWith(right, index)) return index;
    if (character === '\\') index++;
    else if (character === '{') braceLevel++;
    else if (character === '}') braceLevel--;
  }
  return -1;
};

export type InlineRun = { kind: 'text'; text: string } | { kind: 'math'; tex: string };

const TEXT_COMMAND = '\\text{';
/** `\%`, `\$`, `\&`, `\#`, `\_`, `\{`, `\}` — the escapes KaTeX accepts inside `\text`. */
const TEXT_ESCAPES = new Set(['%', '$', '&', '#', '_', '{', '}']);
/** The `\text` is a sub/superscript's argument (`x_\text{max}`), not text of its own. */
const SCRIPT_BEFORE = /[_^]\s*$/;

/**
 * A `\text{…}` group's content as the plain text KaTeX draws for it, or `null`
 * when it holds something only TeX can draw (a command, math in `$…$`) — that
 * group then stays math. As in TeX, bare braces only group and are not drawn,
 * a run of spaces or line breaks is one space, and `~` is a non-breaking space.
 */
const plainTextOf = (content: string): string | null => {
  let text = '';
  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (character === '\\') {
      const escaped = content[++index];
      if (!TEXT_ESCAPES.has(escaped)) return null;
      text += escaped;
    } else if (character === '$') return null;
    else if (character === '~') text += ' ';
    else if (character !== '{' && character !== '}') text += character;
  }
  return text.replace(/[ \t\r\n]+/g, ' ');
};

/**
 * Splits an inline formula at its top-level `\text{…}` groups.
 *
 * Production content wraps whole sentences in one formula — explanations read
 * `\( \text{A thousandth is one part of 1,000 equal pieces…} \)` — and a
 * formula is drawn as one SVG, which cannot wrap: the sentence would run off
 * the screen. `\text` is ordinary text, so it comes out as a text run that wraps
 * with the rest of the paragraph (and Arabic in it gets real shaping and
 * direction); the math between the groups stays math. A `\text` nested inside
 * another group (`\frac{\text{a}}{b}`), a script's argument (`x_\text{max}`),
 * or one holding commands or `$…$` is part of the math and is left alone.
 *
 * A top-level split can still cut a construct that only parses whole
 * (`\left( \text{a} \right)`, a `cases` environment): the caller draws the
 * formula whole when a math run fails to render.
 */
export const splitTextRuns = (tex: string): InlineRun[] => {
  if (!tex.includes(TEXT_COMMAND)) return [{ kind: 'math', tex }];

  const runs: InlineRun[] = [];
  const pushMath = (chunk: string) => {
    if (chunk.trim()) runs.push({ kind: 'math', tex: chunk.trim() });
  };
  let depth = 0;
  let chunkStart = 0;
  for (let index = 0; index < tex.length; index++) {
    if (depth === 0 && tex.startsWith(TEXT_COMMAND, index)) {
      const close = findEndOfMath('}', tex, index + TEXT_COMMAND.length);
      if (close === -1) break;
      const before = tex.slice(chunkStart, index);
      const text = SCRIPT_BEFORE.test(before)
        ? null
        : plainTextOf(tex.slice(index + TEXT_COMMAND.length, close));
      if (text !== null) {
        pushMath(before);
        if (text) runs.push({ kind: 'text', text });
        chunkStart = close + 1;
      }
      index = close;
      continue;
    }
    const character = tex[index];
    if (character === '\\') index++;
    else if (character === '{') depth++;
    else if (character === '}') depth--;
  }
  pushMath(tex.slice(chunkStart));
  return runs;
};

/** A binary operator or relation, which TeX spaces against its neighbours. */
const OPERATOR = String.raw`(?:[-+*=<>:]|\\(?:times|cdot|div|pm|mp|leq?|geq?|neq?|approx|equiv|sim|to|rightarrow|Rightarrow)(?![a-zA-Z]))`;
const LEADING_OPERATOR = new RegExp(`^${OPERATOR}`);
const TRAILING_OPERATOR = new RegExp(`${OPERATOR}$`);

/**
 * The TeX to draw for a math run of `splitTextRuns`. Drawn alone, an operator
 * at its edge loses the space it had against the `\text` beside it
 * (`\text{Total} = 5` would read "Total=5", and a `+` between two groups turns
 * unary); an empty `{}` on that side stands in for the text, as in TeX.
 */
export const spacedAgainstText = (tex: string, textBefore: boolean, textAfter: boolean): string =>
  `${textBefore && LEADING_OPERATOR.test(tex) ? '{}' : ''}${tex}${
    textAfter && TRAILING_OPERATOR.test(tex) ? '{}' : ''
  }`;

/** Cheap pre-check: false means the text certainly holds no formula. */
export const mayContainMath = (text: string): boolean => OPENING.test(text);

export const splitMath = (input: string): MathSegment[] => {
  const segments: MathSegment[] = [];
  // Text next to text (around a dropped empty formula) stays one segment.
  const pushText = (text: string) => {
    const last = segments[segments.length - 1];
    if (last?.kind === 'text') last.text += text;
    else segments.push({ kind: 'text', text });
  };
  let rest = input;

  for (;;) {
    const opening = rest.search(OPENING);
    if (opening === -1) break;
    if (opening > 0) {
      pushText(rest.slice(0, opening));
      rest = rest.slice(opening);
    }
    // `rest` now starts with an opening delimiter, so this always finds one.
    const delimiter = MATH_DELIMITERS.find((d) => rest.startsWith(d.left))!;
    const end = findEndOfMath(delimiter.right, rest, delimiter.left.length);
    if (end === -1) break;

    const tex = rest.slice(delimiter.left.length, end);
    // An empty formula (`$$ $$`) draws nothing in KaTeX either.
    if (tex.trim().length > 0) segments.push({ kind: 'math', tex, display: delimiter.display });
    rest = rest.slice(end + delimiter.right.length);
  }

  if (rest !== '') pushText(rest);
  return segments;
};
