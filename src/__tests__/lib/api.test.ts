import { parse } from 'graphql';

import { tryFetchWithFallback, REQUEST_TIMEOUT_MS } from '../../config/api';

// The transport timeout added in GraphQL phase 0: without it a stalled
// connection pins every awaiting screen on RN's platform default (~60s iOS).
describe('tryFetchWithFallback', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.useRealTimers();
  });

  it('aborts a stalled request once REQUEST_TIMEOUT_MS elapses', async () => {
    jest.useFakeTimers();
    // A request that never settles on its own — only our abort signal ends it.
    global.fetch = jest.fn(
      (_url: any, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    ) as any;

    const pending = tryFetchWithFallback('query Ping { __typename }');
    const outcome = expect(pending).rejects.toThrow('Aborted');
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1);
    await outcome;
  });

  it('accepts a typed DocumentNode and sends it as query text', async () => {
    const sentBodies: any[] = [];
    global.fetch = jest.fn((_url: any, init: any) => {
      sentBodies.push(JSON.parse(init.body));
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    }) as any;

    // Generated XxxDocuments arrive as DocumentNodes (GraphQL phase 1) — the
    // transport must serialize them, not stringify the AST object.
    await tryFetchWithFallback(parse('query Ping { __typename }'), { a: 1 });

    expect(sentBodies[0].query).toContain('__typename');
    expect(typeof sentBodies[0].query).toBe('string');
    expect(sentBodies[0].variables).toEqual({ a: 1 });
  });

  it('returns the parsed payload and clears its timer on success', async () => {
    jest.useFakeTimers();
    const payload = { data: { __typename: 'Query' } };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(payload) }),
    ) as any;

    await expect(tryFetchWithFallback('query Ping { __typename }')).resolves.toEqual(payload);
    // No timers may remain armed — a leaked abort timer would fire into a
    // finished request and mask real timeout regressions in later calls.
    expect(jest.getTimerCount()).toBe(0);
  });
});
