import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { combinedLoadStatus, LoadStatus, useRemoteSvg } from './useRemoteSvg';
import { resolveMindMapKind } from '../utils/mindMap';
import { MindMapViewMode, svgDocument } from '../utils/mindMapHtml';

/**
 * Loading state for one lesson mind map, shared by the inline preview and the
 * fullscreen viewer.
 *
 * An SVG map loads in two steps — the download (`useRemoteSvg`) and the
 * WebView's render — and only both succeeding counts as loaded; a raster has
 * only expo-image's own load. Wire `onLoad`/`onError` to whichever view draws
 * the map and use `attempt` as its `key`: `retry` downloads again after a
 * failed download, and remounts the view after a failed render. `active:
 * false` holds an SVG download back.
 */
export const useMindMapLoad = (
  url: string | null | undefined,
  mimeType: string | null | undefined,
  mode: MindMapViewMode,
  active = true,
) => {
  const kind = resolveMindMapKind(url, mimeType);
  const isSvg = kind === 'svg';
  const svg = useRemoteSvg(isSvg && active ? (url as string) : null);
  const html = useMemo(() => (svg.xml ? svgDocument(svg.xml, mode) : null), [svg.xml, mode]);
  const [attempt, setAttempt] = useState(0);
  // A render result belongs to one view: one kind, one map, one attempt. A
  // lesson cached without its MIME type starts on the raster branch and moves
  // to the WebView once the full lesson arrives — expo-image's verdict on an
  // SVG must not carry over to it, nor a failed attempt's to its retry.
  const renderKey = `${kind}:${url}:${attempt}`;
  // The key of the last committed render, read by the view callbacks: one from
  // a view that has since been replaced is ignored instead of overwriting the
  // current map's result. Set after commit, so a render React starts and then
  // discards cannot move it.
  const currentRenderKey = useRef(renderKey);
  useLayoutEffect(() => {
    currentRenderKey.current = renderKey;
  });
  const [render, setRender] = useState<{ key: string; status: LoadStatus }>({
    key: renderKey,
    status: 'loading',
  });
  // Cleared the moment the key changes, so a key that comes back — a lesson
  // re-fed without its MIME type, which turns `kind` to 'raster' again — starts
  // over instead of being served that view's old verdict.
  if (render.key !== renderKey) setRender({ key: renderKey, status: 'loading' });
  const renderStatus = render.key === renderKey ? render.status : 'loading';
  const settleRender = (status: LoadStatus) => {
    if (renderKey === currentRenderKey.current) setRender({ key: renderKey, status });
  };

  const retry = () => {
    settleRender('loading');
    if (isSvg && svg.status === 'error') svg.retry();
    else setAttempt((n) => n + 1);
  };

  return {
    kind,
    html,
    status: isSvg ? combinedLoadStatus(svg.status, renderStatus) : renderStatus,
    attempt,
    onLoad: () => settleRender('loaded'),
    onError: () => settleRender('error'),
    retry,
  };
};
