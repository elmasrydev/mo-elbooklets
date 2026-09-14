import { useCallback, useEffect, useState } from 'react';
import { normalizeSvgXml } from '../utils/svgCompat';

export type RemoteSvgStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** The three states a loader UI distinguishes. */
export type LoadStatus = 'loading' | 'loaded' | 'error';

/**
 * Collapses the hook's status and a render-time parse failure (react-native-svg
 * reports an unparseable file through `SvgXml`'s `onError`, after the download
 * succeeded) into what a skeleton / retry card needs. `idle` reads as loading:
 * a deferred download still shows the skeleton.
 */
export const svgLoadStatus = (status: RemoteSvgStatus, unparseable: boolean): LoadStatus => {
  if (unparseable || status === 'error') return 'error';
  return status === 'loaded' ? 'loaded' : 'loading';
};

interface RemoteSvgState {
  xml: string | null;
  status: RemoteSvgStatus;
}

/** Normalised SVG text by URL. Small: a normalised mind map is ~20 KB. */
const MAX_CACHED = 6;
const cache = new Map<string, string>();

const remember = (url: string, xml: string) => {
  cache.delete(url);
  cache.set(url, xml);
  if (cache.size > MAX_CACHED) {
    cache.delete(cache.keys().next().value as string);
  }
};

/** Test seam. */
export const clearRemoteSvgCache = (): void => cache.clear();

const stateFor = (url: string | null): RemoteSvgState => {
  if (!url) return { xml: null, status: 'idle' };
  const cached = cache.get(url);
  return cached === undefined
    ? { xml: null, status: 'loading' }
    : { xml: cached, status: 'loaded' };
};

/**
 * Downloads an SVG once and hands the same text to every consumer.
 *
 * Why not react-native-svg's `SvgUri`: it downloads per mounted instance,
 * cannot be cancelled, and gives no way to share the result or to show
 * progress. The mind map is shown inline *and* in a fullscreen viewer, so with
 * `SvgUri` one visit downloaded and parsed the file two or three times.
 *
 * - Cached per URL, so the viewer opening after the preview is a hit and
 *   renders on the first frame.
 * - Cancelled on unmount and on URL change, and a late response for an old
 *   URL is ignored — the reader swaps lessons in place.
 * - A `null` URL means "not yet": the reader defers the download until the
 *   screen transition has finished.
 * - The text is normalised (`normalizeSvgXml`) before caching, which also drops
 *   the 360 KB font block the newer maps carry.
 */
export const useRemoteSvg = (url: string | null) => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RemoteSvgState>(() => stateFor(url));

  useEffect(() => {
    const next = stateFor(url);
    setState(next);
    if (!url || next.status === 'loaded') return undefined;

    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Fetching ${url} failed with status ${response.status}`);
        return response.text();
      })
      .then((text) => {
        const xml = normalizeSvgXml(text);
        remember(url, xml);
        if (!controller.signal.aborted) setState({ xml, status: 'loaded' });
      })
      .catch(() => {
        // An abort is this hook cancelling its own request — not a failure.
        if (!controller.signal.aborted) setState({ xml: null, status: 'error' });
      });

    return () => controller.abort();
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { xml: state.xml, status: state.status, retry };
};
