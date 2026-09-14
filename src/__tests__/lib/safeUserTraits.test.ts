import { pickSafeTraits } from '../../lib/safeUserTraits';

describe('pickSafeTraits', () => {
  // Regression (code review, 2026-09-14): builds up to v1.0.3 identified students with their
  // name, mobile and email, and Segment persisted those traits on the device. Once the Firebase
  // destination was switched on, every identify would have carried them to Firebase.
  it('keeps only grade, school system and subscription, so traits persisted by old builds never reach Firebase', () => {
    expect(
      pickSafeTraits({
        name: 'Mona Ali',
        mobile: '01000000000',
        email: 'mona@example.com',
        grade: 'Primary 5',
        is_subscribed: false,
      }),
    ).toEqual({ grade: 'Primary 5', is_subscribed: false });
  });

  it('drops empty traits, which the Firebase plugin would try to stringify', () => {
    expect(pickSafeTraits({ grade: null, educational_system: undefined })).toEqual({});
  });
});
