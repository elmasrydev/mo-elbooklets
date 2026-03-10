const { withPodfile } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add `use_modular_headers!` to the Podfile.
 * This is required for Firebase 12+ Swift pods to link correctly.
 */
module.exports = function withIosModularHeaders(config) {
  return withPodfile(config, (config) => {
    let content = config.modResults.contents;

    // Check if it's already there
    if (!content.includes('use_modular_headers!')) {
      // Add it after the platform line or at the top of the target block
      content = content.replace(
        /platform :ios, .*/,
        `$&\nuse_modular_headers!`
      );
    }

    config.modResults.contents = content;
    return config;
  });
};
