import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { apolloClient } from '../../lib/apollo';
import { unregisterDeviceToken } from '../../services/notificationService';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock API module
// AuthContext talks to the server through Apollo; clearStore runs on logout.
jest.mock('../../lib/apollo', () => ({
  apolloClient: { mutate: jest.fn(), query: jest.fn(), clearStore: jest.fn() },
}));

// Mock notification services to avoid side effects
jest.mock('../../services/notificationService', () => ({
  triggerNotificationPrompt: jest.fn(),
  clearNotificationPromptedFlag: jest.fn(),
  registerDeviceToken: jest.fn(() => Promise.resolve()),
  unregisterDeviceToken: jest.fn(() => Promise.resolve()),
}));

describe('AuthContext & AuthProvider', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    const store = SecureStore as any;
    if (store._clear) store._clear();
    if (store.getItemAsync.mockClear) store.getItemAsync.mockClear();
    if (store.setItemAsync.mockClear) store.setItemAsync.mockClear();
    if (store.deleteItemAsync.mockClear) store.deleteItemAsync.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with default states and check existing token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null); // auth_token
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null); // user_role

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Allow checkAuthStatus async flow to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.parentUser).toBeNull();
    expect(result.current.userRole).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should restore authenticated student user from storage on mount', async () => {
    const studentUser = { id: '1', name: 'Ali', mobile: '01007867184' };

    // Mock SecureStore to simulate logged-in student
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('mock-token') // auth_token
      .mockResolvedValueOnce('student') // user_role
      .mockResolvedValueOnce(JSON.stringify(studentUser)); // user_data

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(studentUser);
    expect(result.current.userRole).toBe('student');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should restore authenticated parent user from storage on mount', async () => {
    const parentUser = { id: '2', name: 'Nasser', mobile: '01007867181' };

    // Mock SecureStore to simulate logged-in parent
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('mock-token') // auth_token
      .mockResolvedValueOnce('parent') // user_role
      .mockResolvedValueOnce(JSON.stringify(parentUser)); // user_data

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.parentUser).toEqual(parentUser);
    expect(result.current.userRole).toBe('parent');
    expect(result.current.isAuthenticated).toBe(true);
  });

  describe('Student Login & Registration', () => {
    it('should successfully log in a student user', async () => {
      const mockLoginResponse = {
        data: {
          login: {
            access_token: 'student-token',
            user: { id: '1', name: 'Ali', mobile: '01007867184', mobile_verified_at: '2026-06-10' },
          },
        },
      };
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({
          mobile: '01007867184',
          password: 'Password1!',
        });
      });

      expect(loginResult).toEqual({ success: true, user: mockLoginResponse.data.login.user });
      expect(result.current.user).toEqual(mockLoginResponse.data.login.user);
      expect(result.current.userRole).toBe('student');
      expect(result.current.isAuthenticated).toBe(true);

      // Verify stored credentials
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'student-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_role', 'student');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockLoginResponse.data.login.user),
      );
    });

    // The error must be a translation KEY, not the server's English text — the
    // screens render it with t(), so a raw message reaches Arabic users as-is.
    it('should fail login and return a translation key', async () => {
      (apolloClient.mutate as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid mobile or password'),
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({
          mobile: '01007867184',
          password: 'wrong-password',
        });
      });

      expect(loginResult).toEqual({ success: false, error: 'auth.invalid_credentials' });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('reports a transport failure separately from bad credentials', async () => {
      (apolloClient.mutate as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({ mobile: '01007867184', password: 'pw' });
      });

      expect(loginResult).toEqual({ success: false, error: 'common.unexpected_error' });
    });

    it('should register a new student user and trigger OTP state if unverified', async () => {
      const mockRegisterResponse = {
        data: {
          register: {
            access_token: 'student-token',
            user: { id: '1', name: 'Ali', mobile: '01007867184', mobile_verified_at: null },
          },
        },
      };
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce(mockRegisterResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register({
          name: 'Ali',
          mobile: '01007867184',
          password: 'Password1!',
          grade_id: '1',
        });
      });

      expect(registerResult).toEqual({
        success: true,
        user: mockRegisterResponse.data.register.user,
      });
      expect(result.current.user).toEqual(mockRegisterResponse.data.register.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.otpWasAutoSent).toBe(true);
    });

    it('should treat the code as already sent when an unverified student logs in', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: {
          login: {
            access_token: 'student-token',
            user: { id: '1', name: 'Ali', mobile: '01007867184', mobile_verified_at: null },
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ mobile: '01007867184', password: 'Password1!' });
      });

      // `login` auto-sends; requesting a second code would burn the hourly budget.
      expect(result.current.otpWasAutoSent).toBe(true);
      expect(result.current.otpShouldAutoRequest).toBe(false);
    });

    it('should not flag an OTP send when the student is already verified', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: {
          login: {
            access_token: 'student-token',
            user: {
              id: '1',
              name: 'Ali',
              mobile: '01007867184',
              mobile_verified_at: '2026-01-01T00:00:00Z',
            },
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ mobile: '01007867184', password: 'Password1!' });
      });

      expect(result.current.otpWasAutoSent).toBe(false);
    });
  });

  describe('Parent Login & Registration', () => {
    it('should successfully log in a parent user', async () => {
      const mockParentLoginResponse = {
        data: {
          parentLogin: {
            access_token: 'parent-token',
            parent: {
              id: '2',
              name: 'Nasser',
              mobile: '01007867181',
              mobile_verified_at: '2026-01-01T00:00:00Z',
            },
          },
        },
      };
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce(mockParentLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.parentLogin({
          mobile: '01007867181',
          password: 'Password1!',
        });
      });

      expect(loginResult).toEqual({ success: true });
      expect(result.current.parentUser).toEqual(mockParentLoginResponse.data.parentLogin.parent);
      expect(result.current.userRole).toBe('parent');
      expect(result.current.isAuthenticated).toBe(true);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'parent-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_role', 'parent');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'parent_data',
        JSON.stringify(mockParentLoginResponse.data.parentLogin.parent),
      );
      // Already verified — no gate, no code.
      expect(result.current.otpWasAutoSent).toBe(false);
    });

    it('should flag the auto-sent code when an unverified parent logs in', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: {
          parentLogin: {
            access_token: 'parent-token',
            parent: {
              id: '2',
              name: 'Nasser',
              mobile: '01007867181',
              mobile_verified_at: null,
            },
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.parentLogin({ mobile: '01007867181', password: 'Password1!' });
      });

      expect(result.current.otpWasAutoSent).toBe(true);
    });

    it('should successfully register a parent user', async () => {
      const mockParentRegisterResponse = {
        data: {
          parentRegister: {
            access_token: 'parent-token',
            parent: {
              id: '2',
              name: 'Nasser',
              mobile: '01007867181',
              email: 'parent@test.com',
              mobile_verified_at: null,
            },
          },
        },
      };
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce(mockParentRegisterResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.parentRegister({
          name: 'Nasser',
          mobile: '01007867181',
          email: 'parent@test.com',
          password: 'Password1!',
        });
      });

      expect(registerResult).toEqual({ success: true });
      expect(result.current.parentUser).toEqual(
        mockParentRegisterResponse.data.parentRegister.parent,
      );
      expect(result.current.userRole).toBe('parent');
      // parentRegister auto-sends the first code, so the gate opens on 'verify'.
      expect(result.current.otpWasAutoSent).toBe(true);
    });
  });

  describe('Logout & Password Reset', () => {
    it('should clear all tokens and data from storage on logout', async () => {
      // Simulate active user
      const studentUser = { id: '1', name: 'Ali', mobile: '01007867184' };
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('student-token')
        .mockResolvedValueOnce('student')
        .mockResolvedValueOnce(JSON.stringify(studentUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.parentUser).toBeNull();
      expect(result.current.userRole).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_role');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should unregister the push token before the credential is cleared (BKLT-316)', async () => {
      // Seeded through the store rather than queued responses: logout has to read
      // `auth_token` back out of storage, so clearing it first surfaces here as a
      // missing credential instead of passing on a canned value.
      const studentUser = { id: '1', name: 'Ali', mobile: '01007867184' };
      await SecureStore.setItemAsync('auth_token', 'student-token');
      await SecureStore.setItemAsync('user_role', 'student');
      await SecureStore.setItemAsync('user_data', JSON.stringify(studentUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      // The unregister mutation is authenticated. Clearing `auth_token` ahead of
      // it sent the request without an Authorization header, so the signed-out
      // account's push token stayed registered and the device kept receiving its
      // notifications.
      expect(unregisterDeviceToken).toHaveBeenCalledWith('student-token');
    });

    it('should invoke forgot password mutation for student', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { forgotPassword: { success: true, message: 'Success' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let forgotResult;
      await act(async () => {
        forgotResult = await result.current.forgotPassword('student@test.com');
      });

      expect(forgotResult).toEqual({ success: true, message: 'Success' });
      expect(apolloClient.mutate).toHaveBeenCalled();
    });

    it('should invoke forgot password mutation for parent', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { parentForgotPassword: { success: true, message: 'Success' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let forgotResult;
      await act(async () => {
        forgotResult = await result.current.parentForgotPassword('parent@test.com');
      });

      expect(forgotResult).toEqual({ success: true, message: 'Success' });
      expect(apolloClient.mutate).toHaveBeenCalled();
    });
  });
});
