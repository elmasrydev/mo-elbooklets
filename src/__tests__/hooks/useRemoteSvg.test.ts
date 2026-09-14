import { act, renderHook, waitFor } from '@testing-library/react-native';
import { clearRemoteSvgCache, combinedLoadStatus, useRemoteSvg } from '../../hooks/useRemoteSvg';

const MAP_URL = 'https://cdn.example.com/storage/328/lesson-328-mindmap.svg';
const MAP_XML = '<svg><style>@font-face{}</style><text>it&apos;s</text></svg>';

type FetchMock = jest.Mock<Promise<{ ok: boolean; status: number; text: () => Promise<string> }>>;

const respondWith = (body: string, ok = true): FetchMock =>
  jest.fn(() => Promise.resolve({ ok, status: ok ? 200 : 500, text: () => Promise.resolve(body) }));

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

  it('stays idle without a URL, so a deferred preview costs nothing', () => {
    const { result } = renderHook(() => useRemoteSvg(null));
    expect(result.current).toMatchObject({ status: 'idle', xml: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a failed download and downloads again on retry', async () => {
    global.fetch = respondWith('', false) as unknown as typeof fetch;
    const { result } = renderHook(() => useRemoteSvg(MAP_URL));
    await waitFor(() => expect(result.current.status).toBe('error'));

    global.fetch = fetchMock as unknown as typeof fetch;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.xml).toBe(MAP_XML);
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
