import type { IdentifyEventType } from '@segment/analytics-react-native';

import { FirebaseIdentityPlugin, setSignedInUser } from '../../lib/firebaseIdentityPlugin';

const identify = (userId: string, traits: Record<string, unknown> = {}) =>
  ({ type: 'identify', userId, traits }) as unknown as IdentifyEventType;

describe('FirebaseIdentityPlugin', () => {
  const plugin = new FirebaseIdentityPlugin();

  afterEach(() => {
    setSignedInUser(null);
  });

  it('passes the signed-in account on to Firebase with only the allowed traits', () => {
    setSignedInUser('7');
    const forwarded = plugin.identify(identify('7', { grade: 'Primary 5', mobile: '01000000000' }));
    expect(forwarded?.userId).toBe('7');
    expect(forwarded?.traits).toEqual({ grade: 'Primary 5' });
  });

  // Regression (code review, 2026-09-15): a sign-out before Segment loaded its settings was
  // followed by the replay of the student's queued identify, re-attaching them in Firebase.
  it('drops an identify for anyone but the signed-in account, such as one replayed after a sign-out', () => {
    setSignedInUser(null);
    expect(plugin.identify(identify('7'))).toBeUndefined();
  });
});
