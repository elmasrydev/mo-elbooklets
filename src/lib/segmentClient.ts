import { createClient } from '@segment/analytics-react-native';
import { FirebasePlugin } from '@segment/analytics-react-native-plugin-firebase';

/**
 * Segment Client Configuration
 * This client serves as the unified event bus for the application.
 * Destinations like Firebase are added as plugins.
 */
export const segmentClient = createClient({
  // Use environment variable for the write key, or a placeholder for development
  writeKey: 'YOUR_SEGMENT_WRITE_KEY', // Replace with your actual Segment Write Key
  trackAppLifecycleEvents: true,
  debug: __DEV__,
});

// Add the Firebase destination plugin
// This automatically forwards Segment events to Firebase Analytics
segmentClient.add({ plugin: new FirebasePlugin() });
