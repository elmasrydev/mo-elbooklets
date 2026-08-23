/**
 * Auth failure handling for login/register, both roles.
 *
 * The backend answers a rejected sign-in with a message already translated to
 * the request's `lang` header ("The provided credentials are incorrect." /
 * "بيانات الدخول مش صح."), delivered as a validation error on `mobile`. That
 * message is what the user sees — the app neither re-words it nor infers a
 * more specific cause from it, exactly as it already does for OTP sends and
 * `checkMobileAvailability`.
 *
 * Inferring is not just redundant, it is wrong: the server deliberately says
 * "credentials are incorrect" rather than "no such account", and rewriting
 * that into "no account found" leaks whether a number is registered.
 *
 * Only failures with no server message left to show fall back to a bundled
 * translation key.
 */

import { anyValidationMessageOf, isTransportError, serverMessageOf } from './graphqlErrors';

export interface AuthFailure {
  /** Pre-translated server text. Render verbatim — never through `t()`. */
  errorMessage?: string;
  /** Bundled translation key, used only when the server said nothing usable. */
  errorKey?: string;
}

/**
 * Turn a caught auth error into what the screen should display.
 * `fallbackKey` is the caller's domain default (bad credentials, registration
 * failed, …) for a failure the server did not explain.
 */
export const classifyAuthFailure = (error: unknown, fallbackKey: string): AuthFailure => {
  // A rejected sign-in is a *validation* failure on the mobile field, and the
  // sentence worth showing lives there. The top-level message may be nothing
  // but "Validation failed for the field [login]." — useless to a student — so
  // the field-level copy wins and the top level is only the fallback.
  const message = anyValidationMessageOf(error) ?? serverMessageOf(error);
  if (message) return { errorMessage: message };
  if (isTransportError(error)) return { errorKey: 'common.unexpected_error' };
  return { errorKey: fallbackKey };
};

/**
 * The string to show for a failed auth call: the server's words when there are
 * any, otherwise the translated fallback.
 */
export const authFailureText = (
  failure: AuthFailure,
  translate: (key: string) => string,
  fallbackKey: string,
): string => failure.errorMessage ?? translate(failure.errorKey ?? fallbackKey);
