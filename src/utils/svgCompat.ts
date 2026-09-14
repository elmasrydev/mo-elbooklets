/**
 * Compatibility pass over SVG text before it reaches react-native-svg — today
 * the quiz's question images (`QuestionImage`). The lesson mind map, where these
 * rules were found, now renders in a WebView (`MindMapWebView`) and skips it.
 *
 * react-native-svg's parser and renderer (`SvgXml` / `SvgUri`) are narrower
 * than a browser's, and the backend's newer mind-map generator (September 2026)
 * leans on four browser features they lack or draw too slowly. Each is handled
 * by a string rewrite that is a no-op on a file that does not use the
 * construct; rewrites that could hit the wrong thing are scoped to tags or to
 * text, never the whole file.
 *
 * 0. Filters are dropped — definitions and every `filter="…"` attribute. This
 *    one is about the app freezing, not about looks. react-native-svg renders
 *    a filter through CoreImage on the CPU, on the main thread, once per
 *    filtered element, on every redraw. The generator puts a soft
 *    `feDropShadow` on 35 pills and circles, and profiling the lesson screen
 *    on the simulator put 5.8 s of a 25 s window inside that CoreImage work:
 *    scrolling and taps froze whenever the map drew — on arrival, and again on
 *    every rotation into and out of the fullscreen viewer. The visual cost is
 *    a 16 %-opacity shadow; the older maps never had one.
 * 1. `<style>` blocks are dropped. The generator embeds its font as base64
 *    `@font-face` rules — about 360 KB of a 380 KB file. react-native-svg
 *    cannot load fonts from an SVG and `SvgXml` never applies CSS, so the block
 *    only costs memory: left in, it sits in the parsed tree as a text node.
 * 2. `&apos;`, `&#39;` and `&gt;` are decoded in text. react-native-svg's
 *    parser does not decode XML entities, so a label like `it&apos;s` renders
 *    literally. Attribute values are left alone: a decoded `'` would end a
 *    single-quoted value early and make the whole file unparseable.
 * 3. Adjacent bare `<tspan>` siblings are merged. The generator splits a
 *    mixed-direction label into one span per direction run
 *    (`<tspan>‏عددها ‏</tspan><tspan>‎360‎</tspan>…`). A browser lays the runs
 *    out with the bidi algorithm; react-native-svg lays spans out in source
 *    order, so the fragments land on top of each other. Joined into one run,
 *    the platform text engine shapes the whole label. Only a pair of BARE spans
 *    merges — a styled or positioned span (`font-weight`, `x`, `dy`, …) must
 *    not lend its style to the next run — and the whitespace between them
 *    collapses to one space, as a browser renders it.
 */

// Self-closing forms go first: `[^>]*` in a block pattern also accepts the `/`
// of `<filter …/>`, and the lazy body would then run on to the next `</filter>`
// in the file, deleting the drawing in between.
const SELF_CLOSING_FILTER = /<filter\b[^>]*\/>/gi;
const FILTER_BLOCK = /<filter\b[^>]*>[\s\S]*?<\/filter>/gi;
const SELF_CLOSING_STYLE = /<style\b[^>]*\/>/gi;
const STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
// A tag (whose quoted attribute values may themselves contain `>`) or a run of text.
const TAG_OR_TEXT = /(<(?:[^>"']|"[^"]*"|'[^']*')*>)|([^<]+)/g;
// `\s` before and `=` right after keep `filterUnits=` and the like untouched.
const FILTER_ATTRIBUTE = /\sfilter\s*=\s*("[^"]*"|'[^']*')/gi;
const APOSTROPHE_ENTITY = /&apos;|&#39;/g;
const GREATER_THAN_ENTITY = /&gt;/g;
const BARE_TSPAN_PAIR = /(<tspan>[^<]*)<\/tspan>(\s*)<tspan>/g;

const decodeText = (text: string): string =>
  text.replace(APOSTROPHE_ENTITY, "'").replace(GREATER_THAN_ENTITY, '>');

/** Filter attributes out of tags and entities out of text, in one pass. */
const rewriteTagsAndText = (xml: string): string =>
  xml.replace(TAG_OR_TEXT, (_match, tag: string | undefined, text: string) =>
    tag ? tag.replace(FILTER_ATTRIBUTE, '') : decodeText(text),
  );

/** Each pass merges neighbouring pairs, so a run of n spans takes about log2(n) passes. */
const mergeBareTspans = (xml: string): string => {
  let merged = xml;
  let previous: string;
  do {
    previous = merged;
    merged = merged.replace(
      BARE_TSPAN_PAIR,
      (_match, run: string, gap: string) => run + (gap ? ' ' : ''),
    );
  } while (merged !== previous);
  return merged;
};

export const normalizeSvgXml = (xml: string): string =>
  mergeBareTspans(
    rewriteTagsAndText(
      xml
        .replace(SELF_CLOSING_FILTER, '')
        .replace(FILTER_BLOCK, '')
        .replace(SELF_CLOSING_STYLE, '')
        .replace(STYLE_BLOCK, ''),
    ),
  );
