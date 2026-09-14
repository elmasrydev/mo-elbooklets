import { useCallback, useEffect, useState } from 'react';

export type RemoteSvgStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** The three states a loader UI distinguishes. */
export type LoadStatus = 'loading' | 'loaded' | 'error';

/**
 * What a skeleton / retry card needs, from the download and the render. The
 * render can fail after the download succeeded — react-native-svg reporting a
 * file it cannot parse, a WebView failing to load — so both count, and only
 * both succeeding is "loaded". `idle` reads as loading: a deferred download
 * still shows the skeleton.
 */
export const combinedLoadStatus = (download: RemoteSvgStatus, render: LoadStatus): LoadStatus => {
  if (download === 'error' || render === 'error') return 'error';
  return download === 'loaded' && render === 'loaded' ? 'loaded' : 'loading';
};

interface RemoteSvgState {
  xml: string | null;
  status: RemoteSvgStatus;
}

/** Raw SVG text by URL. A new-style mind map is ~380 KB, so a few megabytes at most. */
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
 * - Cached per URL, so the viewer opening after the preview is a hit.
 * - Cancelled on unmount and on URL change, and a late response for an old
 *   URL is ignored — the reader swaps lessons in place.
 * - A `null` URL means "not yet": the reader defers the download until the
 *   screen transition has finished.
 * - The text is returned as downloaded. A consumer that draws it with
 *   react-native-svg normalises it first (`normalizeSvgXml`); the mind map's
 *   WebView wants it untouched.
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
      .then((xml) => {
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
