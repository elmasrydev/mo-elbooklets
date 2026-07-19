import * as SecureStore from 'expo-secure-store';

import { logError } from '../utils/logger';

/**
 * Single home for "this session is no longer valid" handling.
 *
 * Both transport layers — the Apollo error link (src/lib/apollo.ts) and the raw
 * fetch path (src/config/api.ts) — detect auth failures in their own response
 * shapes, then delegate here, so the storage cleanup and the AuthContext
 * notification can never drift apart between the two.
 */

/**
 * The backend signals a dead session either as a GraphQL error message
 * ("Unauthenticated.", sometimes embedded in a longer message) or as the
 * standard UNAUTHENTICATED extension code.
 */
export const isUnauthenticatedError = (message?: string | null, code?: unknown): boolean =>
  code === 'UNAUTHENTICATED' || (message ?? '').toLowerCase().includes('unauthenticated');

let sessionRevokedHandler: ((authToken?: string) => void) | null = null;

/**
 * AuthContext registers its cleanup here (state reset, Apollo cache clear,
 * push-token retirement). One registration covers both transports.
 */
export const setSessionRevokedHandler = (handler: ((authToken?: string) => void) | null): void => {
  sessionRevokedHandler = handler;
};

/**
 * Clear the persisted session and notify AuthContext.
 *
 * The credential is captured first and handed to the handler: the matcher above
 * fires on any error merely containing "unauthenticated", so the session is
 * often still valid — and the handler's push-token cleanup can (and should)
 * still authenticate with it before it is gone (BKLT-316).
 */
export const revokeSession = async (): Promise<void> => {
  let authToken: string | undefined;
  try {
    authToken = (await SecureStore.getItemAsync('auth_token')) || undefined;
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
  } catch (error) {
    // Teardown must never throw into a caller that can't handle it (the Apollo
    // error link fires this without awaiting). Log it and still notify
    // AuthContext, whose own guarded cleanup re-deletes these keys anyway.
    logError('revokeSession storage cleanup failed', error);
  }
  sessionRevokedHandler?.(authToken);
};
