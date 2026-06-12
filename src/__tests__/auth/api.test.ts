import {
  ApiUriManager,
  tryFetchWithFallback,
  PRIMARY_API_URL,
  CUSTOM_API_URL_KEY,
} from '../../config/api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
jest.mock('../../config/debug', () => ({
  isDebugMode: () => true,
}));

describe('API Config & Fallback Logic', () => {
  let originalFetch: typeof fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    await AsyncStorage.clear();
    // Clear SecureStore mocks inside jest.setup.ts
    const store = SecureStore as any;
    if (store.getItemAsync.mockClear) store.getItemAsync.mockClear();
    if (store.setItemAsync.mockClear) store.setItemAsync.mockClear();
    // Reset ApiUriManager state to prevent test contamination
    (ApiUriManager as any).isInitialized = false;
    (ApiUriManager as any).activeUrl = PRIMARY_API_URL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('ApiUriManager', () => {
    it('should initialize with the primary URL when no override exists', async () => {
      const url = await ApiUriManager.init();
      expect(url).toBe(PRIMARY_API_URL);
      expect(ApiUriManager.getActiveUrl()).toBe(PRIMARY_API_URL);
    });

    it('should load custom URL override from SecureStore if it matches known valid URLs', async () => {
      const demoUrl = 'https://demo.elbooklets.com/graphql';
      // Mock SecureStore to return a saved custom URL
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(demoUrl);

      // Force re-initialization by deleting cached state if required
      // Since ApiUriManager is static, we can update activeUrl or call init
      await ApiUriManager.updateUrl(PRIMARY_API_URL); // Reset override
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(demoUrl);

      // We manually override initial status to force loading
      (ApiUriManager as any).isInitialized = false;
      const url = await ApiUriManager.init();

      expect(url).toBe(demoUrl);
      expect(ApiUriManager.getActiveUrl()).toBe(demoUrl);
    });

    it('should reject unknown/invalid URL overrides', async () => {
      const invalidUrl = 'https://malicious.com/graphql';
      await ApiUriManager.updateUrl(invalidUrl);

      // Should remain primary
      expect(ApiUriManager.getActiveUrl()).toBe(PRIMARY_API_URL);
    });

    it('should delete storage override when updating to primary URL', async () => {
      await ApiUriManager.updateUrl(PRIMARY_API_URL);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(CUSTOM_API_URL_KEY);
    });
  });

  describe('tryFetchWithFallback', () => {
    it('should succeed and return data when fetch returns OK response', async () => {
      const mockSuccessData = { data: { me: { id: '1', name: 'Student' } } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuccessData),
      });

      const result = await tryFetchWithFallback('{ me { id name } }');
      expect(result).toEqual(mockSuccessData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should pass Authorization headers if a token exists in SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('mock-token');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      await tryFetchWithFallback('{ me { id } }');

      const lastCallArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = lastCallArgs[1].headers;
      expect(headers).toHaveProperty('Authorization', 'Bearer mock-token');
    });

    it('should handle unauthenticated GraphQL errors by clearing token and logging out', async () => {
      const mockUnauthGraphQLResponse = {
        errors: [{ message: 'Unauthenticated.' }],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUnauthGraphQLResponse),
      });

      const result = await tryFetchWithFallback('{ me { id } }');
      expect(result).toEqual(mockUnauthGraphQLResponse);

      // Verify it triggers token deletion
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should handle HTTP 401 unauthenticated errors by clearing token and logging out', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(tryFetchWithFallback('{ me { id } }')).rejects.toThrow('HTTP 401: Unauthorized');

      // Verify token is cleared
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should fallback to subsequent URLs if primary URL fails', async () => {
      // Setup: Let primary fail and fallback succeed
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network connection failed')) // primary
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { success: true } }),
        }); // fallback

      // Configure possible fallback URLs
      const primary = ApiUriManager.getActiveUrl();
      const fallback = 'https://demo.elbooklets.com/graphql';

      // Override POSSIBLE_URLS temporarily
      const originalPossibleUrls = require('../../config/api').POSSIBLE_URLS;
      originalPossibleUrls.push(fallback);

      const result = await tryFetchWithFallback('{ me { id } }');
      expect(result).toEqual({ data: { success: true } });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Reset
      originalPossibleUrls.pop();
    });
  });
});
