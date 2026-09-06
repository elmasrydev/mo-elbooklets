/**
 * A parent's mobile-verification state is a THREE-way value, not a boolean.
 *
 * `ParentUser.mobile_verified_at` is:
 *   - a timestamp → confirmed via WhatsApp
 *   - exactly `null` → the server saying "not verified"
 *   - `undefined`   → the record predates the verification gate and is being
 *                     backfilled; the server has not told us either way
 *
 * Collapsing that to `!!mobile_verified_at` is what makes the difference matter:
 * `AppNavigator` deliberately gates on **`null` only**, so that an upgrade does
 * not lock out every already-verified parent whose record has not been
 * backfilled yet. UI has to respect the same distinction — telling an `unknown`
 * parent they are "Verified" would be a lie, and offering them a "Verify" button
 * would route nowhere, because the gate that renders the OTP screen never fires
 * for `undefined`.
 *
 * Shared so the gate and the profile UI can never drift apart.
 */
export type ParentVerificationState = 'verified' | 'unverified' | 'unknown';

export const parentVerificationState = (
  mobileVerifiedAt?: string | null,
): ParentVerificationState => {
  if (mobileVerifiedAt === undefined) return 'unknown';
  return mobileVerifiedAt ? 'verified' : 'unverified';
};
