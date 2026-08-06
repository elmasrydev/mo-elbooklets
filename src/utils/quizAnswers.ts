/**
 * The in-progress answer model for a quiz attempt, plus the pure functions that
 * turn it into a submit payload and drive the "answered?" gating.
 *
 * The taking screen holds a `QuizDraft` in local state (keyed by top-level
 * question id). Match/paragraph questions cannot be represented by a single
 * string, so a draft entry is a discriminated union.
 *
 * The submit rule that governs everything here: the server expects EXACTLY ONE
 * entry per TOP-LEVEL question — paragraph children nest inside `subAnswers`,
 * never as extra top-level rows. `buildSubmitPayload` iterates the question
 * list (not the draft) so that invariant holds by construction, including for
 * unanswered and unknown-type questions.
 */

import type { QuestionAnswerInput } from '../generated/graphql';
import { isMatchType, isParagraphType, isSupportedType } from './quizQuestionTypes';

export type AnswerDraft =
  | { kind: 'text'; value: string } // mcq / true_false / descriptive
  | { kind: 'match'; pairs: Record<string, string> } // leftId -> rightId
  | { kind: 'paragraph'; children: Record<string, string> }; // childId -> answer text

export type QuizDraft = Record<string, AnswerDraft>;

/**
 * The minimal question shape these helpers need. Structurally compatible with
 * the generated `QuizQuery['quiz']['questions'][number]`, but declared loosely
 * so fixtures and tests don't have to build a full question.
 */
export type AnswerableQuestion = {
  id: string;
  type: string;
  matchPairs?: { left: { id: string }[] } | null;
  subQuestions?: { id: string }[] | null;
};

const textValue = (entry: AnswerDraft | undefined): string =>
  entry?.kind === 'text' ? entry.value : '';

const matchPairsOf = (entry: AnswerDraft | undefined): Record<string, string> =>
  entry?.kind === 'match' ? entry.pairs : {};

const childrenOf = (entry: AnswerDraft | undefined): Record<string, string> =>
  entry?.kind === 'paragraph' ? entry.children : {};

/**
 * Build the `answers` array for `submitQuizAnswers`: one entry per top-level
 * question, in question order.
 *
 * - text types → `selectedAnswer` (null when blank; unanswered still counts).
 * - match → `matchPairs`; a pairless match falls back to `selectedAnswer: null`
 *   so it still occupies its single top-level slot (the UI blocks this in
 *   practice by requiring every prompt paired before submit).
 * - paragraph → `subAnswers`, one per child (blank child → null), parent itself
 *   carries no `selectedAnswer`.
 * - unknown/future type → `selectedAnswer: null`, so the answer count still
 *   matches the question count and the unit simply scores 0.
 */
export function buildSubmitPayload(
  questions: AnswerableQuestion[],
  draft: QuizDraft,
): QuestionAnswerInput[] {
  return questions.map((question) => {
    const entry = draft[question.id];

    if (isMatchType(question.type)) {
      const matchPairs = Object.entries(matchPairsOf(entry)).map(([leftId, rightId]) => ({
        leftId,
        rightId,
      }));
      return matchPairs.length > 0
        ? { questionId: question.id, matchPairs }
        : { questionId: question.id, selectedAnswer: null };
    }

    if (isParagraphType(question.type)) {
      const children = childrenOf(entry);
      const subAnswers = (question.subQuestions ?? []).map((child) => {
        const value = children[child.id] ?? '';
        return { questionId: child.id, selectedAnswer: value.trim() === '' ? null : value };
      });
      return { questionId: question.id, subAnswers };
    }

    const value = textValue(entry);
    return { questionId: question.id, selectedAnswer: value.trim() === '' ? null : value };
  });
}

/**
 * Whether a single question is fully answered — drives the Next/Finish enabled
 * state. Matches the app's existing no-skip behaviour: match needs every prompt
 * paired, paragraph needs every child answered. An unknown/unsupported type is
 * treated as complete so the student is never trapped on a card they can't
 * answer (it will submit as null and score 0).
 */
export function isQuestionComplete(question: AnswerableQuestion, draft: QuizDraft): boolean {
  const entry = draft[question.id];

  if (isMatchType(question.type)) {
    const pairs = matchPairsOf(entry);
    const leftIds = question.matchPairs?.left.map((item) => item.id) ?? [];
    return leftIds.length > 0 && leftIds.every((id) => pairs[id] != null);
  }

  if (isParagraphType(question.type)) {
    const children = childrenOf(entry);
    const subs = question.subQuestions ?? [];
    return subs.length > 0 && subs.every((child) => (children[child.id] ?? '').trim() !== '');
  }

  if (isSupportedType(question.type)) {
    return textValue(entry).trim() !== '';
  }

  return true;
}

/** How many top-level questions are still unanswered — for the pre-submit warning. */
export function countIncompleteQuestions(
  questions: AnswerableQuestion[],
  draft: QuizDraft,
): number {
  return questions.filter((question) => !isQuestionComplete(question, draft)).length;
}
