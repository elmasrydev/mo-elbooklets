import { parentVerificationState } from '../../utils/parentVerification';

describe('parentVerificationState', () => {
  it('reports verified for a real timestamp', () => {
    expect(parentVerificationState('2026-08-10T12:00:00Z')).toBe('verified');
  });

  it('reports unverified only for an explicit null', () => {
    expect(parentVerificationState(null)).toBe('unverified');
  });

  // The distinction the whole helper exists for: an un-backfilled record must
  // not be treated as "not verified", or an upgrade locks out every parent who
  // already verified — which is why AppNavigator's gate fires on `null` alone.
  it('reports unknown for a record the server has not backfilled', () => {
    expect(parentVerificationState(undefined)).toBe('unknown');
    expect(parentVerificationState()).toBe('unknown');
  });

  it('never returns verified for an empty timestamp', () => {
    expect(parentVerificationState('')).toBe('unverified');
  });
});
