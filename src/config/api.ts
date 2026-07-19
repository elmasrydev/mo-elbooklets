/**
 * Centralized API Configuration
 *
 * The default API URL is determined by the `debugMode` flag in app.json:
 *   debugMode: true  → https://prs.elbooklets.com/graphql
 *   debugMode: false → https://elbooklets.com/graphql
 *
 * This flag is read at build time via expo-constants and controls the entire
 * app behaviour (API URL, Firebase Remote Config keys, API URL Switcher).
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { print } from 'graphql';
import type { DocumentNode } from 'graphql';

import { isDebugMode } from './debug';
import { isUnauthenticatedError, revokeSession } from '../lib/session';

const PRODUCTION_URL = 'https://elbooklets.com/graphql';
const DEMO_URL = 'https://demo.elbooklets.com/graphql';
export const PRS_URL = 'https://prs.elbooklets.com/graphql';

// Default URL based on app.json > extra.debugMode (set before building)
export const PRIMARY_API_URL =
  Constants.expoConfig?.extra?.debugMode === true ? PRS_URL : PRODUCTION_URL;

// Fallback list starts with the primary URL
export const POSSIBLE_URLS = [PRIMARY_API_URL];

/**
 * Cap on every request from this module (and, via import, Apollo's fetch).
 * RN's fetch otherwise waits on the platform default — up to ~60s on iOS —
 * stranding every awaiting screen on a dead connection.
 */
export const REQUEST_TIMEOUT_MS = 10000;

declare let __DEV__: boolean;

/**
 * Check if response contains authentication error
 * (exported so callers can tell "session ended" apart from other GraphQL errors)
 */
export const checkForAuthError = (data: any): boolean =>
  !!data?.errors?.some((err: any) => isUnauthenticatedError(err.message, err.extensions?.code));

// AsyncStorage key for API URL override
export const CUSTOM_API_URL_KEY = 'custom_api_url_override';

// Known valid API endpoints
const KNOWN_API_URLS = [
  'https://elbooklets.com/graphql',
  'https://demo.elbooklets.com/graphql',
  'https://prs.elbooklets.com/graphql',
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
      const savedUrl = await SecureStore.getItemAsync(CUSTOM_API_URL_KEY);
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
      await SecureStore.deleteItemAsync(CUSTOM_API_URL_KEY);
    } else {
      await SecureStore.setItemAsync(CUSTOM_API_URL_KEY, url);
    }

    this.activeUrl = url;
    if (__DEV__) console.log('[ApiUriManager] URL updated to:', url);
  }
}

export { ApiUriManager };

/**
 * Utility function to try fetching with fallback URLs
 * This provides network resilience by trying multiple URLs in sequence
 *
 * Accepts either a raw query string or a (Typed)DocumentNode from
 * src/generated/graphql.ts, so codegen-validated documents work on this
 * transport without a print() at every call site.
 */
export const tryFetchWithFallback = async (
  query: string | DocumentNode,
  variables?: any,
  token?: string,
): Promise<any> => {
  const queryText = typeof query === 'string' ? query : print(query);
  let lastError: Error | null = null;

  // Try to get token from AsyncStorage if not provided
  let authToken = token;
  if (!authToken) {
    authToken = (await SecureStore.getItemAsync('auth_token')) || undefined;
  }

  // Determine the sequence of URLs to try. Start with the active one from manager.
  const activeUrl = ApiUriManager.getActiveUrl();
  const urlsToTry = [activeUrl, ...POSSIBLE_URLS.filter((u) => u !== activeUrl)];

  const lang = (await AsyncStorage.getItem('user_language')) || 'en';

  for (const url of urlsToTry) {
    // Abort the attempt at the shared timeout instead of waiting on the
    // platform default; the next URL (if any) still gets its own attempt.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);
    try {
      if (__DEV__) console.log(`Trying to connect to: ${url}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Backend persists `lang` from authenticated requests to users.language,
        // which localizes push notifications (BKLT-273).
        lang,
        'Accept-Language': lang,
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      if (__DEV__) console.log('API HEADERS: ', headers);
      if (__DEV__) console.log('API query: ', queryText, variables);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: queryText,
          variables,
        }),
        signal: abort.signal,
      });

      if (response.ok) {
        if (__DEV__) console.log(`Successfully connected to: ${url}`);
        const data = await response.json();

        // Check for authentication errors in GraphQL response
        if (checkForAuthError(data)) {
          if (__DEV__) console.log('Auth error detected in API - logging out...');
          await revokeSession();
        }

        return data;
      } else {
        // Handle 401 HTTP status
        if (response.status === 401) {
          if (__DEV__) console.log('Auth error detected in API - logging out...');
          await revokeSession();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      if (__DEV__) console.log(`Failed to connect to ${url}:`, error.message);
      lastError = error;
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('All connection attempts failed');
};
