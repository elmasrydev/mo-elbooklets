import React, { createContext, useCallback, useContext, useMemo, useRef, ReactNode } from 'react';
import { useQuery } from '@apollo/client/react';
import { TrialStatusDocument } from '../generated/graphql';
import { useAuth } from './AuthContext';
import { useAppForeground } from '../hooks/useAppForeground';
import { isDocumentRejection } from '../utils/graphqlErrors';
import { logError } from '../utils/logger';
import { TrialStatus } from '../utils/trialStatus';

/**
 * The signed-in student's trial / subscription state, fetched once for the
 * whole app (contract: `mobile-trial-restrictions.md` §2).
 *
 * One provider rather than a `useQuery` per screen: the gate, Home's banner and
 * the quiz counter all ask the same question, and each of them mounting its own
 * copy would re-hit the network on every navigation.
 *
 * `status` is `null` whenever the answer is unknown — a parent or signed-out
 * session, the first moments after launch, or a backend that has not deployed
 * the trial fields (demo and production as of 2026-08-23), where the query
 * fails outright. Consumers must treat `null` as "no trial UI, block nothing";
 * the helpers in `utils/trialStatus.ts` already do.
 */
export interface TrialStatusContextValue {
  status: TrialStatus | null;
  loading: boolean;
  /**
   * Re-read from the server — after a purchase, a quiz start, a foreground.
   * Resolves once the answer has landed, so a caller showing a spinner can
   * await it.
   */
  refresh: () => Promise<void>;
}

const FALLBACK: TrialStatusContextValue = {
  status: null,
  loading: false,
  refresh: async () => {},
};

/**
 * Defaults to "unknown" rather than throwing when no provider is mounted, so a
 * screen rendered on its own (unit tests, a future parent-side reuse) degrades
 * to no trial UI instead of crashing.
 */
const TrialStatusContext = createContext<TrialStatusContextValue>(FALLBACK);

export const TrialStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const isStudent = userRole === 'student' && !!user?.id;

  const { data, loading, error, refetch } = useQuery(TrialStatusDocument, {
    skip: !isStudent,
    // A backend without the fields rejects the whole operation; `all` keeps
    // that from bubbling up as an unhandled render error.
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  /**
   * The server rejecting the *document* means the trial fields are not
   * deployed here, and no amount of retrying will change it. Latch that so
   * launch, every foreground, every Home focus and every quiz start don't each
   * fire a request that cannot succeed.
   *
   * Deliberately narrow: only a validation-phase rejection counts. A failure
   * while *running* the query — an "Internal server error" on `me`, a dropped
   * request — must stay retryable, because latching on one of those would
   * freeze this student's plan state for the rest of the session, and the gate
   * reads it in preference to the cached flag. Someone whose subscription is
   * activated mid-session would stay locked out until they force-quit.
   */
  const unsupportedByBackend = useRef(false);
  if (error && isDocumentRejection(error)) unsupportedByBackend.current = true;

  const refresh = useCallback(async () => {
    // `refetch()` ignores `skip`, so it must be gated too or a signed-out
    // session (or a parent) would query `me` and 401.
    if (!isStudent || unsupportedByBackend.current) return;
    // Every caller fires this without awaiting, so a rejection has to be
    // contained here or it surfaces as an unhandled promise rejection.
    try {
      await refetch();
    } catch (refetchError) {
      logError('Trial status refresh failed', refetchError);
    }
  }, [isStudent, refetch]);

  useAppForeground(refresh);

  const me = data?.me;
  const status = useMemo<TrialStatus | null>(
    () =>
      me
        ? {
            isSubscribed: me.is_subscribed,
            onTrial: me.on_trial,
            trialEndsAt: me.trial_ends_at ?? null,
            trialDaysRemaining: me.trial_days_remaining ?? null,
            dailyQuizLimit: me.daily_quiz_limit ?? null,
            remainingQuizzesToday: me.remaining_quizzes_today ?? null,
          }
        : null,
    [me],
  );

  const value = useMemo<TrialStatusContextValue>(
    () => ({ status, loading, refresh }),
    [status, loading, refresh],
  );

  return <TrialStatusContext.Provider value={value}>{children}</TrialStatusContext.Provider>;
};

export const useTrialStatus = (): TrialStatusContextValue => useContext(TrialStatusContext);
