import crashlytics from '@react-native-firebase/crashlytics';
import { isDebugMode } from '../config/debug';

/**
 * Global logging utility.
 *
 * Console output is gated on `debugMode` (app.json) so a production build stays
 * quiet. Crashlytics reporting is NOT gated on it — a release build is exactly
 * where we need the reports.
 *
 * `logError` records a non-fatal to Crashlytics so handled failures (a failed
 * mutation, a swallowed parse error) are visible alongside real crashes;
 * without this the console only ever shows native crashes and unhandled JS
 * exceptions. Warnings and info become breadcrumbs attached to the next report.
 *
 * Whether anything is actually delivered is decided natively by
 * `crashlytics_auto_collection_enabled` / `crashlytics_debug_enabled` in
 * `firebase.json` — debug builds report nothing unless the latter is true.
 *
 * PRIVACY: messages here land in the Crashlytics console. Never interpolate a
 * name, mobile, email or any other user identifier into one — see the rule in
 * `crashlyticsHelper.ts`.
 */
export const logError = (message: string, error?: unknown): void => {
  if (isDebugMode()) {
    console.error(`[EL-Booklets ERROR] ${message}`, error || '');
  }

  try {
    crashlytics().log(message);
    if (error instanceof Error) {
      crashlytics().recordError(error, message);
    } else if (error !== undefined) {
      crashlytics().recordError(new Error(`${message}: ${String(error)}`), message);
    } else {
      crashlytics().recordError(new Error(message), message);
    }
  } catch {
    // Never let telemetry break the caller — logError is used inside catch blocks.
  }
};

/**
 * Log a warning message (breadcrumb).
 */
export const logWarning = (message: string): void => {
  if (isDebugMode()) {
    console.warn(`[EL-Booklets WARNING] ${message}`);
  }
  try {
    crashlytics().log(`WARN: ${message}`);
  } catch {
    // Breadcrumbs are best-effort.
  }
};

/**
 * Log an info message.
 */
export const logInfo = (message: string): void => {
  if (isDebugMode()) {
    console.log(`[EL-Booklets INFO] ${message}`);
  }
  try {
    crashlytics().log(message);
  } catch {
    // Breadcrumbs are best-effort.
  }
};
