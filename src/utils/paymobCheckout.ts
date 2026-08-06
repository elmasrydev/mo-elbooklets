/**
 * Rules for the Paymob hosted-checkout round trip.
 *
 * The webview is closed on a redirect to our return URL, and the outcome is only
 * ever read from `paymentIntentStatus(reference)` — the return URL is identical
 * for success and failure, so nothing about the result may be inferred from it.
 */

/** Paymob redirects here when the payment resolves, whichever way it went. */
const RETURN_PATH = '/checkout/paymob/return';

/** Poll cadence from the backend guide: every 2s for ~30s while the webhook lands. */
export const POLL_INTERVAL_MS = 2000;
export const POLL_MAX_ATTEMPTS = 15;

/**
 * True for the return URL, whatever host and locale prefix it carries — the
 * domain differs per environment and the path is prefixed with the web app's
 * locale segment.
 */
export const isPaymobReturnUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const withoutQuery = url.split('?')[0].split('#')[0];
  return withoutQuery.includes(RETURN_PATH);
};

/**
 * The `ref` the return URL carries. Only a cross-check: the reference saved from
 * the mutation is the one that gets polled, since a cancelled webview never
 * reaches this URL but still has to be confirmed.
 */
export const referenceFromReturnUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const query = url.split('?')[1];
  if (!query) return null;
  const match = query
    .split('#')[0]
    .split('&')
    .find((part) => part.startsWith('ref='));
  if (!match) return null;
  const value = decodeURIComponent(match.slice('ref='.length));
  return value.length > 0 ? value : null;
};

/**
 * A webview navigation the in-app browser should not try to render: 3-D Secure
 * pages and wallet apps hand off through custom schemes, which would otherwise
 * fail to load inside the webview.
 */
export const isExternalScheme = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const scheme = url.split(':')[0].toLowerCase();
  return (
    scheme.length > 0 &&
    scheme !== url &&
    !['http', 'https', 'about', 'data', 'blob'].includes(scheme)
  );
};

/** Where the checkout screen currently is. The result is a state, not a route. */
export type PaymentPhase = 'checkout' | 'confirming' | 'success' | 'failed' | 'still_pending';

/** `paymentIntentStatus.status`, plus null for an unknown reference. */
export type IntentStatus = 'pending' | 'completed' | 'failed' | null | undefined;

/**
 * The phase a poll result puts the screen in.
 *
 * A null result means the reference is unknown to the backend, which the guide
 * treats as pending rather than an error. Running out of attempts is a soft
 * "still confirming" state and never a failure — the webhook may just be late,
 * and offline methods resolve hours later.
 */
export const derivePaymentPhase = (status: IntentStatus, attemptsUsed: number): PaymentPhase => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'failed';
  return attemptsUsed >= POLL_MAX_ATTEMPTS ? 'still_pending' : 'confirming';
};

/** A checkout that was opened but never resolved on this device. */
export interface PendingPaymentRecord {
  reference: string;
  planLabel: string;
  startedAt: number;
}

/**
 * Parse a stored pending payment, tolerating anything that is not a well-formed
 * record. A corrupt entry must not block the packages screen behind a recovery
 * prompt for a payment that can never be confirmed.
 */
export const parsePendingPayment = (raw: string | null): PendingPaymentRecord | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingPaymentRecord>;
    if (typeof parsed?.reference !== 'string' || parsed.reference.length === 0) return null;
    return {
      reference: parsed.reference,
      planLabel: typeof parsed.planLabel === 'string' ? parsed.planLabel : '',
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : 0,
    };
  } catch {
    return null;
  }
};
