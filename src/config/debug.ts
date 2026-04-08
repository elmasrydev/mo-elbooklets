/**
 * Debug Mode Configuration
 *
 * Centralised helper to check if the app is running in debug mode.
 * The flag is set in app.json > extra.debugMode and read via expo-constants.
 * This is used for:
 * - API URL Switcher (7-tap secret menu)
 * - Firebase Remote Config dev keys (force update, maintenance mode)
 * - ApiDomainChecker notifications
 */
import Constants from 'expo-constants';

/**
 * Returns true when the app is in debug/testing mode.
 * Reads from app.json > extra.debugMode at build time.
 */
export const isDebugMode = (): boolean => {
  return Constants.expoConfig?.extra?.debugMode === true;
};
