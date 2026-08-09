import { getCrashlytics, log, recordError } from '@react-native-firebase/crashlytics';

import { isDebugMode } from '../config/debug';

/**
 * Global logging utility.
 *
 * Console output is gated on `debugMode` (app.json) so a production build stays
 * quiet. Crashlytics reporting is NOT gated on it — a release build is exactly
 * where we need the reports.
 *
 * `logError` records a non-fatal so handled failures (a failed mutation, a
 * swallowed parse error) are visible alongside real crashes; without this the
 * console only ever showed native crashes and unhandled JS exceptions.
 * Warnings and info become breadcrumbs attached to the next report.
 *
 * Whether anything is actually delivered is decided natively by
 * `crashlytics_auto_collection_enabled` / `crashlytics_debug_enabled` in
 * `firebase.json` — debug builds report nothing unless the latter is true.
 *
 * Uses the **modular** RNFB API on purpose: the namespaced `crashlytics()` form
 * is deprecated and logs a migration warning on every single call, which would
 * flood the dev console given how often these helpers run.
 *
 * PRIVACY: messages here land in the Crashlytics console. Never interpolate a
 * name, mobile, email or any other user identifier into one — see the rule in
 * `crashlyticsHelper.ts`.
 */
const crashlytics = () => getCrashlytics();

/** Telemetry must never break the caller — these run inside catch blocks. */
const safely = (action: () => void): void => {
  try {
    action();
  } catch {
    // Reporting is best-effort by design.
  }
};

export const logError = (message: string, error?: unknown): void => {
  if (isDebugMode()) {
    console.error(`[EL-Booklets ERROR] ${message}`, error || '');
  }

  safely(() => {
    const reported =
      error instanceof Error
        ? error
        : new Error(error === undefined ? message : `${message}: ${String(error)}`);
    recordError(crashlytics(), reported, message);
  });
};

/**
 * Log a warning message (breadcrumb).
 */
export const logWarning = (message: string): void => {
  if (isDebugMode()) {
    console.warn(`[EL-Booklets WARNING] ${message}`);
  }
  safely(() => log(crashlytics(), `WARN: ${message}`));
};

/**
 * Log an info message (breadcrumb).
 */
export const logInfo = (message: string): void => {
  if (isDebugMode()) {
    console.log(`[EL-Booklets INFO] ${message}`);
  }
  safely(() => log(crashlytics(), message));
};
