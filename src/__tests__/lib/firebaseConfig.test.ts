import { readFileSync } from 'fs';
import { resolve } from 'path';

import firebaseJson from '../../../firebase.json';

// The schema React Native Firebase publishes for firebase.json — read from disk,
// since the package's `exports` map does not expose it to `import`.
const schema = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../node_modules/@react-native-firebase/app/firebase-schema.json'),
    'utf8',
  ),
);
const knownKeys = Object.keys(schema.properties['react-native'].properties);
const settings = firebaseJson['react-native'];

describe('firebase.json', () => {
  // Regression (2026-09-14): `analytics_automatic_screen_reporting_enabled`, missing its
  // `google_` prefix, was silently ignored, so Firebase kept logging native view-controller
  // names (RNSScreen, RCTFabricModalHostViewController) as the student's screens.
  it('uses only keys React Native Firebase reads, since a misspelt key is ignored without a warning', () => {
    expect(Object.keys(settings).filter((key) => !knownKeys.includes(key))).toEqual([]);
  });

  it('keeps Crashlytics and Analytics collecting in every build, with screen names left to the navigator', () => {
    expect(settings).toMatchObject({
      crashlytics_auto_collection_enabled: true,
      crashlytics_debug_enabled: true,
      analytics_auto_collection_enabled: true,
      google_analytics_automatic_screen_reporting_enabled: false,
    });
  });
});
