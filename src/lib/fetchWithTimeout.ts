/** A per-request timeout override, passed in `fetch`'s init. */
export type TimeoutInit = RequestInit & { timeoutMs?: number };

/**
 * Builds a `fetch` that gives up after `defaultTimeoutMs`; a caller may pass its
 * own `timeoutMs` in the init. React Native's fetch never times out on its own
 * — it hands the platform a timeout of 0, which iOS and Android both read as
 * "none" — so a stalled connection would otherwise hang forever. The caller's
 * own abort signal is chained in: either one aborts the request.
 */
export const createFetchWithTimeout =
  (defaultTimeoutMs: number): typeof fetch =>
  (input, init = {}) => {
    const { timeoutMs = defaultTimeoutMs, ...rest } = init as TimeoutInit;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    const upstreamSignal = rest.signal;
    if (upstreamSignal) {
      if (upstreamSignal.aborted) abort.abort();
      else upstreamSignal.addEventListener('abort', () => abort.abort(), { once: true });
    }
    return fetch(input, { ...rest, signal: abort.signal }).finally(() => clearTimeout(timer));
  };
