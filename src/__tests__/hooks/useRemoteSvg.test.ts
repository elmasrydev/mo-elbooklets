import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  clearRemoteSvgCache,
  combinedLoadStatus,
  DOWNLOAD_TIMEOUT_MS,
  MAX_CACHED_CHARS,
  useRemoteSvg,
} from '../../hooks/useRemoteSvg';

const MAP_URL = 'https://cdn.example.com/storage/328/lesson-328-mindmap.svg';
const NEXT_URL = 'https://cdn.example.com/storage/329/lesson-329-mindmap.svg';
const MAP_XML = '<svg><style>@font-face{}</style><text>it&apos;s</text></svg>';
/** Over half the cache's budget, so no two of them fit together. */
const BIG_MAP = `<svg>${' '.repeat(MAX_CACHED_CHARS / 2)}</svg>`;
/** Two fit in the cache, a third does not. */
const PART_MAP = `<svg>${' '.repeat(Math.floor(MAX_CACHED_CHARS * 0.4))}</svg>`;

type FetchMock = jest.Mock<Promise<{ ok: boolean; status: number; text: () => Promise<string> }>>;

const respondWith = (body: string, ok = true): FetchMock =>
  jest.fn(() => Promise.resolve({ ok, status: ok ? 200 : 500, text: () => Promise.resolve(body) }));

/** A connection that never answers — like real fetch, it only rejects once aborted. */
const stalled = () =>
  jest.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<never>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );

