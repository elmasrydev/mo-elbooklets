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
});
