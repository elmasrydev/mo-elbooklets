/**
 * Turns the FLAT `quizResults.userAnswers` list back into the grouped shape the
 * review screen renders. The server returns one row per scored *unit*:
 *
 *   - mcq / true_false / descriptive / match  → one standalone row
 *   - paragraph                               → N rows (one per child; the
 *                                               parent has NO row of its own),
 *                                               each carrying `parent_question_id`
 *
 * so the review screen must regroup children under their passage. It also
 * resolves match rows (`match_results` + `matchColumns`) into per-pair review
 * data, since a match answer has no single `selected_answer`.
 */

import type { QuizReviewQuery } from '../generated/graphql';

export type ReviewUserAnswer = QuizReviewQuery['quizResults']['userAnswers'][number];
type MatchColumns = NonNullable<ReviewUserAnswer['question']['matchColumns']>;
type MatchColumnItem = MatchColumns['left'][number];
type MatchResult = NonNullable<ReviewUserAnswer['match_results']>[number];

export type ResultGroup =
  | { kind: 'single'; row: ReviewUserAnswer }
  | { kind: 'paragraph'; parentId: string; passage: string; children: ReviewUserAnswer[] };

/**
 * Group rows in their original order. Standalone rows become `single` groups;
 * paragraph children are collected under one `paragraph` group created at the
 * position of the first child. Tolerant of legacy responses (no
 * `parent_question_id` on any row) — every row is then a `single`.
 */
export function groupUserAnswers(rows: ReviewUserAnswer[]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  const byParent = new Map<string, Extract<ResultGroup, { kind: 'paragraph' }>>();

  for (const row of rows) {
    const parentId = row.parent_question_id;
    if (!parentId) {
      groups.push({ kind: 'single', row });
      continue;
    }

    let group = byParent.get(parentId);
    if (!group) {
      group = {
        kind: 'paragraph',
        parentId,
        passage: row.question.parent?.question ?? '',
        children: [],
      };
      byParent.set(parentId, group);
      groups.push(group);
    }
    group.children.push(row);
  }

  return groups;
}

export type AlignedPair = { left: MatchColumnItem; right: MatchColumnItem };

/**
 * The correct pairing for a match question. Results return `matchColumns`
 * UNSHUFFLED and index-aligned, so `left[i]` pairs with `right[i]`.
 */
export function alignedMatchPairs(columns: MatchColumns | null | undefined): AlignedPair[] {
  if (!columns) return [];
  const count = Math.min(columns.left.length, columns.right.length);
  const pairs: AlignedPair[] = [];
  for (let i = 0; i < count; i++) {
    pairs.push({ left: columns.left[i], right: columns.right[i] });
  }
  return pairs;
}

export type MatchReviewRow = {
  leftId: string;
  leftText: string;
  chosenRightId: string | null;
  chosenRightText: string | null;
  correctRightId: string | null;
  correctRightText: string | null;
  isCorrect: boolean;
};

/**
 * One review row per left item: the student's chosen right (from
 * `match_results`) and the correct right (index-aligned in `matchColumns`),
 * both resolved to text. Drives the per-pair ✓/✗ list in the match review card.
 */
export function buildMatchReviewRows(
  matchResults: MatchResult[] | null | undefined,
  columns: MatchColumns | null | undefined,
): MatchReviewRow[] {
  if (!columns) return [];
  const rightById = new Map(columns.right.map((item) => [item.id, item]));
  const resultByLeft = new Map((matchResults ?? []).map((result) => [result.leftId, result]));

  return columns.left.map((left, index) => {
    const result = resultByLeft.get(left.id);
    const chosenRight = result ? (rightById.get(result.rightId) ?? null) : null;
    const correctRight = columns.right[index] ?? null;
    return {
      leftId: left.id,
      leftText: left.text,
      chosenRightId: result?.rightId ?? null,
      chosenRightText: chosenRight?.text ?? null,
      correctRightId: correctRight?.id ?? null,
      correctRightText: correctRight?.text ?? null,
      isCorrect: result?.isCorrect ?? false,
    };
  });
}

export type SwappedPair = { a: number; b: number }; // 0-based left indices

/**
 * Detects pairs of left items whose answers were exchanged: item A got item B's
 * correct right and vice-versa, both wrong. Powers the "you swapped items X and
 * Y" insight. Returns 0-based indices; the caller shows them 1-based.
 */
export function findSwappedPairs(
  matchResults: MatchResult[] | null | undefined,
  columns: MatchColumns | null | undefined,
): SwappedPair[] {
  if (!columns) return [];
  const chosenByLeft = new Map(
    (matchResults ?? []).map((result) => [result.leftId, result.rightId]),
  );
  const lefts = columns.left;
  const correctRightId = (index: number): string | null => columns.right[index]?.id ?? null;
  const chosenRightId = (index: number): string | null => chosenByLeft.get(lefts[index].id) ?? null;

  const swaps: SwappedPair[] = [];
  for (let i = 0; i < lefts.length; i++) {
    for (let j = i + 1; j < lefts.length; j++) {
      const correctI = correctRightId(i);
      const correctJ = correctRightId(j);
      const chosenI = chosenRightId(i);
      const chosenJ = chosenRightId(j);
      if (
        chosenI != null &&
        chosenJ != null &&
        chosenI !== correctI &&
        chosenI === correctJ &&
        chosenJ === correctI
      ) {
        swaps.push({ a: i, b: j });
      }
    }
  }
  return swaps;
}
