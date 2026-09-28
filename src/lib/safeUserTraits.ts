import type { UserTraits } from '@segment/analytics-react-native';

/**
 * The only user traits allowed to leave the device.
 *
 * PRIVACY RULE — this app's users are minors. Traits become Firebase *user
 * properties*, which are readable by anyone with console access and which
 * Google's own terms forbid from carrying PII. `userId` is the account id, a
 * pseudonymous key that already ties every session to the account, so nothing
 * identifying needs to travel alongside it.
 *
 * NEVER widen this type with name, email, mobile, school, gender or address.
 */
export interface SafeUserTraits {
  grade?: string;
  educational_system?: string;
  is_subscribed?: boolean;
}

const SAFE_TRAIT_KEYS: ReadonlyArray<keyof SafeUserTraits> = [
  'grade',
  'educational_system',
  'is_subscribed',
];

/**
 * Keeps only the {@link SafeUserTraits}, dropping empty ones.
 *
 * Applied where traits leave for Firebase, not only at the call sites: Segment
 * merges every identify with the traits it has persisted on the device, and
 * builds up to v1.0.3 persisted a student's name, mobile and email. Empty
 * values go too, because Segment's Firebase plugin calls `toString()` on each.
 */
export const pickSafeTraits = (traits: UserTraits = {}): UserTraits => {
  const safe: UserTraits = {};
  for (const key of SAFE_TRAIT_KEYS) {
    const value = traits[key];
    if (value !== undefined && value !== null) safe[key] = value;
  }
  return safe;
};
