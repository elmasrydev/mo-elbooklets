/**
 * Shared logic for the "Can't find it? Add <typed>" row in SearchablePickerModal.
 *
 * Kept as a pure function (no React) so it can be unit-tested directly instead of
 * through a mock-heavy component render.
 */

type NamedItem = { name?: unknown; name_ar?: unknown; name_en?: unknown };

const MIN_ADD_LENGTH = 2;

/** True when `value` equals any of the item's name fields, case-insensitively. */
const matchesName = (item: NamedItem, value: string): boolean =>
  [item?.name, item?.name_ar, item?.name_en].some(
    (n) => typeof n === 'string' && n.trim().toLowerCase() === value,
  );

/**
 * Whether to offer an "add your own" row for the currently typed text.
 *
 * Offer it only when the user has typed something meaningful (>= 2 chars after
 * trimming) AND no existing option already has that exact name — so we never
 * invite the user to create a duplicate of a row that's already in the list.
 */
export const shouldOfferAddNew = (data: NamedItem[], typed: string): boolean => {
  const trimmed = typed.trim();
  if (trimmed.length < MIN_ADD_LENGTH) return false;
  const needle = trimmed.toLowerCase();
  return !data.some((item) => matchesName(item, needle));
};
