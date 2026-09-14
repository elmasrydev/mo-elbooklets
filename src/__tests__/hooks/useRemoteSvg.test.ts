import { act, renderHook, waitFor } from '@testing-library/react-native';
import { clearRemoteSvgCache, useRemoteSvg } from '../../hooks/useRemoteSvg';

const MAP_URL = 'https://cdn.example.com/storage/328/lesson-328-mindmap.svg';
const RAW = '<svg><style>@font-face{}</style><text>it&apos;s</text></svg>';
const NORMALISED = "<svg><text>it's</text></svg>";

type FetchMock = jest.Mock<Promise<{ ok: boolean; status: number; text: () => Promise<string> }>>;

const respondWith = (body: string, ok = true): FetchMock =>
  jest.fn(() => Promise.resolve({ ok, status: ok ? 200 : 500, text: () => Promise.resolve(body) }));

describe('useRemoteSvg', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    clearRemoteSvgCache();
    fetchMock = respondWith(RAW);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('downloads once, normalises the text, and serves the next consumer from cache', async () => {
    const first = renderHook(() => useRemoteSvg(MAP_URL));
    expect(first.result.current.status).toBe('loading');

    await waitFor(() => expect(first.result.current.status).toBe('loaded'));
    expect(first.result.current.xml).toBe(NORMALISED);

    // The viewer mounting after the preview: no second request, loaded at once.
    const second = renderHook(() => useRemoteSvg(MAP_URL));
    expect(second.result.current).toMatchObject({ status: 'loaded', xml: NORMALISED });
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
    expect(result.current.xml).toBe(NORMALISED);
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
