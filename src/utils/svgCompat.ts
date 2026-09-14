/**
 * Compatibility pass over SVG text before it reaches react-native-svg — today
 * the quiz's question images (`QuestionImage`). The lesson mind map, where these
 * rules were found, now renders in a WebView (`MindMapWebView`) and skips it.
 *
 * react-native-svg's parser and renderer (`SvgXml` / `SvgUri`) are narrower
 * than a browser's, and the backend's newer mind-map generator (September 2026)
 * leans on four browser features they lack or draw too slowly. Each is handled
 * by a plain string rewrite, so nothing is parsed twice, and each is a no-op on
 * a file that does not use the construct.
 *
 * 0. Filters are dropped — definitions and every `filter="…"` reference. This
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
 * 2. `&apos;`, `&#39;` and `&gt;` are decoded. react-native-svg's parser does
 *    not decode XML entities, so a label like `it&apos;s` renders literally.
 *    Only these are safe as blind rewrites: `&lt;` would create a tag start and
 *    `&quot;` could terminate an attribute value.
 * 3. Adjacent attribute-less `<tspan>` siblings are merged. The generator splits
 *    a mixed-direction label into one span per direction run
 *    (`<tspan>‏عددها ‏</tspan><tspan>‎360‎</tspan>…`). A browser lays the runs
 *    out with the bidi algorithm; react-native-svg lays spans out in source
 *    order, so the fragments land on top of each other. Joined into one run, the
 *    platform text engine shapes the whole label. Spans carrying attributes
 *    (`x`, `dy`, …) are positioned lines and are left alone; whitespace between
 *    merged spans is kept, since inside text it is a real space.
 */

const FILTER_BLOCK = /<filter\b[^>]*>[\s\S]*?<\/filter>/gi;
const SELF_CLOSING_FILTER = /<filter\b[^>]*\/>/gi;
// `\s` before and `=` right after keep `filterUnits=` and the like untouched.
const FILTER_ATTRIBUTE = /\sfilter\s*=\s*("[^"]*"|'[^']*')/gi;
const STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const ATTRIBUTE_LESS_TSPAN_BOUNDARY = /<\/tspan>(\s*)<tspan>/g;
const APOSTROPHE_ENTITY = /&apos;|&#39;/g;
const GREATER_THAN_ENTITY = /&gt;/g;

export const normalizeSvgXml = (xml: string): string =>
  xml
    .replace(FILTER_BLOCK, '')
    .replace(SELF_CLOSING_FILTER, '')
    .replace(FILTER_ATTRIBUTE, '')
    .replace(STYLE_BLOCK, '')
    .replace(ATTRIBUTE_LESS_TSPAN_BOUNDARY, '$1')
    .replace(APOSTROPHE_ENTITY, "'")
    .replace(GREATER_THAN_ENTITY, '>');