describe('useRemoteSvg', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    clearRemoteSvgCache();
    fetchMock = respondWith(MAP_XML);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('downloads once, hands out the text untouched, and serves the next consumer from cache', async () => {
    const first = renderHook(() => useRemoteSvg(MAP_URL));
    expect(first.result.current.status).toBe('loading');

    await waitFor(() => expect(first.result.current.status).toBe('loaded'));
    // Untouched: the mind map's WebView renders fonts and entities itself.
    expect(first.result.current.xml).toBe(MAP_XML);

    // The viewer mounting after the preview: no second request, loaded at once.
    const second = renderHook(() => useRemoteSvg(MAP_URL));
    expect(second.result.current).toMatchObject({ status: 'loaded', xml: MAP_XML });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shares a download in flight, so the viewer opening mid-download does not fetch the map again', async () => {
    let respond: (body: string) => void = () => {};
    const fetchSpy = jest.fn(
      () =>
        new Promise((resolve) => {
          respond = (body) => resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
        }),
    );
    global.fetch = fetchSpy as unknown as typeof fetch;

    const preview = renderHook(() => useRemoteSvg(MAP_URL));
    const viewer = renderHook(() => useRemoteSvg(MAP_URL));
    await act(async () => respond(MAP_XML));

    expect(preview.result.current).toMatchObject({ status: 'loaded', xml: MAP_XML });
    expect(viewer.result.current).toMatchObject({ status: 'loaded', xml: MAP_XML });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('stays idle without a URL, so a deferred preview costs nothing', () => {
    const { result } = renderHook(() => useRemoteSvg(null));
    expect(result.current).toMatchObject({ status: 'idle', xml: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a server error', () => respondWith('', false)],
    ['an empty body', () => respondWith('')],
    ['a page that is not an SVG', () => respondWith('<html>captive portal</html>')],
  ])('treats %s as a failure, and downloads again on retry', async (_case, failing) => {
    global.fetch = failing() as unknown as typeof fetch;
    const { result } = renderHook(() => useRemoteSvg(MAP_URL));
    await waitFor(() => expect(result.current.status).toBe('error'));

    global.fetch = fetchMock as unknown as typeof fetch;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current).toMatchObject({ status: 'loaded', xml: MAP_XML }));
  });

  it('downloads again on retry even after a load, so a file the renderer rejected is not re-read from cache', async () => {
    global.fetch = respondWith('<svg><broken') as unknown as typeof fetch;
    const { result } = renderHook(() => useRemoteSvg(MAP_URL));
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    global.fetch = fetchMock as unknown as typeof fetch;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.xml).toBe(MAP_XML));
  });

  it('gives up on a stalled connection, so the student gets the retry card instead of an endless spinner', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = stalled() as unknown as typeof fetch;
      const { result } = renderHook(() => useRemoteSvg(MAP_URL));
      expect(result.current.status).toBe('loading');

      await act(async () => {
        jest.advanceTimersByTime(DOWNLOAD_TIMEOUT_MS);
      });
      expect(result.current.status).toBe('error');
    } finally {
      jest.useRealTimers();
    }
  });

  // Regression (code review, 2026-09-14): the first render after Next still reported the
  // previous lesson's map as loaded, and the reader counted the new map as viewed.
  it('never reports the previous map as loaded for the next URL, not even for one render', async () => {
    const seen: { url: string; status: string }[] = [];
    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => {
        const svg = useRemoteSvg(url);
        seen.push({ url, status: svg.status });
        return svg;
      },
      { initialProps: { url: MAP_URL } },
    );
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    global.fetch = stalled() as unknown as typeof fetch;
    rerender({ url: NEXT_URL });
    expect(
      seen.filter((render) => render.url === NEXT_URL).map((render) => render.status),
    ).not.toContain('loaded');
  });

  // Regression (code review, 2026-09-15): a consumer shown straight from the cache kept no copy,
  // so later downloads evicting that entry turned a map on screen back into an endless spinner.
  it('keeps showing a map after later downloads evict it from the cache', async () => {
    const earlier = renderHook(() => useRemoteSvg(MAP_URL));
    await waitFor(() => expect(earlier.result.current.status).toBe('loaded'));
    earlier.unmount();

    // The reader's preview: held back (null) at first, then pointed at the cached map.
    const preview = renderHook(({ url }: { url: string | null }) => useRemoteSvg(url), {
      initialProps: { url: null as string | null },
    });
    preview.rerender({ url: MAP_URL });

    global.fetch = respondWith(BIG_MAP) as unknown as typeof fetch;
    for (let i = 0; i < 3; i += 1) {
      const other = renderHook(() => useRemoteSvg(`https://cdn.example.com/other-${i}.svg`));
      await waitFor(() => expect(other.result.current.status).toBe('loaded'));
    }

    preview.rerender({ url: MAP_URL });
    expect(preview.result.current).toMatchObject({ status: 'loaded', xml: MAP_XML });

    // Evicted for real: a newcomer has to download it again.
    const newcomer = renderHook(() => useRemoteSvg(MAP_URL));
    expect(newcomer.result.current.status).toBe('loading');
    await waitFor(() => expect(newcomer.result.current.status).toBe('loaded'));
  });

  // Regression (code review, 2026-09-15): the cache counted files, three of them, so a quiz with
  // more than three SVG images downloaded the early ones again on the way back.
  it("keeps a whole quiz's images, because the cache is budgeted by size, not by file", async () => {
    const images = Array.from({ length: 10 }, (_, i) => `https://cdn.example.com/q-${i}.svg`);
    for (const image of images) {
      const { result, unmount } = renderHook(() => useRemoteSvg(image));
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      unmount();
    }

    const backToFirst = renderHook(() => useRemoteSvg(images[0]));
    // Loaded on its first render: served from the cache, not downloaded again.
    expect(backToFirst.result.current.status).toBe('loaded');
  });

  // Regression (code review, 2026-09-15): eviction went by download order, so a lesson map the
  // student kept reopening was pushed out by newer files and downloaded again.
  it('evicts the least recently used map, not the oldest download', async () => {
    global.fetch = respondWith(PART_MAP) as unknown as typeof fetch;
    const [first, second, third] = [1, 2, 3].map((n) => `https://cdn.example.com/map-${n}.svg`);
    const open = async (url: string) => {
      const { result, unmount } = renderHook(() => useRemoteSvg(url));
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      unmount();
    };
    await open(first);
    await open(second);
    await open(first); // reopened from the cache
    await open(third); // over budget: the second goes, not the first

    expect(renderHook(() => useRemoteSvg(first)).result.current.status).toBe('loaded');
    const evicted = renderHook(() => useRemoteSvg(second));
    expect(evicted.result.current.status).toBe('loading');
    evicted.unmount();
  });

  // Regression (code review, 2026-09-16): a file over the whole budget was dropped instead of
  // cached, so the viewer downloaded again what the preview had just fetched.
  it('keeps a file bigger than the whole budget on its own, rather than downloading it twice', async () => {
    const hugeUrl = 'https://cdn.example.com/huge.svg';
    const lesson = renderHook(() => useRemoteSvg(MAP_URL));
    await waitFor(() => expect(lesson.result.current.status).toBe('loaded'));
    lesson.unmount();

    global.fetch = respondWith(
      `<svg>${' '.repeat(MAX_CACHED_CHARS)}</svg>`,
    ) as unknown as typeof fetch;
    const preview = renderHook(() => useRemoteSvg(hugeUrl));
    await waitFor(() => expect(preview.result.current.status).toBe('loaded'));
    preview.unmount();

    // The viewer opening the same map: straight from the cache.
    expect(renderHook(() => useRemoteSvg(hugeUrl)).result.current.status).toBe('loaded');
    // Over budget on its own, so it did push the smaller map out.
    const evicted = renderHook(() => useRemoteSvg(MAP_URL));
    expect(evicted.result.current.status).toBe('loading');
    evicted.unmount();
  });

  it('cancels the request when the URL changes, so a slow old map cannot overwrite the new one', async () => {
    const signals: AbortSignal[] = [];
    let resolveOld: (body: string) => void = () => {};
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      signals.push(init!.signal as AbortSignal);
      if (signals.length === 1) {
        return new Promise((resolve) => {
          resolveOld = (body) =>
            resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<svg>new</svg>'),
      });
    }) as unknown as typeof fetch;

    const { result, rerender } = renderHook(({ url }: { url: string }) => useRemoteSvg(url), {
      initialProps: { url: 'https://cdn.example.com/old.svg' },
    });
    rerender({ url: 'https://cdn.example.com/new.svg' });

    expect(signals[0].aborted).toBe(true);
    await waitFor(() => expect(result.current.xml).toBe('<svg>new</svg>'));

    // The old response arriving late must not win.
    resolveOld('<svg>old</svg>');
    await act(async () => {});
    expect(result.current.xml).toBe('<svg>new</svg>');
  });
});

describe('combinedLoadStatus', () => {
  it.each([
    ['idle', 'loading', 'loading'],
    ['loading', 'loaded', 'loading'],
    ['loaded', 'loading', 'loading'],
    ['loaded', 'loaded', 'loaded'],
    ['error', 'loaded', 'error'],
    ['loaded', 'error', 'error'],
  ] as const)('download %s + render %s → %s', (download, render, expected) => {
    expect(combinedLoadStatus(download, render)).toBe(expected);
  });
});
