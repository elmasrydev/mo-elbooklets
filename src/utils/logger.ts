import { isDebugMode } from '../config/debug';

/**
 * Global error logger utility.
 * 
 * Used to centralize console logs and (in the future) external reporting providers like Firebase Crashlytics.
 * 
 * As per latest requirements:
 * - If debugMode=true in app.json, logs to console to aid developers.
 * - If debugMode=false, suppresses console logs.
 * - Firebase logging is currently DISABLED for this utility.
 */
export const logError = (message: string, error?: any): void => {
  if (isDebugMode()) {
    console.error(`[EL-Booklets ERROR] ${message}`, error || '');
  }
  // Firebase Crashlytics is intentionally ignored for now per user request.
  // In the future:
  // if (error instanceof Error) crashlytics().recordError(error);
};

/**
 * Log a warning message (breadcrumb).
 */
export const logWarning = (message: string): void => {
  if (isDebugMode()) {
    console.warn(`[EL-Booklets WARNING] ${message}`);
  }
};

/**
 * Log an info message.
 */
export const logInfo = (message: string): void => {
  if (isDebugMode()) {
    console.log(`[EL-Booklets INFO] ${message}`);
  }
};
