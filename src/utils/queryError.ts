/**
 * Decide whether a query failure should replace the screen with an error state.
 *
 * The Apollo client runs `errorPolicy: 'all'`, so a response can carry usable
 * data *and* field-level errors — the backend routinely returns a per-row
 * "Internal server error" for a field it can't resolve while the rest of the
 * payload is fine. Those must not blank out a screen that has something to
 * render (an empty list is a legitimate answer, not a failure); only a
 * response with no usable data is a real load failure.
 *
 * Returns the caller's own translated message rather than the server's, which
 * is untranslated and (with one error per row) can be dozens of lines long.
 */
export const loadFailureMessage = (
  data: unknown,
  error: unknown,
  message: string,
): string | null => {
  if (!error) return null;
  return data === undefined || data === null ? message : null;
};
