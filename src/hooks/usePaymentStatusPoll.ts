import { useCallback, useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { PaymentIntentStatusDocument } from '../generated/graphql';
import {
  derivePaymentPhase,
  IntentStatus,
  PaymentPhase,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
} from '../utils/paymobCheckout';

export type PollPhase = PaymentPhase | 'idle';

export interface PaymentStatusPoll {
  phase: PollPhase;
  /** Server-worded reason for a decline; already translated, shown as-is. */
  failureReason: string | null;
  subscriptionId: string | null;
  /** Begin (or restart) the confirmation window for a reference. */
  start: (reference: string) => void;
  /** Re-run the window for the reference already being tracked. */
  recheck: () => void;
}

/**
 * Confirms a payment attempt by polling its own reference.
 *
 * The subscription is created by Paymob's webhook, not by the checkout mutation,
 * so the result can lag the webview closing. Every attempt is a fresh network
 * read — a cached answer would be the very "pending" this is waiting to see
 * change.
 *
 * Running out of attempts is deliberately not a failure: the webhook may just be
 * late, and pay-later methods resolve hours afterwards. Only an explicit
 * `failed` from the server ends the attempt badly.
 */
export const usePaymentStatusPoll = (): PaymentStatusPoll => {
  const client = useApolloClient();
  const [phase, setPhase] = useState<PollPhase>('idle');
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const referenceRef = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      isPollingRef.current = false;
      clearTimer();
    },
    [],
  );

  const runAttempt = useCallback(async () => {
    const reference = referenceRef.current;
    if (!isPollingRef.current || !reference) return;

    attemptsRef.current += 1;
    let status: IntentStatus = null;

    try {
      const { data } = await client.query({
        query: PaymentIntentStatusDocument,
        variables: { reference },
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      });
      const intent = data?.paymentIntentStatus;
      status = intent?.status as IntentStatus;
      if (status === 'failed') setFailureReason(intent?.failureReason ?? null);
      if (status === 'completed') setSubscriptionId(intent?.subscriptionId ?? null);
    } catch {
      // A dropped request says nothing about the payment, so it counts as one
      // more inconclusive attempt rather than ending the window badly.
      status = null;
    }

    if (!isPollingRef.current) return;

    const next = derivePaymentPhase(status, attemptsRef.current);
    setPhase(next);

    if (next === 'confirming') {
      timerRef.current = setTimeout(() => void runAttempt(), POLL_INTERVAL_MS);
      return;
    }
    isPollingRef.current = false;
  }, [client]);

  const start = useCallback(
    (reference: string) => {
      clearTimer();
      referenceRef.current = reference;
      attemptsRef.current = 0;
      isPollingRef.current = true;
      setFailureReason(null);
      setSubscriptionId(null);
      setPhase('confirming');
      void runAttempt();
    },
    [runAttempt],
  );

  const recheck = useCallback(() => {
    const reference = referenceRef.current;
    if (reference) start(reference);
  }, [start]);

  return { phase, failureReason, subscriptionId, start, recheck };
};

export { POLL_MAX_ATTEMPTS };
