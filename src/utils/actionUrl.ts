/**
 * Extracts a user/student id from a backend `action_url` so notifications that
 * point at a person (e.g. `new_follower`) can deep-link to that user's profile.
 *
 * The id may appear as:
 *  - a query param: `?userId=123`, `&user_id=123`, `?student_id=...`, `?id=...`
 *  - a trailing path segment that looks like an id: `/students/123`,
 *    `/profile/3f25...` — numeric or UUID only, so non-id tails like
 *    `/profile/edit` are ignored.
 *
 * Returns null when no id can be confidently parsed; callers should fall back
 * (e.g. open the Community tab) rather than navigate to a broken profile.
 */
export const extractUserIdFromActionUrl = (actionUrl?: string | null): string | null => {
  if (!actionUrl) return null;
  const raw = actionUrl.trim();
  if (!raw) return null;

  // 1) Query param carrying the id (userId / user_id / studentId / student_id / id).
  const queryMatch = raw.match(/[?&](?:user_?id|student_?id|id)=([^&#/]+)/i);
  if (queryMatch?.[1]) {
    const value = decodeURIComponent(queryMatch[1]).trim();
    if (value) return value;
  }

  // 2) Trailing id-like path segment (numeric or UUID). Drop query/hash first.
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, '');
  const lastSegment = path.substring(path.lastIndexOf('/') + 1);
  const isNumeric = /^\d+$/.test(lastSegment);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    lastSegment,
  );
  if (lastSegment && (isNumeric || isUuid)) return lastSegment;

  return null;
};
