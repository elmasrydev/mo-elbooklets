import { ApiUriManager, PRIMARY_API_URL, CUSTOM_API_URL_KEY } from '../../config/api';
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
});
