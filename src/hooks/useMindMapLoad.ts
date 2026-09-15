import { useMemo, useState } from 'react';

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
  const [renderStatus, setRenderStatus] = useState<LoadStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setRenderStatus('loading');
    if (isSvg && svg.status === 'error') svg.retry();
    else setAttempt((n) => n + 1);
  };

  return {
    kind,
    html,
    status: isSvg ? combinedLoadStatus(svg.status, renderStatus) : renderStatus,
    attempt,
    onLoad: () => setRenderStatus('loaded'),
    onError: () => setRenderStatus('error'),
    retry,
  };
};
