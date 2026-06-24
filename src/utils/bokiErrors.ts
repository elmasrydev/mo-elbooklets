/**
 * Boki AI Assistant — error classification (pure, no React/Native deps).
 *
 * Translates a failed request into one of three user-facing kinds so the chat
 * can show the right message and the right analytics event:
 *   - `offline`   → no internet connection (decided by the caller via NetInfo)
 *   - `rateLimit` → backend 429 ("Too many requests…", 10/min per user)
 *   - `backend`   → any other GraphQL/HTTP/network failure
 */

import { BokiErrorKind } from '../types/boki';

export interface BokiErrorInfo {
  kind: BokiErrorKind;
  /** Seconds to wait before retrying, when the backend reports it (rate limit). */
  retryAfterSeconds?: number;
}

const RATE_LIMIT_RE = /too many requests/i;

/** Extracts the "try again in N seconds" hint from a rate-limit message. */
export const parseRetryAfterSeconds = (message?: string | null): number | undefined => {
  if (!message) return undefined;
  const match = message.match(/try again in (\d+)\s*second/i);
  return match ? parseInt(match[1], 10) : undefined;
};

/** True when any GraphQL error indicates the per-user rate limit was hit. */
export const isRateLimitError = (errors?: { message?: string }[] | null): boolean => {
  if (!errors || errors.length === 0) return false;
  return errors.some((error) => RATE_LIMIT_RE.test(error?.message || ''));
};

/**
 * Classify a failure. `isConnected === false` always wins (offline); otherwise a
 * rate-limit message maps to `rateLimit`, and everything else to `backend`.
 */
export const classifyBokiError = (input: {
  isConnected?: boolean;
  errors?: { message?: string }[] | null;
}): BokiErrorInfo => {
  if (input.isConnected === false) return { kind: 'offline' };

  if (isRateLimitError(input.errors)) {
    const rateLimitMessage = input.errors?.find((error) =>
      RATE_LIMIT_RE.test(error?.message || ''),
    )?.message;
    return { kind: 'rateLimit', retryAfterSeconds: parseRetryAfterSeconds(rateLimitMessage) };
  }

  return { kind: 'backend' };
};

/** Error thrown by the Boki service so callers can branch on `kind`. */
export class BokiApiError extends Error {
  readonly kind: BokiErrorKind;
  readonly retryAfterSeconds?: number;

  constructor(info: BokiErrorInfo) {
    super(`Boki request failed (${info.kind})`);
    this.name = 'BokiApiError';
    this.kind = info.kind;
    this.retryAfterSeconds = info.retryAfterSeconds;
  }
}
