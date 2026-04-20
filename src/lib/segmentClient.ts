import { createClient } from '@segment/analytics-react-native';
import { FirebasePlugin } from '@segment/analytics-react-native-plugin-firebase';

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

// Add Local Destinations (Plugins)
// This automatically forwards local events to Firebase Analytics natively
segmentClient.add({ plugin: new FirebasePlugin() });
