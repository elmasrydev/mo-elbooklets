import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { Kind, OperationTypeNode } from 'graphql';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ApiUriManager, REQUEST_TIMEOUT_MS } from '../config/api';
import { isUnauthenticatedError, revokeSession } from './session';

/**
 * Cap each request at the shared transport timeout — RN's fetch otherwise
 * waits on the platform default (up to ~60s on iOS). Apollo passes its own
 * abort signal for query cancellation, so the two signals are chained: either
 * one aborts the request.
 */
const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);
  const upstreamSignal = init.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) abort.abort();
    else upstreamSignal.addEventListener('abort', () => abort.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: abort.signal }).finally(() => clearTimeout(timer));
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
  // exhausted; auth + http sit innermost so every attempt carries fresh headers.
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache: new InMemoryCache(),
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
