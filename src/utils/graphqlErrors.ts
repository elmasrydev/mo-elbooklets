/**
 * Shared reading of thrown GraphQL failures (pure — no Apollo import, so these
 * helpers stay unit-testable and usable from non-React modules too).
 *
 * Apollo 4 delivers server-side failures as a thrown `CombinedGraphQLErrors`
 * whose `errors` array holds the raw `{ message, extensions }` entries. That
 * shape is matched structurally rather than with `CombinedGraphQLErrors.is()`
 * so the module can be exercised with plain objects, and so the raw-fetch path
 * (`src/services/bokiApi.ts`), which throws its own shapes, is covered too.
 */

export interface GraphQLErrorLike {
  message?: string | null;
  /**
   * Present on errors raised while *executing* a field. Errors from the
   * validation phase — an unknown field, a malformed document — never carry
   * one, which is the only structural way to tell "this server rejected our
   * query" from "this server ran our query and it failed".
   */
  path?: readonly (string | number)[] | null;
  extensions?: {
    validation?: Record<string, string[] | undefined | null> | null;
  } | null;
}

/** Anything that failed *before* the server answered — not a domain error. */
const TRANSPORT_MESSAGE = /network|timeout|abort|failed to fetch/i;

const isErrorArray = (value: unknown): value is GraphQLErrorLike[] =>
  Array.isArray(value) && value.every((entry) => !!entry && typeof entry === 'object');

/** The GraphQL errors carried by a thrown value, or `[]` when it carries none. */
export const graphqlErrorsOf = (error: unknown): GraphQLErrorLike[] => {
  if (!error || typeof error !== 'object') return [];
  const { errors, graphQLErrors } = error as {
    errors?: unknown;
    graphQLErrors?: unknown;
  };
  if (isErrorArray(errors)) return errors;
  if (isErrorArray(graphQLErrors)) return graphQLErrors;
  return [];
};

/**
 * The server's own message for a failed operation. Backend messages arrive
 * already translated to the request's `lang` header, so callers display them
 * verbatim instead of mapping them onto a bundled string.
 */
export const serverMessageOf = (error: unknown): string | undefined => {
  const message = graphqlErrorsOf(error).find((entry) => !!entry.message?.trim())?.message;
  return message?.trim() || undefined;
};

/**
 * The first message a validation error reported for one input field —
 * e.g. `lessonIds` on `startQuiz`, `mobile` on `login`.
 */
export const validationMessageOf = (error: unknown, field: string): string | undefined => {
  for (const entry of graphqlErrorsOf(error)) {
    const message = entry.extensions?.validation?.[field]?.find((text) => !!text?.trim());
    if (message) return message.trim();
  }
  return undefined;
};

/**
 * The first field-level validation message, whichever field carried it.
 *
 * Lighthouse reports the useful sentence per input field and is free to put a
 * generic "Validation failed for the field [login]." at the top level — PRS
 * currently repeats the specific text in both places, but the backend contract
 * documents the generic form, so the field-level copy is the one to trust.
 */
export const anyValidationMessageOf = (error: unknown): string | undefined => {
  for (const entry of graphqlErrorsOf(error)) {
    for (const messages of Object.values(entry.extensions?.validation ?? {})) {
      const message = messages?.find((text) => !!text?.trim());
      if (message) return message.trim();
    }
  }
  return undefined;
};

/**
 * True when the server refused the *document* rather than failing while
 * running it — the signature of selecting a field this backend hasn't
 * deployed. Validation-phase errors carry no `path` (verified against PRS and
 * production); execution errors always do. Retrying a rejected document is
 * pointless, so callers use this to stop asking.
 */
export const isDocumentRejection = (error: unknown): boolean => {
  const errors = graphqlErrorsOf(error);
  return errors.length > 0 && errors.every((entry) => !entry.path);
};

/**
 * True when the request never reached the server (or its answer never arrived).
 * A response that carries GraphQL errors is by definition not a transport
 * failure, however its message reads.
 */
export const isTransportError = (error: unknown): boolean => {
  if (graphqlErrorsOf(error).length > 0) return false;
  const message = error instanceof Error ? error.message : '';
  return TRANSPORT_MESSAGE.test(message);
};
