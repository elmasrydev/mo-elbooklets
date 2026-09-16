import { COLORS } from '../config/colors';

/**
 * The HTML document a lesson mind map is rendered from (BKLT-174).
 *
 * An SVG map is rendered by a WebView rather than react-native-svg — see
 * `MindMapWebView` for why. The SVG goes in exactly as downloaded, so the
 * generator's embedded font, shadows and Arabic/number direction render as
 * designed; CSS only sizes it to the view (the root's own `width`/`height` are
 * the 1800-wide canvas, and the default `preserveAspectRatio` letterboxes it).
 */

export type MindMapViewMode = 'preview' | 'viewer';

const VIEWPORT: Record<MindMapViewMode, string> = {
  // The inline preview is a picture inside the lesson's scroll view: no zoom,
  // so a stray pinch on the card cannot zoom it.
  preview: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  // The fullscreen viewer: native pinch-zoom and pan, re-rendered from the
  // vectors at every level, so labels stay sharp.
  viewer:
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes',
};

const STYLE =
  `html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:${COLORS.white}}` +
  'body>svg{display:block;width:100%;height:100%}';

export const svgDocument = (svgXml: string, mode: MindMapViewMode): string =>
  '<!DOCTYPE html><html><head><meta charset="utf-8">' +
  `<meta name="viewport" content="${VIEWPORT[mode]}">` +
  `<style>${STYLE}</style></head><body>${svgXml}</body></html>`;
