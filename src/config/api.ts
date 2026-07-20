/**
 * Which backend the app talks to.
 *
 * The default is chosen by the `debugMode` flag in app.json:
 *   debugMode: true  → https://prs.elbooklets.com/graphql
 *   debugMode: false → https://elbooklets.com/graphql
 *
 * The flag is read at build time via expo-constants and controls the entire
 * app behaviour (API URL, Firebase Remote Config keys, API URL Switcher).
 * Requests themselves go through Apollo (src/lib/apollo.ts), which reads the
 * active URL from ApiUriManager on every operation.
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { isDebugMode } from './debug';

const PRODUCTION_URL = 'https://elbooklets.com/graphql';
const DEMO_URL = 'https://demo.elbooklets.com/graphql';
export const PRS_URL = 'https://prs.elbooklets.com/graphql';

// Default URL based on app.json > extra.debugMode (set before building)
export const PRIMARY_API_URL =
  Constants.expoConfig?.extra?.debugMode === true ? PRS_URL : PRODUCTION_URL;

/**
 * Cap on every request Apollo makes. RN's fetch otherwise waits on the
 * platform default — up to ~60s on iOS — stranding every awaiting screen on a
 * dead connection.
 */
export const REQUEST_TIMEOUT_MS = 10000;

declare let __DEV__: boolean;

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
