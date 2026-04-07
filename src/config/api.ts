/**
 * Centralized API Configuration
 *
 * The default API URL is determined by the `debugMode` flag in app.json:
 *   debugMode: true  → https://demo.elbooklets.com/graphql
 *   debugMode: false → https://elbooklets.com/graphql
 *
 * This flag is read at build time via expo-constants and controls the entire
 * app behaviour (API URL, Firebase Remote Config keys, API URL Switcher).
 */

import Constants from 'expo-constants';

const PRODUCTION_URL = 'https://elbooklets.com/graphql';
const DEMO_URL = 'https://demo.elbooklets.com/graphql';

// Default URL based on app.json > extra.debugMode (set before building)
export const PRIMARY_API_URL =
  Constants.expoConfig?.extra?.debugMode === true ? DEMO_URL : PRODUCTION_URL;

// Fallback list starts with the primary URL
export const POSSIBLE_URLS = [PRIMARY_API_URL];

// Environment info for debugging
export const ENVIRONMENT_INFO = {
  isDebugMode: Constants.expoConfig?.extra?.debugMode === true,
  apiUrl: PRIMARY_API_URL,
  fallbackCount: POSSIBLE_URLS.length,
};

// GraphQL endpoint path
export const GRAPHQL_ENDPOINT = '/graphql';

declare var __DEV__: boolean;
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Logout handler to be set by AuthContext
let authErrorHandler: (() => void) | null = null;
export const setAuthErrorHandler = (handler: () => void) => {
  authErrorHandler = handler;
};

/**
 * Check if response contains authentication error
 */
const checkForAuthError = (data: any): boolean => {
  if (data?.errors) {
    for (const err of data.errors) {
      if (
        err.message === 'Unauthenticated.' ||
        err.message?.toLowerCase().includes('unauthenticated')
      ) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Handle authentication error - clear storage and trigger logout
 */
const handleAuthError = async () => {
  if (__DEV__) console.log('Auth error detected in API - logging out...');
  await SecureStore.deleteItemAsync('auth_token');
  await AsyncStorage.removeItem('user_data');
  if (authErrorHandler) {
    authErrorHandler();
  }
};

import { isDebugMode } from './debug';

// AsyncStorage key for API URL override
export const CUSTOM_API_URL_KEY = 'custom_api_url_override';

// Known valid API endpoints
const KNOWN_API_URLS = [
  'https://elbooklets.com/graphql',
  'https://demo.elbooklets.com/graphql',
] as const;

/**
 * Manages the active API URL with a cache for synchronous access.
 * This is essential for components like Apollo Client that need a sync value at initialization.
 */
class ApiUriManager {
  private static activeUrl: string = PRIMARY_API_URL;
  private static isInitialized: boolean = false;

  /**
   * Initializes the manager by reading the custom URL from storage.
   * Call this in App.tsx before rendering.
   */
  static async init(): Promise<string> {
    if (this.isInitialized) return this.activeUrl;

    try {
      const savedUrl = await AsyncStorage.getItem(CUSTOM_API_URL_KEY);
      if (
        isDebugMode() &&
        savedUrl &&
        KNOWN_API_URLS.includes(savedUrl as (typeof KNOWN_API_URLS)[number])
      ) {
        this.activeUrl = savedUrl;
      } else {
        this.activeUrl = PRIMARY_API_URL;
      }
    } catch (e) {
      if (__DEV__) console.log('Error initializing ApiUriManager:', e);
      this.activeUrl = PRIMARY_API_URL;
    }

    this.isInitialized = true;
    if (__DEV__) console.log('[ApiUriManager] Active URL:', this.activeUrl);
    return this.activeUrl;
  }

  /**
   * Synchronously gets the active URL.
   */
  static getActiveUrl(): string {
    return this.activeUrl;
  }

  /**
   * Updates the active API URL. Only accepts known production/demo URLs.
   * If the URL matches PRIMARY_API_URL, clears the override from storage.
   */
  static async updateUrl(url: string): Promise<void> {
    // Safety: only accept known URLs
    if (!KNOWN_API_URLS.includes(url as (typeof KNOWN_API_URLS)[number])) {
      if (__DEV__) console.warn('[ApiUriManager] Rejected unknown URL:', url);
      return;
    }

    if (url === PRIMARY_API_URL) {
      // No override needed — clear storage so default kicks in
      await AsyncStorage.removeItem(CUSTOM_API_URL_KEY);
    } else {
      await AsyncStorage.setItem(CUSTOM_API_URL_KEY, url);
    }

    this.activeUrl = url;
    if (__DEV__) console.log('[ApiUriManager] URL updated to:', url);
  }
}

export { ApiUriManager };

/**
 * Utility function to try fetching with fallback URLs
 * This provides network resilience by trying multiple URLs in sequence
 */
export const tryFetchWithFallback = async (
  query: string,
  variables?: any,
  token?: string,
): Promise<any> => {
  let lastError: Error | null = null;

  // Try to get token from AsyncStorage if not provided
  let authToken = token;
  if (!authToken) {
    authToken = (await SecureStore.getItemAsync('auth_token')) || undefined;
  }

  // Determine the sequence of URLs to try. Start with the active one from manager.
  const activeUrl = ApiUriManager.getActiveUrl();
  const urlsToTry = [activeUrl, ...POSSIBLE_URLS.filter((u) => u !== activeUrl)];

  for (const url of urlsToTry) {
    try {
      if (__DEV__) console.log(`Trying to connect to: ${url}`);

      const lang = (await AsyncStorage.getItem('user_language')) || 'en';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Language': lang,
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      if (__DEV__) console.log('API HEADERS: ', headers);
      if (__DEV__) console.log('API query: ', query, variables);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (response.ok) {
        if (__DEV__) console.log(`Successfully connected to: ${url}`);
        const data = await response.json();

        // Check for authentication errors in GraphQL response
        if (checkForAuthError(data)) {
          await handleAuthError();
        }

        return data;
      } else {
        // Handle 401 HTTP status
        if (response.status === 401) {
          await handleAuthError();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      if (__DEV__) console.log(`Failed to connect to ${url}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All connection attempts failed');
};

/**
 * Configuration for different environments
 */
export const API_CONFIG = {
  // Timeout for API requests (in milliseconds)
  timeout: 10000,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // GraphQL specific settings
  graphql: {
    endpoint: GRAPHQL_ENDPOINT,
    introspection: __DEV__, // Enable introspection in development
    playground: __DEV__, // Enable playground in development
  },
};

/**
 * Network status and debugging utilities
 */
export const NetworkUtils = {
  /**
   * Test connectivity to all possible URLs
   */
  async testConnectivity(): Promise<
    { url: string; status: 'success' | 'failed'; error?: string }[]
  > {
    const results: { url: string; status: 'success' | 'failed'; error?: string }[] = [];

    for (const url of POSSIBLE_URLS) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            query: '{ __typename }',
          }),
        });

        results.push({
          url,
          status: (response.ok ? 'success' : 'failed') as 'success' | 'failed',
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } catch (error: any) {
        results.push({
          url,
          status: 'failed' as const,
          error: error.message,
        });
      }
    }

    return results;
  },

  /**
   * Get the first working URL
   */
  async getWorkingUrl(): Promise<string | null> {
    for (const url of POSSIBLE_URLS) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            query: '{ __typename }',
          }),
        });

        if (response.ok) {
          return url;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  },
};
