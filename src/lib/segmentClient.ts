import {
  createClient,
  EventPlugin,
  IdentifyEventType,
  PluginType,
} from '@segment/analytics-react-native';
import { FirebasePlugin } from '@segment/analytics-react-native-plugin-firebase';

import { pickSafeTraits } from './safeUserTraits';

/**
 * Hands Firebase only the allowed user traits (`pickSafeTraits`). Segment
 * merges every identify with the traits it has persisted on the device, and
 * builds up to v1.0.3 persisted a student's name, mobile and email — without
 * this, switching the destination on would upload them on the next launch.
 */
class SafeTraitsPlugin extends EventPlugin {
  type = PluginType.enrichment;

  identify(event: IdentifyEventType) {
    return { ...event, traits: pickSafeTraits(event.traits) };
  }
}

const firebasePlugin = new FirebasePlugin();

/**
 * Segment Client Configuration (Local-Only Mode)
 * This client serves as a local event bus.
 * We have disabled the default Segment.io destination to avoid external dependencies.
 * All events are routed locally to plugins like Firebase.
 */
export const segmentClient = createClient({
  // A writeKey is required to initialize the SDK, but with autoAddSegmentDestination: false,
  // no data is ever sent to Segment's servers.
  writeKey: 'mobile-elbooklets-local-key',

  // Disable the default cloud destination
  autoAddSegmentDestination: false,

  // Segment only runs a destination plugin whose key is in its settings, and
  // settings normally come from Segment's CDN. This writeKey is a placeholder
  // the CDN answers with a 404, so the SDK falls back to `defaultSettings` —
  // without the Firebase entry here not one screen or event reached Firebase
  // (verified on the simulator, 2026-09-14).
  defaultSettings: { integrations: { [firebasePlugin.key]: {} } },

  // Off: Firebase records app opens, sessions and updates itself, so Segment's
  // "Application Opened/Backgrounded" events would only duplicate them in
  // every Crashlytics breadcrumb trail.
  trackAppLifecycleEvents: false,
  debug: __DEV__,

  // Simplified error handler since we aren't doing network requests to Segment anymore
  errorHandler: (error) => {
    if (__DEV__) {
      console.warn('⚠️ Segment SDK (Local):', error);
    }
  },
});

// Add Local Destinations (Plugins)
// This automatically forwards local events to Firebase Analytics natively
segmentClient.add({ plugin: firebasePlugin });
// Inside the Firebase destination only: what Firebase receives is filtered,
// whatever Segment keeps on the device.
firebasePlugin.add(new SafeTraitsPlugin());
