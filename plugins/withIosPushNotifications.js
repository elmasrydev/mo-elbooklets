const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add Push Notifications entitlement and
 * Background Modes → remote-notification to the iOS project.
 *
 * This ensures that `expo prebuild --clean` always regenerates
 * these native capabilities automatically, which are required
 * for Firebase Cloud Messaging to register the device and
 * subscribe/unsubscribe from topics.
 */
module.exports = function withIosPushNotifications(config) {
  // 1. Add aps-environment entitlement (Push Notifications capability)
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['aps-environment'] = 'development';
    return mod;
  });

  // 2. Add UIBackgroundModes → remote-notification
  config = withInfoPlist(config, (mod) => {
    const bgModes = mod.modResults.UIBackgroundModes || [];
    if (!bgModes.includes('remote-notification')) {
      bgModes.push('remote-notification');
    }
    mod.modResults.UIBackgroundModes = bgModes;
    return mod;
  });

  return config;
};
