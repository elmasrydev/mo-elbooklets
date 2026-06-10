const { withAndroidManifest, withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const { join } = require('path');

/**
 * Expo Config Plugin to apply Android Security configurations during prebuild.
 */
function withSecurityManifest(config) {
  return withAndroidManifest(config, (mod) => {
    // 1. Ensure tools namespace is defined in the manifest
    if (!mod.modResults.manifest.$['xmlns:tools']) {
      mod.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const mainApp = mod.modResults.manifest.application?.[0];
    if (!mainApp) return mod;

    // 2. Set allowBackup to false
    mainApp.$['android:allowBackup'] = 'false';

    // 3. Set networkSecurityConfig xml reference
    mainApp.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    // 4. Ensure DevSettingsActivity is disabled/not exported in release
    if (!mainApp.activity) {
      mainApp.activity = [];
    }
    const activities = mainApp.activity;
    const devSettingsActivityName = 'com.facebook.react.devsupport.DevSettingsActivity';
    let devSettingsActivity = activities.find(a => a.$?.['android:name'] === devSettingsActivityName);
    if (!devSettingsActivity) {
      activities.push({
        $: {
          'android:name': devSettingsActivityName,
          'android:exported': 'false',
          'tools:replace': 'android:exported',
        }
      });
    } else {
      devSettingsActivity.$['android:exported'] = 'false';
      devSettingsActivity.$['tools:replace'] = 'android:exported';
    }

    // 5. Remove SYSTEM_ALERT_WINDOW permission
    if (!mod.modResults.manifest['uses-permission']) {
      mod.modResults.manifest['uses-permission'] = [];
    }
    const permissions = mod.modResults.manifest['uses-permission'];
    const systemAlertWindowName = 'android.permission.SYSTEM_ALERT_WINDOW';
    let systemAlertWindow = permissions.find(p => p.$?.['android:name'] === systemAlertWindowName);
    if (systemAlertWindow) {
      systemAlertWindow.$['tools:node'] = 'remove';
    } else {
      permissions.push({
        $: {
          'android:name': systemAlertWindowName,
          'tools:node': 'remove',
        }
      });
    }

    return mod;
  });
}

function withSecurityGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const addOrUpdate = (key, value) => {
      const idx = props.findIndex(p => p.type === 'property' && p.key === key);
      if (idx > -1) {
        props[idx].value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    // Enable R8/ProGuard shrinking and minification in release builds
    addOrUpdate('android.enableMinifyInReleaseBuilds', 'true');
    addOrUpdate('android.enableShrinkResourcesInReleaseBuilds', 'true');

    return config;
  });
}

function withSecurityXmlResources(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const xmlDir = join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');

      // Create main/res/xml if it does not exist
      fs.mkdirSync(xmlDir, { recursive: true });

      // 1. Create network_security_config.xml
      const networkConfigPath = join(xmlDir, 'network_security_config.xml');
      const networkConfigContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">elbooklets.com</domain>
        <domain includeSubdomains="true">u.expo.dev</domain>
        <domain includeSubdomains="true">firestore.googleapis.com</domain>
        <domain includeSubdomains="true">identitytoolkit.googleapis.com</domain>
    </domain-config>
</network-security-config>
`;
      fs.writeFileSync(networkConfigPath, networkConfigContent, 'utf8');

      // 2. Create file_system_provider_paths.xml (restrict Expo FileProvider directories)
      const providerPathsPath = join(xmlDir, 'file_system_provider_paths.xml');
      const providerPathsContent = `<?xml version="1.0" encoding="utf-8"?>
<paths>
    <files-path name="expo_files" path="downloads/"/>
    <files-path name="expo_cache" path="images/"/>
    <cache-path name="cached_expo_files" path="temp/"/>
</paths>
`;
      fs.writeFileSync(providerPathsPath, providerPathsContent, 'utf8');

      return mod;
    },
  ]);
}

module.exports = function withSecurityConfigs(config) {
  config = withSecurityManifest(config);
  config = withSecurityGradleProperties(config);
  config = withSecurityXmlResources(config);
  return config;
};
