import { parse, type JsxAST } from 'react-native-svg';
import { logError, logWarning } from '../utils/logger';

/**
 * LaTeX → a react-native-svg tree, through MathJax (BKLT-399).
 *
 * MathJax runs in plain JS with no DOM (its "lite" adaptor) and writes SVG
 * whose glyphs are paths from its TeX fonts — the Computer Modern look of the
 * admin's KaTeX preview, with no font files to load. react-native-svg draws the
 * result natively, so a formula sits inline in a `<Text>` like any view.
 *
 * MathJax is ~1.6 MB of JS, most of it glyph data, so it is `require`d on the
 * first formula rather than imported: a session that never meets math never
 * evaluates it.
 */

export type RenderedMath = {
  ast: JsxAST;
  /** Size in em of the formula's font — MathJax's viewBox is 1000 units per em. */
  widthEm: number;
  heightEm: number;
  /** How far the formula reaches below the text baseline, in em. */
  depthEm: number;
};

type Converter = (tex: string, display: boolean) => string;

/**
 * TeX packages matching what KaTeX (the admin preview) understands. Not
 * `noundefined`/`noerrors`: an unknown macro has to fail, so the formula falls
 * back to its source like KaTeX's `throwOnError: false` does, instead of
 * rendering in red.
 */
const TEX_PACKAGES = ['base', 'ams', 'newcommand', 'boldsymbol', 'color', 'cancel', 'gensymb'];

const createConverter = (): Converter => {
  /* eslint-disable @typescript-eslint/no-require-imports -- deferred on purpose, see above */
  const { mathjax } = require('mathjax-full/js/mathjax.js');
  const { TeX } = require('mathjax-full/js/input/tex.js');
  const { SVG } = require('mathjax-full/js/output/svg.js');
  const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
  const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
  // Each package registers itself with the TeX input jax when loaded.
  require('mathjax-full/js/input/tex/base/BaseConfiguration.js');
  require('mathjax-full/js/input/tex/ams/AmsConfiguration.js');
  require('mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js');
  require('mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js');
  require('mathjax-full/js/input/tex/color/ColorConfiguration.js');
  require('mathjax-full/js/input/tex/cancel/CancelConfiguration.js');
  require('mathjax-full/js/input/tex/gensymb/GensymbConfiguration.js');
  /* eslint-enable @typescript-eslint/no-require-imports */

  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const input = new TeX({
    packages: TEX_PACKAGES,
    // Throw instead of rendering an error box, so the caller can fall back.
    formatError: (_jax: unknown, error: Error) => {
      throw error;
    },
  });
  const document = mathjax.document('', {
    InputJax: input,
    // 'none': every glyph is an inline path. The default shares glyphs through
    // <defs>/<use> ids, which buys nothing for formulas this small.
    OutputJax: new SVG({ fontCache: 'none' }),
  });

  // KaTeX renders every formula on its own; MathJax keeps `\newcommand`,
  // `\def`, `\let`, `\newenvironment` and `\label` for every later one. Without
  // this, one formula that redefines `\frac` breaks the rest of the session
  // (and the cache freezes whichever order the formulas were met in), and a
  // label used twice fails the second formula. `reset()` is MathJax's own
  // label reset; the definition tables have no public API (`map` is internal
  // to the pinned 3.2.2).
  const forgetDefinitions = () => {
    input.reset();
    for (const table of ['new-Command', 'new-Environment', 'new-Delimiter']) {
      input.parseOptions.handlers.retrieve(table)?.map.clear();
    }
  };

  return (tex, display) => {
    try {
      return adaptor.innerHTML(document.convert(tex, { display }));
    } finally {
      forgetDefinitions();
    }
  };
};

/** `undefined` until the first formula; `null` once MathJax has failed to load. */
let converter: Converter | null | undefined;

const getConverter = (): Converter | null => {
  if (converter === undefined) {
    try {
      converter = createConverter();
    } catch (error) {
      // A build problem, not content — report it, and don't retry per formula.
      converter = null;
      logError('MathJax failed to load', error);
    }
  }
  return converter;
};

const VIEW_BOX = /viewBox="(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)"/;
const UNITS_PER_EM = 1000;

const toRenderedMath = (svg: string): RenderedMath | null => {
  const viewBox = VIEW_BOX.exec(svg);
  if (!viewBox) return null;
  const [, , minY, width, height] = viewBox.map(Number);
  // The root's `style="vertical-align: …ex"` is CSS for a browser; RN would
  // read it as an (invalid) text verticalAlign. Placement comes from depthEm.
  const ast = parse(svg.replace(/^<svg([^>]*?) style="[^"]*"/, '<svg$1'));
  if (!ast) return null;
  return {
    ast,
    widthEm: width / UNITS_PER_EM,
    heightEm: height / UNITS_PER_EM,
    // The viewBox's top edge is `minY` (negative: above the baseline), so what
    // is left of the height below 0 is the depth.
    depthEm: (height + minY) / UNITS_PER_EM,
  };
};

/**
 * Formulas already converted, least recently used first. A formula is a few KB
 * of paths, so 500 of them — several lessons and quizzes of math — stay small.
 */
const MAX_CACHED = 500;
const cache = new Map<string, RenderedMath | null>();

/**
 * Converts one formula (without its delimiters). `null` when the TeX does not
 * parse — the caller shows the source instead, as the admin preview does.
 */
export const renderMath = (tex: string, display: boolean): RenderedMath | null => {
  const key = `${display ? 'D' : 'I'}${tex}`;
  if (cache.has(key)) {
    const hit = cache.get(key)!;
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const convert = getConverter();
  if (!convert) return null;

  let rendered: RenderedMath | null = null;
  try {
    rendered = toRenderedMath(convert(tex, display));
  } catch (error) {
    // Content, not a crash: the editor's formula did not parse.
    logWarning(`Math did not render (${error instanceof Error ? error.message : String(error)})`);
  }

  cache.set(key, rendered);
  if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!);
  return rendered;
};
