import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { tryFetchWithFallback } from '../../config/api';
import { registerDeviceToken, unregisterDeviceToken } from '../../services/notificationService';

jest.mock('../../config/api', () => ({
  tryFetchWithFallback: jest.fn(),
}));

const REGISTERED_FCM_TOKEN_KEY = 'registered_fcm_token';
const REGISTERED_FCM_ROLE_KEY = 'registered_fcm_role';
const PENDING_FCM_DELETE_KEY = 'pending_fcm_delete';

const fcm = messaging() as any;
const mockFetch = tryFetchWithFallback as jest.Mock;

const signedInAs = async (role: 'student' | 'parent', token: string) => {
  await AsyncStorage.setItem(REGISTERED_FCM_TOKEN_KEY, token);
  await AsyncStorage.setItem(REGISTERED_FCM_ROLE_KEY, role);
};

describe('notificationService — push token lifecycle on sign-out', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // Default to a physical device: the emulator guards would otherwise short-circuit
    // the very paths under test.
    (DeviceInfo.isEmulator as jest.Mock).mockResolvedValue(false);
    fcm.getToken.mockResolvedValue('device-token');
    fcm.deleteToken.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({ data: {} });
  });

  it('sends the unregister mutation with the credential it was given', async () => {
    await signedInAs('student', 'device-token');

    await unregisterDeviceToken('student-auth-token');

    // Third argument is the bearer token. Without it tryFetchWithFallback falls back
    // to SecureStore, which the caller has already cleared, and the mutation goes out
    // unauthenticated — the BKLT-316 defect.
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('unregisterDeviceToken'),
      { token: 'device-token' },
      'student-auth-token',
    );
  });

  it('uses the parent mutation when a parent signs out', async () => {
    await signedInAs('parent', 'device-token');

    await unregisterDeviceToken('parent-auth-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('parentUnregisterDeviceToken'),
      expect.anything(),
      'parent-auth-token',
    );
  });

  it('retires the rotated token as well when it no longer matches the stored one', async () => {
    // A refresh re-registration that failed leaves the server holding a token the
    // device has already replaced. Both have to be retired.
    await signedInAs('student', 'stale-token');
    fcm.getToken.mockResolvedValue('rotated-token');

    await unregisterDeviceToken('student-auth-token');

    const retiredTokens = mockFetch.mock.calls.map((call) => call[1].token);
    expect(retiredTokens).toEqual(['stale-token', 'rotated-token']);
  });

  it('invalidates the device token so pushes cannot reach the signed-out account', async () => {
    await signedInAs('student', 'device-token');

    await unregisterDeviceToken('student-auth-token');

    expect(fcm.deleteToken).toHaveBeenCalled();
    expect(await AsyncStorage.getItem(REGISTERED_FCM_TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(REGISTERED_FCM_ROLE_KEY)).toBeNull();
  });

  it('still clears local state when the server rejects the unregister', async () => {
    await signedInAs('student', 'device-token');
    mockFetch.mockResolvedValue({ errors: [{ message: 'Unauthenticated.' }] });

    await unregisterDeviceToken('student-auth-token');

    expect(fcm.deleteToken).toHaveBeenCalled();
    expect(await AsyncStorage.getItem(REGISTERED_FCM_TOKEN_KEY)).toBeNull();
  });

  it('does not queue a deletion when the device token was successfully invalidated', async () => {
    await signedInAs('student', 'device-token');
    mockFetch.mockRejectedValue(new Error('offline'));

    await unregisterDeviceToken('student-auth-token');

    // The server call failed but the token is dead, so pushes cannot land — nothing
    // left to settle.
    expect(await AsyncStorage.getItem(PENDING_FCM_DELETE_KEY)).toBeNull();
  });

  describe('signing out with no connectivity', () => {
    it('queues the deletion when neither the server nor the device could retire the token', async () => {
      await signedInAs('student', 'device-token');
      mockFetch.mockRejectedValue(new Error('offline'));
      fcm.deleteToken.mockRejectedValue(new Error('offline'));

      await unregisterDeviceToken('student-auth-token');

      expect(await AsyncStorage.getItem(PENDING_FCM_DELETE_KEY)).toBe('true');
    });

    it('settles the queued deletion before the next account binds a token', async () => {
      await AsyncStorage.setItem(PENDING_FCM_DELETE_KEY, 'true');

      await registerDeviceToken('parent');

      // The token left live by the failed sign-out is destroyed before a new one is
      // minted, so the incoming parent never shares the student's token.
      expect(fcm.deleteToken).toHaveBeenCalled();
      expect(fcm.deleteToken.mock.invocationCallOrder[0]).toBeLessThan(
        fcm.getToken.mock.invocationCallOrder[0],
      );
      expect(await AsyncStorage.getItem(PENDING_FCM_DELETE_KEY)).toBeNull();
    });

    it('keeps the deletion queued while it still cannot be carried out', async () => {
      await AsyncStorage.setItem(PENDING_FCM_DELETE_KEY, 'true');
      fcm.deleteToken.mockRejectedValue(new Error('offline'));

      await registerDeviceToken('parent');

      expect(await AsyncStorage.getItem(PENDING_FCM_DELETE_KEY)).toBe('true');
    });
  });

  it('skips the server call when nothing was registered', async () => {
    await unregisterDeviceToken('student-auth-token');

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
