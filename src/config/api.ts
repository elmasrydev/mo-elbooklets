/**
 * Centralized API Configuration
 *
 * This file contains all API-related configuration including fallback URLs
 * for different network scenarios. Update the environment configuration here
 * to apply changes across the entire application.
 */

// Environment configuration
const IS_PRODUCTION = !__DEV__; // Use production in release builds

// Production API configuration
const PRODUCTION_URLS = [
  'https://elbooklets.com/graphql',  // Production backend
];

// Development fallback URLs for different network scenarios
const DEVELOPMENT_URLS = [
  // 'http://192.168.1.188:8001/graphql',  // Current WiFi network
  // 'http://169.254.105.59:8001/graphql', // Link-local address
  'http://10.0.2.2:8000/graphql',       // Android emulator
  // 'http://localhost:8001/graphql',      // iOS simulator
];

// Select URLs based on environment
export const POSSIBLE_URLS = IS_PRODUCTION ? PRODUCTION_URLS : DEVELOPMENT_URLS;

// Primary API URL (first in the fallback list)
export const PRIMARY_API_URL = POSSIBLE_URLS[0];

// Environment info for debugging
export const ENVIRONMENT_INFO = {
  isProduction: IS_PRODUCTION,
  isDevelopment: __DEV__,
  apiUrl: PRIMARY_API_URL,
  fallbackCount: POSSIBLE_URLS.length,
};

// GraphQL endpoint path
export const GRAPHQL_ENDPOINT = '/graphql';

declare var __DEV__: boolean;
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      if (err.message === 'Unauthenticated.' || 
          err.message?.toLowerCase().includes('unauthenticated')) {
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
  console.log('Auth error detected in API - logging out...');
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user_data');
  if (authErrorHandler) {
    authErrorHandler();
  }
};

/**
 * Utility function to try fetching with fallback URLs
 * This provides network resilience by trying multiple URLs in sequence
 */
export const tryFetchWithFallback = async (
  query: string,
  variables?: any,
  token?: string
): Promise<any> => {
  let lastError: Error | null = null;

  // Try to get token from AsyncStorage if not provided
  let authToken = token;
  if (!authToken) {
    authToken = await AsyncStorage.getItem('auth_token') || undefined;
  }

  for (const url of POSSIBLE_URLS) {
    try {
      console.log(`Trying to connect to: ${url}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (response.ok) {
        console.log(`Successfully connected to: ${url}`);
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
      console.log(`Failed to connect to ${url}:`, error.message);
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
    playground: __DEV__,    // Enable playground in development
  }
};

/**
 * Network status and debugging utilities
 */
export const NetworkUtils = {
  /**
   * Test connectivity to all possible URLs
   */
  async testConnectivity(): Promise<{ url: string; status: 'success' | 'failed'; error?: string }[]> {
    const results: { url: string; status: 'success' | 'failed'; error?: string }[] = [];

    for (const url of POSSIBLE_URLS) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: '{ __typename }'
          })
        });

        results.push({
          url,
          status: (response.ok ? 'success' : 'failed') as 'success' | 'failed',
          error: response.ok ? undefined : `HTTP ${response.status}`
        });
      } catch (error: any) {
        results.push({
          url,
          status: 'failed' as const,
          error: error.message
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
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: '{ __typename }'
          })
        });

        if (response.ok) {
          return url;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }
};
