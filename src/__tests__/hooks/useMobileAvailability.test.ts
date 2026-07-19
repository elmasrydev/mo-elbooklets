import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  useMobileAvailability,
  AVAILABILITY_CHECK_TIMEOUT_MS,
} from '../../hooks/useMobileAvailability';
import { tryFetchWithFallback } from '../../config/api';

jest.mock('../../config/api', () => ({ tryFetchWithFallback: jest.fn() }));

const mockFetch = tryFetchWithFallback as jest.Mock;

const respond = (available: boolean, message = 'msg') => ({
  data: { checkMobileAvailability: { available, message } },
});

// BKLT-308: the early "already registered?" check. It gates registration, so
// the verdict must be correct and it must never block on a failed request.
describe('useMobileAvailability', () => {
  beforeEach(() => mockFetch.mockReset());

  it('reports a taken number with the backend message', async () => {
    mockFetch.mockResolvedValue(respond(false, 'This mobile number is already registered.'));
    const { result } = renderHook(() => useMobileAvailability('student'));

    await act(async () => {
      expect((await result.current.ensureChecked('01011223344')).status).toBe('taken');
    });
    await waitFor(() => expect(result.current.status).toBe('taken'));
    expect(result.current.message).toBe('This mobile number is already registered.');
  });

  it('skips the request until the number is a valid Egyptian mobile', async () => {
    const { result } = renderHook(() => useMobileAvailability('student'));

    await act(async () => {
      expect((await result.current.ensureChecked('0101122')).status).toBe('idle');
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not block registration when the check fails', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useMobileAvailability('student'));

    await act(async () => {
      expect((await result.current.ensureChecked('01011223344')).status).toBe('idle');
    });
    await waitFor(() => expect(result.current.status).toBe('idle'));
  });

  it('un-caches a failed check so the next attempt re-requests', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(respond(false, 'taken after retry'));
    const { result } = renderHook(() => useMobileAvailability('student'));

    await act(async () => {
      expect((await result.current.ensureChecked('01011223344')).status).toBe('idle');
    });
    // Same number again (e.g. next blur or submit): the failure must not have
    // been cached as a verdict — the check runs again and can now conclude.
    await act(async () => {
      expect((await result.current.ensureChecked('01011223344')).status).toBe('taken');
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('fails open when the check exceeds its timeout', async () => {
    jest.useFakeTimers();
    try {
      // A request that never settles — only the timeout can end it.
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useMobileAvailability('student'));

      let verdict;
      await act(async () => {
        const pending = result.current.ensureChecked('01011223344');
        jest.advanceTimersByTime(AVAILABILITY_CHECK_TIMEOUT_MS + 1);
        verdict = await pending;
      });

      // Inconclusive, not 'taken': the user must be let through to the
      // server-side uniqueness check instead of being stuck on a spinner.
      expect(verdict).toEqual({ status: 'idle', message: '' });
      expect(result.current.status).toBe('idle');
    } finally {
      jest.useRealTimers();
    }
  });

  it('reuses the verdict instead of re-requesting the same number', async () => {
    mockFetch.mockResolvedValue(respond(true));
    const { result } = renderHook(() => useMobileAvailability('student'));

    await act(async () => {
      await result.current.ensureChecked('01011223344');
      await result.current.ensureChecked('01011223344');
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale response after the number changed', async () => {
    mockFetch.mockResolvedValueOnce(respond(false, 'taken'));
    const { result } = renderHook(() => useMobileAvailability('student'));

    let verdict;
    await act(async () => {
      const stale = result.current.ensureChecked('01011223344');
      result.current.reset(); // user edits the field mid-flight
      verdict = await stale;
    });

    // The abandoned "taken" verdict must neither surface in the UI nor gate the
    // form — it describes a number the user is no longer registering with.
    expect(verdict).toEqual({ status: 'idle', message: '' });
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.message).toBe('');
  });

  it('lets a superseded check win nothing when a newer number is in flight', async () => {
    // A resolves last but was superseded by B — its verdict must be discarded.
    // Deferred resolve (not a timer) keeps the interleaving deterministic.
    let resolveA!: (value: unknown) => void;
    mockFetch
      .mockImplementationOnce(() => new Promise((r) => (resolveA = r)))
      .mockResolvedValueOnce(respond(true, 'B free'));
    const { result } = renderHook(() => useMobileAvailability('student'));

    let verdictA;
    await act(async () => {
      const a = result.current.ensureChecked('01011223344');
      const b = result.current.ensureChecked('01099887766');
      await b;
      resolveA(respond(false, 'A taken'));
      verdictA = await a;
    });

    expect(verdictA).toEqual({ status: 'idle', message: '' });
    await waitFor(() => expect(result.current.status).toBe('available'));
    expect(result.current.message).toBe('B free');
  });

  it('sends the parent type for the parent form', async () => {
    mockFetch.mockResolvedValue(respond(true));
    const { result } = renderHook(() => useMobileAvailability('parent'));

    await act(async () => {
      await result.current.ensureChecked('01011223344');
    });
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
      mobile: '01011223344',
      type: 'parent',
    });
  });
});
