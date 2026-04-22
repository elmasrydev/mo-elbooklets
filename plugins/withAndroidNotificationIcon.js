const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const { resolve, join } = require('path');
const fs = require('fs');

/**
 * Expo Config Plugin to:
 * 1. Set the default FCM notification small icon to @drawable/ic_notification
 * 2. Set the default notification color to the app's primary blue
 * 3. Copy ic_notification.png icons into the Android drawable folders
 * 4. Add the notification_icon_color to colors.xml
 *
 * This ensures that `expo prebuild --clean` always produces the correct
 * notification icon configuration.
 */

const DENSITY_MAP = {
  mdpi: 'drawable-mdpi',
  hdpi: 'drawable-hdpi',
  xhdpi: 'drawable-xhdpi',
  xxhdpi: 'drawable-xxhdpi',
  xxxhdpi: 'drawable-xxxhdpi',
};

function withNotificationIconFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const resDir = join(projectRoot, 'android', 'app', 'src', 'main', 'res');

      // Copy notification icons from assets/notification-icon/ to drawable-*
      for (const [density, folder] of Object.entries(DENSITY_MAP)) {
        const src = join(projectRoot, 'assets', 'notification-icon', `ic_notification_${density}.png`);
        const destDir = join(resDir, folder);
        const dest = join(destDir, 'ic_notification.png');

        if (fs.existsSync(src)) {
          fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(src, dest);
        }
      }

      // Add notification_icon_color to colors.xml
      const colorsPath = join(resDir, 'values', 'colors.xml');
      if (fs.existsSync(colorsPath)) {
        let content = fs.readFileSync(colorsPath, 'utf-8');
        if (!content.includes('notification_icon_color')) {
          content = content.replace(
            '</resources>',
            '  <color name="notification_icon_color">#1E40AF</color>\n</resources>'
          );
          fs.writeFileSync(colorsPath, content, 'utf-8');
        }
      }

      return mod;
    },
  ]);
}

module.exports = function withAndroidNotificationIcon(config) {
  // 1. Modify AndroidManifest.xml to add the meta-data entries
  config = withAndroidManifest(config, (mod) => {
    // Add tools namespace for manifest merger overrides
    if (!mod.modResults.manifest.$['xmlns:tools']) {
      mod.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const mainApp = mod.modResults.manifest.application?.[0];
    if (!mainApp) return mod;

    // Ensure meta-data array exists
    if (!mainApp['meta-data']) {
      mainApp['meta-data'] = [];
    }

    const metaData = mainApp['meta-data'];

    // Add default notification icon if not present
    const iconKey = 'com.google.firebase.messaging.default_notification_icon';
    if (!metaData.find((m) => m.$?.['android:name'] === iconKey)) {
      metaData.push({
        $: {
          'android:name': iconKey,
          'android:resource': '@drawable/ic_notification',
        },
      });
    }

    // Add default notification color if not present
    const colorKey = 'com.google.firebase.messaging.default_notification_color';
    if (!metaData.find((m) => m.$?.['android:name'] === colorKey)) {
      metaData.push({
        $: {
          'android:name': colorKey,
          'android:resource': '@color/notification_icon_color',
          'tools:replace': 'android:resource',
        },
      });
    }

    return mod;
  });

  // 2. Copy icon files and add color resource
  config = withNotificationIconFiles(config);

  return config;
};
