import * as SecureStore from 'expo-secure-store';

import { isUnauthenticatedError, revokeSession, setSessionRevokedHandler } from '../../lib/session';

// The single session-revocation path the Apollo error link delegates to — a
// regression here logs users out wrongly or, worse, leaves a dead session
// appearing signed-in.
describe('isUnauthenticatedError', () => {
  it.each([
    ['exact backend message', 'Unauthenticated.', undefined, true],
    ['message embedding the marker', 'Error: unauthenticated request', undefined, true],
    ['case-insensitive match', 'UNAUTHENTICATED user', undefined, true],
    ['standard extension code', undefined, 'UNAUTHENTICATED', true],
    ['ordinary error message', 'Invalid mobile or password', undefined, false],
    ['unrelated code', 'Something failed', 'INTERNAL_SERVER_ERROR', false],
    ['nothing provided', undefined, undefined, false],
  ])('%s → %s', (_label, message, code, expected) => {
    expect(isUnauthenticatedError(message, code)).toBe(expected);
  });
});

describe('revokeSession', () => {
  beforeEach(() => {
    (SecureStore as any)._clear();
    setSessionRevokedHandler(null);
  });

  it('captures the token, clears the stored session, and notifies the handler', async () => {
    await SecureStore.setItemAsync('auth_token', 'tok-123');
    await SecureStore.setItemAsync('user_data', '{"id":"1"}');
    const handler = jest.fn();
    setSessionRevokedHandler(handler);

    await revokeSession();

    // The handler receives the credential it needs for authenticated cleanup
    // (push-token retirement, BKLT-316) even though storage is already clear.
    expect(handler).toHaveBeenCalledWith('tok-123');
    expect(await SecureStore.getItemAsync('auth_token')).toBeNull();
    expect(await SecureStore.getItemAsync('user_data')).toBeNull();
  });

  it('hands undefined to the handler when no token was stored', async () => {
    const handler = jest.fn();
    setSessionRevokedHandler(handler);

    await revokeSession();

    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it('still clears storage when no handler is registered', async () => {
    await SecureStore.setItemAsync('auth_token', 'tok-123');

    await expect(revokeSession()).resolves.toBeUndefined();

    expect(await SecureStore.getItemAsync('auth_token')).toBeNull();
  });

  it('still notifies the handler when storage cleanup fails', async () => {
    await SecureStore.setItemAsync('auth_token', 'tok-123');
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain busy'));
    const handler = jest.fn();
    setSessionRevokedHandler(handler);

    // The Apollo error link fires revokeSession without awaiting it, so a
    // storage failure must neither reject nor skip the AuthContext cleanup.
    await expect(revokeSession()).resolves.toBeUndefined();
    expect(handler).toHaveBeenCalledWith('tok-123');
  });
});
