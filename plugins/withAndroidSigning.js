const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroidSigning(config) {
  // 1. Inject Keystore credentials into gradle.properties
  config = withGradleProperties(config, (config) => {
    const props = config.modResults;
    const addOrUpdate = (key, value) => {
      const idx = props.findIndex(p => p.type === 'property' && p.key === key);
      if (idx > -1) {
        props[idx].value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    addOrUpdate('ELBOOKLETS_RELEASE_STORE_FILE', '../../upload-key.keystore');
    addOrUpdate('ELBOOKLETS_RELEASE_KEY_ALIAS', 'upload');
    addOrUpdate('ELBOOKLETS_RELEASE_STORE_PASSWORD', 'elbooklets123');
    addOrUpdate('ELBOOKLETS_RELEASE_KEY_PASSWORD', 'elbooklets123');

    return config;
  });

  // 2. Inject Signing logic into app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Inject store details
    if (!contents.includes('ELBOOKLETS_RELEASE_STORE_FILE')) {
      contents = contents.replace(
        /signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}/,
        `$&
        release {
            if (project.hasProperty('ELBOOKLETS_RELEASE_STORE_FILE')) {
                storeFile file(ELBOOKLETS_RELEASE_STORE_FILE)
                storePassword ELBOOKLETS_RELEASE_STORE_PASSWORD
                keyAlias ELBOOKLETS_RELEASE_KEY_ALIAS
                keyPassword ELBOOKLETS_RELEASE_KEY_PASSWORD
            }
        }`
      );
    }

    // Change buildTypes { release { signingConfig signingConfigs.debug -> release
    if (contents.includes('signingConfig signingConfigs.debug')) {
       contents = contents.replace(
         /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
         '$1signingConfig signingConfigs.release'
       );
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
};
