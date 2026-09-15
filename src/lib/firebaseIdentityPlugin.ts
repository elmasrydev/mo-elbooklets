import { EventPlugin, IdentifyEventType, PluginType } from '@segment/analytics-react-native';
import { getAnalytics, resetAnalyticsData, setUserId } from '@react-native-firebase/analytics';

import { logError } from '../utils/logger';
import { pickSafeTraits } from './safeUserTraits';

/** The account analytics currently belongs to; `null` while signed out. */
let signedInUserId: string | null = null;

/** Called by `analytics.identify` and `analytics.reset`. */
export const setSignedInUser = (userId: string | null): void => {
  signedInUserId = userId;
};

/**
 * Runs inside Segment's Firebase destination and shapes every identify before
 * Firebase sees it:
 * - Drops an identify for anyone but the signed-in account. Segment holds
 *   events until its settings load, so a sign-out in that window was followed
 *   by the replay of the student's queued identify — re-attaching them, and
 *   tracking the next person on the device (often a parent) as the student.
 * - Cuts the traits down to `pickSafeTraits`: Segment merges every identify
 *   with the traits it persisted, and builds up to v1.0.3 persisted a
 *   student's name, mobile and email.
 */
export class FirebaseIdentityPlugin extends EventPlugin {
  type = PluginType.enrichment;

  identify(event: IdentifyEventType) {
    if (event.userId !== signedInUserId) return undefined;
    return { ...event, traits: pickSafeTraits(event.traits) };
  }
}

/**
 * Clears Firebase's user id and analytics data directly. Segment forwards a
 * reset only to destinations it has already added, and until its settings load
 * the Firebase one is not — a sign-out then would leave Firebase tracking under
 * the student's id.
 */
export const clearFirebaseIdentity = (): void => {
  const firebase = getAnalytics();
  Promise.all([setUserId(firebase, null), resetAnalyticsData(firebase)]).catch((error) =>
    logError('[Analytics] Could not clear the Firebase identity', error),
  );
};
