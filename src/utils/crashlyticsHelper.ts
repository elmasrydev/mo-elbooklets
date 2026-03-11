import crashlytics from '@react-native-firebase/crashlytics';
import DeviceInfo from 'react-native-device-info';
import i18n from '../i18n';

// Replace with your actual User type if it's exported from AuthContext
// Or define a compatible minimal interface
export interface CrashlyticsUser {
  id: string;
  email: string;
  mobile: string;
}

export const configureCrashlyticsUser = async (user: CrashlyticsUser | null) => {
  try {
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const osVersion = DeviceInfo.getSystemVersion();
    const currentLanguage = i18n?.language || 'en';
    if (user) {
      console.log('user', {
        email: user.email || 'Unknown',
        mobile: user.mobile || 'Unknown',
        device_brand: brand,
        device_model: model,
        os_version: osVersion,
        selected_language: currentLanguage,
        user_type: 'Logged In',
      });
      // Logged-in user
      await crashlytics().setUserId(user.id);
      await crashlytics().setAttributes({
        email: user.email || 'Unknown',
        mobile: user.mobile || 'Unknown',
        device_brand: brand,
        device_model: model,
        os_version: osVersion,
        selected_language: currentLanguage,
        user_type: 'Logged In',
      });
    } else {
      console.log('user', {
        email: 'Guest',
        mobile: 'Guest',
        device_brand: brand,
        device_model: model,
        os_version: osVersion,
        selected_language: currentLanguage,
        user_type: 'Guest',
      });
      // Guest user
      await crashlytics().setUserId('guest_user');
      await crashlytics().setAttributes({
        email: 'Guest',
        mobile: 'Guest',
        device_brand: brand,
        device_model: model,
        os_version: osVersion,
        selected_language: currentLanguage,
        user_type: 'Guest',
      });
    }

    if (__DEV__) {
      console.log(
        'Crashlytics user attributes configured successfully.',
        user ? 'Logged In' : 'Guest',
      );
    }
  } catch (error) {
    console.error('Failed to set Crashlytics properties', error);
  }
};
