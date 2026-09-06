import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { Kind, OperationTypeNode, print } from 'graphql';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ApiUriManager, REQUEST_TIMEOUT_MS } from '../config/api';
import { isUnauthenticatedError, revokeSession } from './session';

/**
 * A per-operation timeout override, threaded through Apollo's
 * `context: { fetchOptions: { timeoutMs } }`. HttpLink merges fetchOptions into
 * the init passed to our custom fetch, so an operation can opt into a longer cap
 * than the default (e.g. `submitQuizAnswers` with synchronous AI grading).
 */
type TimeoutInit = RequestInit & { timeoutMs?: number };

/**
 * Cap each request at the shared transport timeout — RN's fetch otherwise
 * waits on the platform default (up to ~60s on iOS). Apollo passes its own
 * abort signal for query cancellation, so the two signals are chained: either
 * one aborts the request. An operation may raise the cap via `timeoutMs`.
 */
const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...rest } = init as TimeoutInit;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  const upstreamSignal = rest.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) abort.abort();
    else upstreamSignal.addEventListener('abort', () => abort.abort(), { once: true });
  }
  return fetch(input, { ...rest, signal: abort.signal }).finally(() => clearTimeout(timer));
};

// The uri is resolved per request so the debug API switcher takes effect
// without rebuilding the client.
const httpLink = createHttpLink({
  uri: () => ApiUriManager.getActiveUrl(),
  fetch: fetchWithTimeout,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await SecureStore.getItemAsync('auth_token');
  const lang = (await AsyncStorage.getItem('user_language')) || 'en';

  return {
    headers: {
      ...headers,
      // An operation may carry its own credential: logout retires the push
      // token using the token it has just revoked, so the stored one is
      // already gone by then (BKLT-316). Never clobber an explicit header.
      authorization: headers?.authorization ?? (token ? `Bearer ${token}` : ''),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Backend persists `lang` from authenticated requests to users.language,
      // which localizes push notifications (BKLT-273).
      lang,
      'Accept-Language': lang,
    },
  };
});

/**
 * Dev-only request log: the resolved url, the exact headers going out (token
 * included, so a request can be replayed verbatim in a playground or curl),
 * the operation document and its variables. Responses are deliberately not
 * logged — they bury the requests you are actually looking for.
 *
 * Gated on __DEV__ rather than the debugMode flag, so a release binary can
 * never print credentials or request bodies even when built with debug
 * features on. Sits after authLink so the headers it reports are the ones
 * actually sent, and inside retryLink so a retried attempt logs again.
 */
const loggerLink = new ApolloLink((operation, forward) => {
  if (__DEV__) {
    const { headers } = operation.getContext() as { headers?: Record<string, string> };
    const kind = operation.query.definitions.some(
      (def) =>
        def.kind === Kind.OPERATION_DEFINITION && def.operation === OperationTypeNode.MUTATION,
    )
      ? 'mutation'
      : 'query';

    console.log(`⇢ GraphQL ${kind} ${operation.operationName} → ${ApiUriManager.getActiveUrl()}`);
    console.log('  headers:', headers);
    console.log('  variables:', operation.variables);
    console.log('  document:', print(operation.query));
  }

  return forward(operation);
});

/**
 * Auth failures funnel into the shared revokeSession (src/lib/session.ts), so
 * an expired session tears down the same way wherever it is noticed.
 *
 * Apollo Client 4 hands the link a single `error` value (CombinedGraphQLErrors
 * for GraphQL errors, ServerError for non-2xx HTTP) instead of v3's
 * `graphQLErrors`/`networkError` pair.
 */
const errorLink = onError(({ error }) => {
  const isAuthFailure = CombinedGraphQLErrors.is(error)
    ? error.errors.some((err) => isUnauthenticatedError(err.message, err.extensions?.code))
    : ServerError.is(error) && error.statusCode === 401;

  if (isAuthFailure) {
    if (__DEV__) console.log('Auth error detected, logging out...');
    // Deliberately not awaited — `onError` must stay synchronous so Apollo
    // does not mistake a returned promise for a retry observable.
    void revokeSession();
  }
});

const retryLink = new RetryLink({
  delay: { initial: 300, max: 2000, jitter: true },
  attempts: {
    // `max` includes the initial request — i.e. a single retry.
    max: 2,
    retryIf: (error, operation) => {
      // Retrying a mutation could double-submit (register twice, send two link
      // requests). And GraphQL errors are deterministic — retrying just repeats
      // the same failure. Only queries, only on transport-level errors.
      const isMutation = operation.query.definitions.some(
        (def) =>
          def.kind === Kind.OPERATION_DEFINITION && def.operation === OperationTypeNode.MUTATION,
      );
      return !isMutation && !CombinedGraphQLErrors.is(error);
    },
  },
});

const client = new ApolloClient({
  // Order matters: the error link sees the final outcome after retries are
  // exhausted; auth + http sit innermost so every attempt carries fresh
  // headers, and the logger sits between them to report what actually went out.
  link: from([errorLink, retryLink, authLink, loggerLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Match-column items carry ids that are unique only *within* one question
      // ("L0"/"R0"/… repeat across every match question). Normalizing by id would
      // let one question's columns overwrite another's, so keep them embedded.
      MatchColumnItem: { keyFields: false },
      // A leaderboard entry's id identifies the *student*, but rank/xp/avgScore/
      // totalQuizzes are relative to the board that produced them. Normalizing by
      // id makes every board share one object, so opening the Math board would
      // rewrite the global board's numbers for the same student (and Home's rank
      // rail, which paints from cache with no loading gate, repaints wrong).
      // Keep them embedded: LeaderboardResult has no id either, so each
      // `leaderboard(subjectId, filter, limit)` field keeps its own copy.
      // Trade-off: `isFollowing` no longer propagates by normalization —
      // useFollowToggle patches these fields explicitly.
      LeaderboardEntry: { keyFields: false },
    },
  }),
  defaultOptions: {
    watchQuery: {
      // Every mount asks the server, so the user never reads stale data — but
      // the cached copy paints immediately while that request is in flight,
      // instead of blanking the screen to a skeleton on every visit.
      // Screens that must not show a cached value at all (quiz attempts,
      // results, saved-point state) opt up to 'network-only' individually.
      // NOTE: render gates must be `loading && !data` — with this policy
      // `loading` is true *while* cached data is already on screen.
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      // client.query() rejects cache-and-network; imperative reads are one-off
      // and already fetch when the cache misses.
      errorPolicy: 'all',
    },
  },
});

export default client;
export { client as apolloClient };
