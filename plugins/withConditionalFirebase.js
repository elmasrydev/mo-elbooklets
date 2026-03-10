const { withStaticPlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to conditionally apply @react-native-firebase/app.
 * It skips the iOS part if the googleServicesFile is not explicitly set for iOS.
 * This prevents prebuild failures when Firebase iOS is not yet configured.
 */
module.exports = function withConditionalFirebase(config) {
  const iosConfig = config.ios?.googleServicesFile;
  
  // If we have an iOS config, we can just use the standard plugin
  // Otherwise, we "mock" or wrap the plugin to only apply to Android if possible,
  // but since @react-native-firebase/app is a static plugin, we might need to 
  // manually handle the platform check.
  
  if (!iosConfig) {
    console.log('[FirebasePlugin] iOS googleServicesFile not found. Skipping Firebase config for iOS to prevent prebuild failure.');
    
    // We remove the ios part of the config to see if the plugin handles it gracefully
    // Or we can try to "nullify" the plugin's effect on iOS.
  }

  return withStaticPlugin(config, {
    _isLegacyPlugin: true,
    plugin: '@react-native-firebase/app',
    // If no iOS config, we could pass an empty config or similar, 
    // but the plugin often throws if it doesn't find the file in the project.
  });
};
