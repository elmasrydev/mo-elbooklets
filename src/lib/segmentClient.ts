import { createClient, Plugin, PluginType } from '@segment/analytics-react-native';
import analytics from '@react-native-firebase/analytics';

/**
 * Custom Local Firebase Plugin
 * Bypasses Segment's CDN integration settings check by running as an Enrichment plugin.
 * This guarantees execution locally for every tracked event regardless of remote settings.
 */
class LocalFirebasePlugin extends Plugin {
  type = PluginType.enrichment;

  execute(event: any) {
    try {
      if (event.type === 'track') {
        // Firebase event names must only contain alphanumeric characters and underscores,
        // and must start with an alphabetic character.
        let sanitizedName = event.event.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z]+/, ''); // Ensure starts with letter

        // Ensure length is <= 40
        const truncatedName = sanitizedName.substring(0, 40);

        if (__DEV__) {
          console.log(`🔥 [Firebase Analytics] LogEvent: ${truncatedName}`, event.properties);
        }
        analytics().logEvent(truncatedName, event.properties);
      } else if (event.type === 'identify') {
        if (event.userId) {
          if (__DEV__) {
            console.log(`🔥 [Firebase Analytics] SetUserId: ${event.userId}`);
          }
          analytics().setUserId(event.userId);
        }
        if (event.traits) {
          if (__DEV__) {
            console.log(`🔥 [Firebase Analytics] SetUserProperties:`, event.traits);
          }
          analytics().setUserProperties(event.traits);
        }
      } else if (event.type === 'screen') {
        if (event.name) {
          if (__DEV__) {
            console.log(`🔥 [Firebase Analytics] ScreenView: ${event.name}`);
          }
          analytics().logScreenView({
            screen_name: event.name,
            screen_class: event.name,
          });
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('⚠️ Firebase Analytics error in plugin:', err);
      }
    }
    return event;
  }

  reset() {
    try {
      if (__DEV__) {
        console.log(`🔥 [Firebase Analytics] Reset`);
      }
      analytics().resetAnalyticsData();
    } catch (err) {
      if (__DEV__) {
        console.warn('⚠️ Firebase Analytics error (reset):', err);
      }
    }
  }
}

/**
 * Segment Client Configuration (Local-Only Mode)
 * This client serves as a local event bus.
 * We have disabled the default Segment.io destination to avoid external dependencies.
 * All events are routed locally to our custom Firebase destination.
 */
export const segmentClient = createClient({
  // A writeKey is required to initialize the SDK, but with autoAddSegmentDestination: false,
  // no data is ever sent to Segment's servers.
  writeKey: 'mobile-elbooklets-local-key',

  // Disable the default cloud destination
  autoAddSegmentDestination: false,

  // Local event bus configuration
  trackAppLifecycleEvents: true,
  debug: __DEV__,

  // Simplified error handler since we aren't doing network requests to Segment anymore
  errorHandler: (error) => {
    if (__DEV__) {
      console.warn('⚠️ Segment SDK (Local):', error);
    }
  },
});

// Add our Local Firebase Destination
segmentClient.add({ plugin: new LocalFirebasePlugin() });
