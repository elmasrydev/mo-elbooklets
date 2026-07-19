import { useCallback, useRef, useState } from 'react';

import { tryFetchWithFallback } from '../config/api';
import { EGYPT_MOBILE_REGEX } from '../utils/validators';
import { logError } from '../utils/logger';

export type MobileAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken';

export interface MobileAvailabilityResult {
  status: MobileAvailabilityStatus;
  /** Already localized by the backend. Empty when the verdict is inconclusive. */
  message: string;
}

type MobileAvailabilityType = 'student' | 'parent';

/** No usable verdict — the caller must let the user through. */
const INCONCLUSIVE: MobileAvailabilityResult = { status: 'idle', message: '' };

/**
 * Cap on the pre-submit gate, deliberately tighter than the transport's own
 * REQUEST_TIMEOUT_MS: a verdict here is only nice-to-have, so the submit
 * button shouldn't hang the full transport timeout for it. Timing out is safe —
 * it lands in the fail-open catch below, and `register` / `parentRegister`
 * still enforce uniqueness server-side.
 */
export const AVAILABILITY_CHECK_TIMEOUT_MS = 5000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`checkMobileAvailability timed out after ${ms}ms`)),
      ms,
    );
    // Attaching both handlers here also keeps a post-timeout settle of the
    // abandoned fetch from surfacing as an unhandled rejection.
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const CHECK_MOBILE_MUTATION = `
  mutation CheckMobileAvailability($mobile: String!, $type: String) {
    checkMobileAvailability(mobile: $mobile, type: $type) {
      available
      message
    }
  }
`;

/**
 * Early "is this mobile already registered?" check for the registration forms
 * (BKLT-308), so the user is told on blur instead of after finishing the form.
 *
 * `message` comes back already translated for the request locale — display it
 * as-is, never re-map it client-side.
 *
 * This is a UX helper only: `register` / `parentRegister` still enforce
 * uniqueness on submit, so a failed check never blocks the user.
 */
export const useMobileAvailability = (type: MobileAvailabilityType) => {
  const [status, setStatus] = useState<MobileAvailabilityStatus>('idle');
  const [message, setMessage] = useState('');

  // Only the newest request may write state — guards against a slow response
  // for an old number overwriting the verdict for the current one.
  const requestIdRef = useRef(0);
  const checkedMobileRef = useRef<string | null>(null);
  const pendingRef = useRef<Promise<MobileAvailabilityResult> | null>(null);

  const reset = useCallback(() => {
    requestIdRef.current += 1; // invalidates any in-flight response
    checkedMobileRef.current = null;
    pendingRef.current = null;
    setStatus('idle');
    setMessage('');
  }, []);

  /**
   * Resolve a verdict for `mobile`, reusing an in-flight or already-completed
   * check for the same number. Await this before advancing the form.
   */
  const ensureChecked = useCallback(
    async (mobile: string): Promise<MobileAvailabilityResult> => {
      const trimmed = mobile.trim();
      // Validate the format locally first — no point spending a round trip on
      // a half-typed number.
      if (!EGYPT_MOBILE_REGEX.test(trimmed)) return INCONCLUSIVE;
      if (checkedMobileRef.current === trimmed && pendingRef.current) return pendingRef.current;

      const requestId = ++requestIdRef.current;
      checkedMobileRef.current = trimmed;
      setStatus('checking');
      setMessage('');

      const pending = (async (): Promise<MobileAvailabilityResult> => {
        try {
          const res = await withTimeout(
            tryFetchWithFallback(CHECK_MOBILE_MUTATION, { mobile: trimmed, type }),
            AVAILABILITY_CHECK_TIMEOUT_MS,
          );
          const data = res?.data?.checkMobileAvailability;
          if (!data) throw new Error('checkMobileAvailability returned no data');

          // Superseded: the user edited the field while this was in flight, so
          // this verdict describes a number they are no longer registering with.
          // Returning it would gate the form on the wrong number.
          if (requestId !== requestIdRef.current) return INCONCLUSIVE;

          const result: MobileAvailabilityResult = {
            status: data.available ? 'available' : 'taken',
            message: data.message ?? '',
          };
          setStatus(result.status);
          setMessage(result.message);
          return result;
        } catch (error) {
          // Inconclusive (offline / server error): stay silent in the UI and let
          // the user continue — the register mutation still validates
          // server-side. Logged rather than swallowed so it stays diagnosable,
          // and the number is un-cached so the next blur retries it.
          logError('checkMobileAvailability failed', error);
          // Only the current request may clear the cache — an older failure must
          // not evict the entry a newer in-flight check is relying on.
          if (requestId === requestIdRef.current) {
            checkedMobileRef.current = null;
            pendingRef.current = null;
            setStatus('idle');
            setMessage('');
          }
          return INCONCLUSIVE;
        }
      })();

      pendingRef.current = pending;
      return pending;
    },
    [type],
  );

  /** Fire-and-forget variant for onBlur. */
  const check = useCallback(
    (mobile: string) => {
      void ensureChecked(mobile);
    },
    [ensureChecked],
  );

  return { status, message, check, ensureChecked, reset };
};
