import { getAnalytics, resetAnalyticsData, setUserId } from '@react-native-firebase/analytics';

import { analytics } from '../../lib/analytics';

describe('analytics.reset', () => {
  // Segment's own reset is not enough (see clearFirebaseIdentity): its Firebase destination never
  // clears the user id, so the next person on the device would be tracked as the student.
  it("clears Firebase's user id and analytics data itself on every sign-out", () => {
    analytics.reset();
    expect(setUserId).toHaveBeenCalledWith(getAnalytics(), null);
    expect(resetAnalyticsData).toHaveBeenCalledWith(getAnalytics());
  });
});
