import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { isDebugMode } from '../config/debug';
import {
  fetchPaymentAccess,
  flagForCurrentPlatform,
  PaymentAccessFlags,
} from '../lib/paymentAccess';

/** Debug builds only: forces the purchase surface on without a backend flag. */
export const DEBUG_PAYMENTS_OVERRIDE_KEY = 'debug_payments_forced';

/** Skip a refresh triggered within this window of the last one — taps stay instant. */
const REFRESH_TTL_MS = 60_000;

interface PaymentAccessContextType {
  /** True only when the backend says this platform may show the purchase flow. */
  isPaymentAllowed: boolean;
  /** False until a lookup has actually answered; the flag is off meanwhile. */
  isResolved: boolean;
  /** Pre-translated server note for the off state, if it sent one. */
  message: string | null;
  /** Re-read the flag, honouring the TTL unless `force` is set. */
  refresh: (options?: { force?: boolean }) => Promise<void>;
}

const PaymentAccessContext = createContext<PaymentAccessContextType | undefined>(undefined);

/**
 * Owns the backend switch for the whole purchase surface.
 *
 * Three properties matter and are deliberate:
 *
 * - **Fails closed.** Loading, offline, a server error, a backend without the
 *   field — all of them mean off, so the app behaves exactly as it did before
 *   payments existed rather than exposing a flow that may not be allowed here.
 * - **Never persisted.** A stored `true` would outlive the backend switching to
 *   `false`, which is precisely the case this flag exists to handle.
 * - **Never cached across a session.** The lookup is re-run on foreground so a
 *   long-lived app picks the change up without a restart.
 */
export const PaymentAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  const [flags, setFlags] = useState<PaymentAccessFlags | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [debugOverride, setDebugOverride] = useState(false);
  const lastFetchedAt = useRef(0);

  // Only students can buy; a parent account has no grade and never sees any of it.
  const isEligible = isAuthenticated && userRole === 'student';

  const refresh = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!isEligible) return;
      const now = Date.now();
      if (!force && now - lastFetchedAt.current < REFRESH_TTL_MS) return;
      lastFetchedAt.current = now;

      const result = await fetchPaymentAccess();
      setFlags(result?.flags ?? null);
      setMessage(result?.message ?? null);
      setIsResolved(result !== null);
    },
    [isEligible],
  );

  // Signing out must drop the flag with the session: the next account could be a
  // parent, or a student the backend answers differently for.
  useEffect(() => {
    if (!isEligible) {
      setFlags(null);
      setMessage(null);
      setIsResolved(false);
      lastFetchedAt.current = 0;
      return;
    }
    void refresh({ force: true });
  }, [isEligible, refresh]);

  useEffect(() => {
    if (!isEligible) return;
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [isEligible, refresh]);

  // The override exists so the purchase flow can be exercised before the backend
  // flag ships. Gated on the build-time debug flag alone — widening this would
  // put the whole payment surface into a production build.
  useEffect(() => {
    if (!isDebugMode()) return;
    let cancelled = false;
    AsyncStorage.getItem(DEBUG_PAYMENTS_OVERRIDE_KEY)
      .then((value) => {
        if (!cancelled) setDebugOverride(value === 'true');
      })
      .catch(() => {
        if (!cancelled) setDebugOverride(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEligible]);

  const value = useMemo<PaymentAccessContextType>(
    () => ({
      isPaymentAllowed:
        isEligible && (flagForCurrentPlatform(flags) || (isDebugMode() && debugOverride)),
      isResolved,
      message,
      refresh,
    }),
    [isEligible, flags, debugOverride, isResolved, message, refresh],
  );

  return <PaymentAccessContext.Provider value={value}>{children}</PaymentAccessContext.Provider>;
};

export const usePaymentAccess = (): PaymentAccessContextType => {
  const context = useContext(PaymentAccessContext);
  if (!context) {
    throw new Error('usePaymentAccess must be used within a PaymentAccessProvider');
  }
  return context;
};
