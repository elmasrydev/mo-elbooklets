import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMindMapLoad } from '../../hooks/useMindMapLoad';
import { clearRemoteSvgCache } from '../../hooks/useRemoteSvg';

const MAP_URL = 'https://cdn.example.com/storage/328/lesson-328-mindmap.svg';
const SVG = 'image/svg+xml';

const respondWith = (body: string, ok = true) =>
  jest.fn(() => Promise.resolve({ ok, status: ok ? 200 : 500, text: () => Promise.resolve(body) }));

describe('useMindMapLoad', () => {
  beforeEach(() => {
    clearRemoteSvgCache();
  });

  it('counts an SVG map as loaded only once the download and the render have both succeeded', async () => {
    global.fetch = respondWith('<svg></svg>') as unknown as typeof fetch;
    const { result } = renderHook(() => useMindMapLoad(MAP_URL, SVG, 'preview'));
    await waitFor(() => expect(result.current.html).toContain('<svg></svg>'));
    expect(result.current.status).toBe('loading');

    act(() => result.current.onLoad());
    expect(result.current.status).toBe('loaded');
  });

  it('remounts the view after a failed render, without downloading the map again', async () => {
    const fetchSpy = respondWith('<svg></svg>');
    global.fetch = fetchSpy as unknown as typeof fetch;
    const { result } = renderHook(() => useMindMapLoad(MAP_URL, SVG, 'preview'));
    await waitFor(() => expect(result.current.html).not.toBeNull());
    act(() => result.current.onError());
    expect(result.current.status).toBe('error');

    act(() => result.current.retry());
    expect(result.current).toMatchObject({ status: 'loading', attempt: 1 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('downloads the map again after a failed download', async () => {
    global.fetch = respondWith('', false) as unknown as typeof fetch;
    const { result } = renderHook(() => useMindMapLoad(MAP_URL, SVG, 'preview'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    global.fetch = respondWith('<svg></svg>') as unknown as typeof fetch;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.html).not.toBeNull());
    expect(result.current.attempt).toBe(0);
  });

  // Regression (code review, 2026-09-15): the image renderer's verdict on an SVG carried over
  // once the full lesson revealed the MIME type — a needless retry card, or an early "loaded".
  it('starts over when a lesson cached without its MIME type turns out to be an SVG', async () => {
    global.fetch = respondWith('<svg></svg>') as unknown as typeof fetch;
    const { result, rerender } = renderHook(
      ({ mimeType }: { mimeType: string | null }) => useMindMapLoad(MAP_URL, mimeType, 'preview'),
      { initialProps: { mimeType: null as string | null } },
    );
    expect(result.current.kind).toBe('raster');
    // expo-image cannot decode an SVG.
    act(() => result.current.onError());
    expect(result.current.status).toBe('error');

    rerender({ mimeType: SVG });
    expect(result.current).toMatchObject({ kind: 'svg', status: 'loading' });
    await waitFor(() => expect(result.current.html).not.toBeNull());
    // Downloaded, but the WebView has not drawn it yet.
    expect(result.current.status).toBe('loading');
  });

  // Regression (code review, 2026-09-15): a late callback from the replaced image view
  // overwrote the WebView's result, leaving the skeleton up for good.
  it('ignores a late callback from the view it replaced', async () => {
    global.fetch = respondWith('<svg></svg>') as unknown as typeof fetch;
    const { result, rerender } = renderHook(
      ({ mimeType }: { mimeType: string | null }) => useMindMapLoad(MAP_URL, mimeType, 'preview'),
      { initialProps: { mimeType: null as string | null } },
    );
    const rasterOnError = result.current.onError;

    rerender({ mimeType: SVG });
    await waitFor(() => expect(result.current.html).not.toBeNull());
    act(() => result.current.onLoad());
    act(() => rasterOnError());
    expect(result.current.status).toBe('loaded');
  });

  // Regression (code review, 2026-09-16): a lesson re-fed without its MIME type returned to an
  // earlier key, and the hook served that view's old failure straight back.
  it('does not serve an earlier verdict when the map kind returns to a previous one', () => {
    const { result, rerender } = renderHook(
      ({ mimeType }: { mimeType: string | null }) => useMindMapLoad(MAP_URL, mimeType, 'preview'),
      { initialProps: { mimeType: null as string | null } },
    );
    act(() => result.current.onError());
    expect(result.current.status).toBe('error');

    rerender({ mimeType: SVG });
    rerender({ mimeType: null });
    expect(result.current).toMatchObject({ kind: 'raster', status: 'loading' });
  });

  // Regression (code review, 2026-09-16): a late callback from the attempt a retry replaced
  // brought the retry card straight back while the new attempt was loading.
  it('ignores a late callback from the attempt a retry replaced', () => {
    const { result } = renderHook(() => useMindMapLoad(MAP_URL, null, 'preview'));
    act(() => result.current.onError());
    const failedAttemptOnError = result.current.onError;

    act(() => result.current.retry());
    act(() => failedAttemptOnError());
    expect(result.current).toMatchObject({ status: 'loading', attempt: 1 });
  });
});
