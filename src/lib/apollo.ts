import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIMARY_API_URL } from '../config/api';

// Logout handler to be set by AuthContext
let logoutHandler: (() => void) | null = null;
export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

const httpLink = createHttpLink({
  uri: PRIMARY_API_URL,
});

const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from AsyncStorage
  const token = await AsyncStorage.getItem('auth_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  };
});

// Error link to handle authentication failures
const errorLink = onError((errorResponse: any) => {
  const graphQLErrors = errorResponse.graphQLErrors;
  const networkError = errorResponse.networkError;
  
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for unauthenticated error
      if (err.message === 'Unauthenticated.' || 
          err.message.toLowerCase().includes('unauthenticated') ||
          (err.extensions && err.extensions.code === 'UNAUTHENTICATED')) {
        console.log('Auth error detected, logging out...');
        // Clear stored auth data
        AsyncStorage.removeItem('auth_token');
        AsyncStorage.removeItem('user_data');
        // Trigger logout in AuthContext
        if (logoutHandler) {
          logoutHandler();
        }
        break;
      }
    }
  }
  // Also handle 401 network errors
  if (networkError && 'statusCode' in networkError && (networkError as any).statusCode === 401) {
    console.log('401 error detected, logging out...');
    AsyncStorage.removeItem('auth_token');
    AsyncStorage.removeItem('user_data');
    if (logoutHandler) {
      logoutHandler();
    }
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
