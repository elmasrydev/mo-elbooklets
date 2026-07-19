import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { PRIMARY_API_URL, ApiUriManager } from '../config/api';

// Logout handler to be set by AuthContext. Receives the credential being revoked
// so the handler can still make authenticated cleanup calls (e.g. retiring the
// push token) before it is gone.
let logoutHandler: ((authToken?: string) => void) | null = null;
export const setLogoutHandler = (handler: (authToken?: string) => void) => {
  logoutHandler = handler;
};

// Create a dynamic link that selects the active URL from the manager
const httpLink = createHttpLink({
  // uri can be a function that returns the URI string
  uri: (operation) => {
    // If a custom URL is set, use it, otherwise use PRIMARY_API_URL
    return ApiUriManager.getActiveUrl();
  },
});

const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from AsyncStorage
  const token = await SecureStore.getItemAsync('auth_token');
  const lang = (await AsyncStorage.getItem('user_language')) || 'en';

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
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
 * Clear the stored session and hand the credential being revoked to the logout
 * handler, which needs it to authenticate its cleanup calls before it is gone.
 * Deliberately not awaited by the error link — `onError` must stay synchronous so
 * Apollo does not mistake a returned promise for a retry observable.
 */
const revokeSession = async () => {
  const authToken = (await SecureStore.getItemAsync('auth_token')) || undefined;
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_data');
  logoutHandler?.(authToken);
};

// Error link to handle authentication failures
const errorLink = onError((errorResponse: any) => {
  const graphQLErrors = errorResponse.graphQLErrors;
  const networkError = errorResponse.networkError;

  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for unauthenticated error
      if (
        err.message === 'Unauthenticated.' ||
        err.message?.toLowerCase().includes('unauthenticated') ||
        (err.extensions && err.extensions.code === 'UNAUTHENTICATED')
      ) {
        if (__DEV__) console.log('Auth error detected, logging out...');
        revokeSession();
        break;
      }
    }
  }
  // Also handle 401 network errors
  if (networkError && 'statusCode' in networkError && (networkError as any).statusCode === 401) {
    if (__DEV__) console.log('401 error detected, logging out...');
    revokeSession();
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default client;
export { client as apolloClient };
