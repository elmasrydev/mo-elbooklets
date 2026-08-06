import { Platform } from 'react-native';

/**
 * Per-platform switch for the in-app purchase surface, owned by the backend.
 *
 * The two platforms are separate booleans so one store can sell while the other
 * is hidden — the app never decides this for itself.
 */
export interface PaymentAccessFlags {
  ios: boolean;
  android: boolean;
}

export interface PaymentAccessResult {
  flags: PaymentAccessFlags;
  /** Pre-translated server note to show when the caller's platform is off. */
  message: string | null;
}

/**
 * Read the flag for the platform the app is actually running on. Anything that
 * is not an explicit `true` — a missing field, a null, an unexpected platform —
 * is off, so the purchase surface can only ever appear on a deliberate yes.
 */
export const flagForCurrentPlatform = (flags: PaymentAccessFlags | null | undefined): boolean => {
  if (!flags) return false;
  if (Platform.OS === 'ios') return flags.ios === true;
  if (Platform.OS === 'android') return flags.android === true;
  return false;
};

/**
 * Fetch the flags from the backend.
 *
 * Returns null when the answer is unknown for any reason — no field on this
 * backend yet, a network error, a malformed payload. The caller treats null as
 * "off", which is what keeps a failed lookup from revealing the purchase flow.
 *
 * The `isPaymentAllowed` query is not deployed yet. Once it is, this becomes a
 * generated-document call (add the operation to `src/graphql/payment.graphql`,
 * run `npm run codegen`, then query `IsPaymentAllowedDocument` here with
 * `fetchPolicy: 'network-only'` and map `status.ios` / `status.android` onto
 * `PaymentAccessFlags`). Everything downstream already reads through this
 * function, so no other file changes.
 */
export const fetchPaymentAccess = async (): Promise<PaymentAccessResult | null> => null;
