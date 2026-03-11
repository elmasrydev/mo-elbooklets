const { withStringsXml } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add iOS-specific translation keys to the default Android strings.xml.
 * This prevents "ExtraTranslation" lint errors during release builds when these keys
 * are used in localized JSON files (like ar.json) but not in the default locale.
 */
module.exports = function withAndroidExtraStrings(config) {
  return withStringsXml(config, (config) => {
    const resources = config.modResults.resources;
    if (!resources.string) {
      resources.string = [];
    }
    
    const strings = resources.string;
    const appName = config.name || "El Booklets";

    const extraKeys = [
      { name: 'CFBundleDisplayName', value: appName },
      { name: 'CFBundleName', value: appName }
    ];

    extraKeys.forEach(({ name, value }) => {
      const exists = strings.some(s => s.$ && s.$.name === name);
      if (!exists) {
        strings.push({ $: { name }, _: value });
      }
    });

    return config;
  });
};
