/**
 * Shared logic for the "Can't find it? Add <typed>" row in SearchablePickerModal.
 *
 * Kept as a pure function (no React) so it can be unit-tested directly instead of
 * through a mock-heavy component render.
 */

import { isValidPlaceName, PLACE_NAME_MIN_LENGTH } from './validators';

type NamedItem = { name?: unknown; name_ar?: unknown; name_en?: unknown };

/** True when `value` equals any of the item's name fields, case-insensitively. */
const matchesName = (item: NamedItem, value: string): boolean =>
  [item?.name, item?.name_ar, item?.name_en].some(
    (n) => typeof n === 'string' && n.trim().toLowerCase() === value,
  );

const hasExactMatch = (data: NamedItem[], typed: string): boolean => {
  const needle = typed.trim().toLowerCase();
  return data.some((item) => matchesName(item, needle));
};

/**
 * Whether to offer an "add your own" row for the currently typed text.
 *
 * Offer it only when the typed text is a valid name (BKLT-318 — this string
 * gets persisted to a shared table other users will see) AND no existing option
 * already has that exact name, so we never invite the user to create a
 * duplicate of a row that's already in the list.
 */
export const shouldOfferAddNew = (data: NamedItem[], typed: string): boolean =>
  isValidPlaceName(typed) && !hasExactMatch(data, typed);

/**
 * Whether to explain *why* the add row is missing. The search box itself is not
 * filtered — the user must be able to type anything to find an existing entry —
 * so without this the add row would just silently fail to appear for input like
 * "Cairo<script>".
 */
export const shouldWarnInvalidName = (data: NamedItem[], typed: string): boolean =>
  typed.trim().length >= PLACE_NAME_MIN_LENGTH &&
  !isValidPlaceName(typed) &&
  !hasExactMatch(data, typed);
