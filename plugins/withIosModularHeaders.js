const { withPodfile } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add selective modular headers for Firebase pods.
 * Using global `use_modular_headers!` breaks Expo pods (EASClient, EXAV, etc.).
 * Instead, we apply it only to the specific Firebase utility pods that need it.
 */
module.exports = function withIosModularHeaders(config) {
  return withPodfile(config, (config) => {
    let content = config.modResults.contents;

    // Remove any existing global use_modular_headers! to avoid conflicts
    content = content.replace(/\nuse_modular_headers!\n/g, '\n');

    // The specific pods that Firebase Swift pods depend on which need modular headers
    const selectivePods = [
      "pod 'GoogleUtilities', :modular_headers => true",
      "pod 'GoogleDataTransport', :modular_headers => true",
      "pod 'nanopb', :modular_headers => true",
      "pod 'FirebaseABTesting', :modular_headers => true",
    ];

    // Add them inside the target block, after use_expo_modules!
    const marker = "  use_expo_modules!";
    if (content.includes(marker)) {
      const insertion = selectivePods.map(p => `  ${p}`).join('\n');
      // Only add if not already present
      if (!content.includes("pod 'GoogleUtilities', :modular_headers => true")) {
        content = content.replace(marker, `${marker}\n${insertion}`);
      }
    }

    config.modResults.contents = content;
    return config;
  });
};
