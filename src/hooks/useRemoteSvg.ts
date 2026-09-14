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
  url: string | null;
  xml: string | null;
  status: RemoteSvgStatus;
}

interface Download {
  promise: Promise<string>;
  controller: AbortController;
  consumers: number;
}

/** Raw SVG text by URL. A new-style mind map is ~380 KB, so a few megabytes at most. */
const MAX_CACHED = 6;

/**
 * React Native's fetch never times out on its own, so a stalled connection
 * would spin forever instead of reaching the retry card. Generous, because a
 * map is ~380 KB and students are often on slow mobile data.
 */
export const DOWNLOAD_TIMEOUT_MS = 30_000;

const cache = new Map<string, string>();
/** Downloads in progress. A consumer that mounts mid-download joins the running one. */
const inflight = new Map<string, Download>();

const remember = (url: string, xml: string) => {
  cache.delete(url);
  cache.set(url, xml);
  if (cache.size > MAX_CACHED) {
    cache.delete(cache.keys().next().value as string);
  }
};

/** Test seam. */
export const clearRemoteSvgCache = (): void => {
  cache.clear();
  inflight.clear();
};

const stateFor = (url: string | null): RemoteSvgState => {
  if (!url) return { url, xml: null, status: 'idle' };
  const cached = cache.get(url);
  return cached === undefined
    ? { url, xml: null, status: 'loading' }
    : { url, xml: cached, status: 'loaded' };
};

// A 2xx is no proof of a map: a captive portal answers with HTML and a
// not-yet-written object with nothing — cached, either would fail every retry.
const isSvgText = (text: string): boolean => /<svg[\s>]/i.test(text);

const startDownload = (url: string): Download => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  const download: Download = {
    controller,
    consumers: 0,
    promise: fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Fetching ${url} failed with status ${response.status}`);
        return response.text();
      })
      .then((xml) => {
        if (!isSvgText(xml)) throw new Error(`${url} did not return an SVG`);
        remember(url, xml);
        return xml;
      })
      .finally(() => {
        clearTimeout(timeout);
        if (inflight.get(url) === download) inflight.delete(url);
      }),
  };
  // Every consumer attaches its own failure handler; this only stops a
  // download that all of them have left from surfacing as unhandled.
  download.promise.catch(() => undefined);
  inflight.set(url, download);
  return download;
};

const join = (url: string): Download => {
  const running = inflight.get(url);
  const download = running && !running.controller.signal.aborted ? running : startDownload(url);
  download.consumers += 1;
  return download;
};

/** The last consumer to leave cancels the request. */
const leave = (url: string, download: Download): void => {
  download.consumers -= 1;
  if (download.consumers > 0) return;
  download.controller.abort();
  if (inflight.get(url) === download) inflight.delete(url);
};

/**
 * Downloads an SVG once and hands the same text to every consumer.
 *
 * Why not react-native-svg's `SvgUri`: it downloads per mounted instance,
 * cannot be cancelled, and gives no way to share the result or to show
 * progress. The mind map is shown inline *and* in a fullscreen viewer, so with
 * `SvgUri` one visit downloaded and parsed the file two or three times.
 *
 * - Cached per URL and shared while in flight, so the viewer opening after —
 *   or during — the preview's download never fetches the map again.
 * - Times out, and treats a body that is not an SVG as a failure.
 * - `retry` downloads again even after a load, so a file the renderer rejected
 *   is not simply re-read from the cache.
 * - State is derived per URL: after the reader swaps lessons in place, the very
 *   first render already describes the new map — never the old one as loaded.
 * - Cancelled when its last consumer unmounts or moves to another URL.
 * - A `null` URL means "not yet": the reader defers the download until the
 *   screen transition has finished.
 * - The text is returned as downloaded. A consumer that draws it with
 *   react-native-svg normalises it first (`normalizeSvgXml`); the mind map's
 *   WebView wants it untouched.
 */
export const useRemoteSvg = (url: string | null) => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RemoteSvgState>(() => stateFor(url));
  const current = state.url === url ? state : stateFor(url);

  useEffect(() => {
    if (!url || cache.has(url)) return undefined;
    let listening = true;
    const download = join(url);
    download.promise.then(
      (xml) => {
        if (listening) setState({ url, xml, status: 'loaded' });
      },
      () => {
        if (listening) setState({ url, xml: null, status: 'error' });
      },
    );
    return () => {
      listening = false;
      leave(url, download);
    };
  }, [url, attempt]);

  const retry = useCallback(() => {
    if (!url) return;
    cache.delete(url);
    setState(stateFor(url));
    setAttempt((n) => n + 1);
  }, [url]);

  return { xml: current.xml, status: current.status, retry };
};
