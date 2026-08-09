import crashlytics from '@react-native-firebase/crashlytics';
import DeviceInfo from 'react-native-device-info';
import i18n from '../i18n';
import { logError, logInfo } from './logger';

type UserRole = 'student' | 'parent' | 'guest';

/**
 * PRIVACY RULE — read before adding a key here.
 *
 * This app's users are minors. Crashlytics attributes are attached to every
 * crash report and are readable by anyone with Firebase console access, so the
 * only identifier we send is the account id (`setUserId`) — a pseudonymous key
 * that already links every session and report back to the account when support
 * needs it.
 *
 * NEVER add name, email, mobile, school, gender, address or any other field
 * that identifies a human being. Google's own terms forbid PII in Crashlytics
 * keys, and re-adding one would put a child's identity next to a stack trace.
 * Attributes below are strictly non-identifying context for reproducing a bug.
 */

// `| null` mirrors the API shape these values come from (see AuthContext.User).
interface CrashlyticsStudent {
  id: string;
  grade?: { id: string; name: string } | null;
  educational_system?: { id: string; name: string } | null;
  is_subscribed?: boolean | null;
}

interface CrashlyticsParent {
  id: string;
}

/** Device/app context shared by every role — none of it identifies the user. */
const deviceAttributes = (): Record<string, string> => ({
  device_brand: DeviceInfo.getBrand(),
  device_model: DeviceInfo.getModel(),
  os_version: DeviceInfo.getSystemVersion(),
  app_version: DeviceInfo.getVersion(),
  selected_language: i18n?.language || 'en',
});

const configure = async (role: UserRole, id: string, extra: Record<string, string> = {}) => {
  await crashlytics().setUserId(id);
  await crashlytics().setAttributes({ role, ...deviceAttributes(), ...extra });
  logInfo(`[Crashlytics] ${role} context configured (${id})`);
};

/**
 * Configure Crashlytics for a signed-in student.
 * Only the account id is identifying — see the privacy rule above.
 */
export const configureCrashlyticsStudent = async (user: CrashlyticsStudent): Promise<void> => {
  try {
    await configure('student', user.id, {
      grade: user.grade?.name || 'N/A',
      educational_system: user.educational_system?.name || 'N/A',
      is_subscribed: user.is_subscribed ? 'true' : 'false',
    });
  } catch (error) {
    logError('[Crashlytics] Failed to set student context', error);
  }
};

/** Configure Crashlytics for a signed-in parent. */
export const configureCrashlyticsParent = async (parent: CrashlyticsParent): Promise<void> => {
  try {
    await configure('parent', parent.id);
  } catch (error) {
    logError('[Crashlytics] Failed to set parent context', error);
  }
};

/** Clear user context (guest / logged out). */
export const configureCrashlyticsGuest = async (): Promise<void> => {
  try {
    await configure('guest', 'guest_user');
  } catch (error) {
    logError('[Crashlytics] Failed to set guest context', error);
  }
};
