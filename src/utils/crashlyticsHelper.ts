import crashlytics from '@react-native-firebase/crashlytics';
import DeviceInfo from 'react-native-device-info';
import i18n from '../i18n';
import { logError, logInfo } from './logger';

type UserRole = 'student' | 'parent' | 'guest';

interface CrashlyticsStudent {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  country_code?: string;
  gender?: string;
  school_name?: string;
  grade?: { id: string; name: string };
  educational_system?: { id: string; name: string };
  is_subscribed?: boolean;
}

interface CrashlyticsParent {
  id: string;
  name: string;
  mobile: string;
  country_code?: string;
}

/**
 * Configure Crashlytics with student user attributes.
 */
export const configureCrashlyticsStudent = async (
  user: CrashlyticsStudent,
): Promise<void> => {
  try {
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const osVersion = DeviceInfo.getSystemVersion();
    const currentLanguage = i18n?.language || 'en';

    await crashlytics().setUserId(user.id);
    await crashlytics().setAttributes({
      role: 'student',
      name: user.name || 'Unknown',
      email: user.email || 'N/A',
      mobile: user.mobile || 'Unknown',
      country_code: user.country_code || 'N/A',
      gender: user.gender || 'N/A',
      school_name: user.school_name || 'N/A',
      grade: user.grade?.name || 'N/A',
      educational_system: user.educational_system?.name || 'N/A',
      is_subscribed: user.is_subscribed ? 'true' : 'false',
      device_brand: brand,
      device_model: model,
      os_version: osVersion,
      selected_language: currentLanguage,
    });

    logInfo(`[Crashlytics] Student attributes configured: ${user.name} (${user.id})`);
  } catch (error) {
    logError('[Crashlytics] Failed to set student properties', error);
  }
};

/**
 * Configure Crashlytics with parent user attributes.
 */
export const configureCrashlyticsParent = async (
  parent: CrashlyticsParent,
): Promise<void> => {
  try {
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const osVersion = DeviceInfo.getSystemVersion();
    const currentLanguage = i18n?.language || 'en';

    await crashlytics().setUserId(parent.id);
    await crashlytics().setAttributes({
      role: 'parent',
      name: parent.name || 'Unknown',
      email: 'N/A',
      mobile: parent.mobile || 'Unknown',
      country_code: parent.country_code || 'N/A',
      device_brand: brand,
      device_model: model,
      os_version: osVersion,
      selected_language: currentLanguage,
    });

    logInfo(`[Crashlytics] Parent attributes configured: ${parent.name} (${parent.id})`);
  } catch (error) {
    logError('[Crashlytics] Failed to set parent properties', error);
  }
};

/**
 * Clear Crashlytics user attributes (guest/logged out).
 */
export const configureCrashlyticsGuest = async (): Promise<void> => {
  try {
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const osVersion = DeviceInfo.getSystemVersion();
    const currentLanguage = i18n?.language || 'en';

    await crashlytics().setUserId('guest_user');
    await crashlytics().setAttributes({
      role: 'guest',
      name: 'Guest',
      email: 'N/A',
      mobile: 'N/A',
      country_code: 'N/A',
      device_brand: brand,
      device_model: model,
      os_version: osVersion,
      selected_language: currentLanguage,
    });

    logInfo('[Crashlytics] Guest attributes configured.');
  } catch (error) {
    logError('[Crashlytics] Failed to set guest properties', error);
  }
};
