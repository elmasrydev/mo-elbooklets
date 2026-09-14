/**
 * Compatibility pass over SVG text before it reaches react-native-svg.
 *
 * react-native-svg's parser and renderer (`SvgXml` / `SvgUri`) are narrower
 * than a browser's, and the backend's newer mind-map generator (September 2026)
 * leans on three browser features they lack. Each rewrite below maps one of
 * them onto something react-native-svg renders correctly. All three are plain
 * string rewrites, so nothing is parsed twice, and each is a no-op on files that
 * do not use the construct (the older maps, quiz images).
 *
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

const STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const ATTRIBUTE_LESS_TSPAN_BOUNDARY = /<\/tspan>(\s*)<tspan>/g;
const APOSTROPHE_ENTITY = /&apos;|&#39;/g;
const GREATER_THAN_ENTITY = /&gt;/g;

export const normalizeSvgXml = (xml: string): string =>
  xml
    .replace(STYLE_BLOCK, '')
    .replace(ATTRIBUTE_LESS_TSPAN_BOUNDARY, '$1')
    .replace(APOSTROPHE_ENTITY, "'")
    .replace(GREATER_THAN_ENTITY, '>');
