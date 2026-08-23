/**
 * Why a `startQuiz` call failed (contract: `mobile-trial-restrictions.md` §4).
 *
 * The mutation has two trial-related failure modes and the server tags neither
 * with an `extensions.code` — only the localized prose differs (verified on
 * PRS, en + ar). So the split is made on *structure*, never on the wording:
 *
 *   - a validation error on `lessonIds` ⇒ a locked lesson was submitted. Per
 *     the contract this means our lesson list is stale, so the caller refetches
 *     it rather than just apologising.
 *   - any other GraphQL error ⇒ show the server's (already translated) message
 *     as-is; the daily-quiz-limit refusal arrives this way and is meant to be
 *     displayed verbatim next to an upgrade CTA. Never auto-retry it.
 *   - anything else (transport, an empty payload) ⇒ the caller's own copy.
 */

import { serverMessageOf, validationMessageOf } from './graphqlErrors';

export type QuizStartFailure =
  | { kind: 'lockedLesson'; message: string }
  | { kind: 'server'; message: string }
  | { kind: 'unknown' };

export const classifyQuizStartError = (error: unknown): QuizStartFailure => {
  const lockedLesson = validationMessageOf(error, 'lessonIds');
  if (lockedLesson) return { kind: 'lockedLesson', message: lockedLesson };

  const message = serverMessageOf(error);
  if (message) return { kind: 'server', message };

  return { kind: 'unknown' };
};
