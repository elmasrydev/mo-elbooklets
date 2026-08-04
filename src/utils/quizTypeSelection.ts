/**
 * Question-type selection rules for the quiz setup screen.
 *
 * The contract lives in `mobile-quiz-question-type-selection.md`. The parts that
 * matter here:
 *
 * - Only the types `lessonQuestionTypes` returns may be offered. A type with no
 *   questions is omitted from the response entirely, never returned as `count: 0`.
 * - A custom selection needs at least `minSelectedTypes` types (read from the
 *   response, never hardcoded). Selecting *every* type means "no restriction",
 *   which is the default — send no `questionTypes` argument at all.
 * - "No restriction" is `null`, never an empty array. The two are different
 *   intents: `null` is "surprise me", `[]` is a student who unchecked every box
 *   and must be told to pick some, not silently handed the full random mix.
 * - Before starting, the questions available across the selected types must
 *   cover the chosen quiz size, or the student is told by how much they fall
 *   short rather than meeting a server error after tapping Start.
 */

export interface QuestionTypeOption {
  /** Value to send back in `startQuiz(questionTypes:)`. */
  type: string;
  /** Localised, ready to display. */
  label: string;
  /** Questions available for this type across the chosen lessons. */
  count: number;
}

/**
 * What the student has chosen: `null` for the default mix (no restriction), or
 * an explicit list — which may be empty while they are mid-selection.
 */
export type TypeSelection = string[] | null;

/**
 * The picker is pointless when there is nothing to choose between: with fewer
 * options than a custom selection needs, any selection would be rejected.
 */
export const canOfferTypePicker = (
  options: QuestionTypeOption[],
  minSelectedTypes: number,
): boolean => options.length >= minSelectedTypes && minSelectedTypes > 0;

/** Questions the student can draw on, given what they have selected. */
export const availableForSelection = (selected: string[], options: QuestionTypeOption[]): number =>
  options.reduce((sum, option) => (selected.includes(option.type) ? sum + option.count : sum), 0);

/**
 * True when the selection imposes no restriction — no explicit list at all, or
 * every available type selected. Both mean "surprise me", which is the default.
 * An *emptied* list is deliberately NOT default; see the file header.
 */
export const isDefaultSelection = (
  selection: TypeSelection,
  options: QuestionTypeOption[],
): boolean => selection === null || selection.length >= options.length;

/**
 * The `questionTypes` argument for `startQuiz`, or `undefined` to omit it.
 *
 * Sending every type is equivalent to omitting the argument, so the default mix
 * is expressed by omission — same result, and it keeps the quiz's stored
 * selection meaningful.
 */
export const questionTypesArgument = (
  selection: TypeSelection,
  options: QuestionTypeOption[],
): string[] | undefined => {
  if (selection === null || options.length === 0) return undefined;
  // Order does not matter and duplicates are ignored, but only known values are
  // accepted — filter against what the server actually offered.
  const chosen = options
    .filter((option) => selection.includes(option.type))
    .map((option) => option.type);
  // An empty or complete list both mean "no restriction" to the server, which is
  // the default — express that by omitting the argument.
  return chosen.length === 0 || chosen.length >= options.length ? undefined : chosen;
};

export interface SelectionStatus {
  /** False when Start must stay disabled. */
  canStart: boolean;
  /** True when fewer than `minSelectedTypes` types are selected. */
  tooFewTypes: boolean;
  /** How many more questions the selection needs; 0 when it is sufficient. */
  shortfall: number;
  /** Questions the selection can draw on. */
  available: number;
}

/**
 * Decides whether the student may start, and why not when they may not.
 *
 * `total` covers the default mix: with no restriction the quiz draws on every
 * type, so the availability check runs against the whole pool rather than the
 * (empty) selection.
 */
export const evaluateSelection = ({
  selected,
  options,
  minSelectedTypes,
  total,
  neededQuestions,
}: {
  selected: TypeSelection;
  options: QuestionTypeOption[];
  minSelectedTypes: number;
  total: number;
  neededQuestions: number;
}): SelectionStatus => {
  const isDefault = isDefaultSelection(selected, options);
  const available = isDefault ? total : availableForSelection(selected ?? [], options);

  // A custom selection below the minimum is rejected server-side. `null` is the
  // default mix, which imposes no minimum.
  const tooFewTypes = !isDefault && (selected?.length ?? 0) < minSelectedTypes;
  const shortfall = Math.max(0, neededQuestions - available);

  return {
    canStart: !tooFewTypes && shortfall === 0,
    tooFewTypes,
    shortfall,
    available,
  };
};

/**
 * Drops types that the latest `lessonQuestionTypes` response no longer offers,
 * so a stale selection cannot survive a lesson change and be rejected.
 */
export const pruneSelection = (
  selection: TypeSelection,
  options: QuestionTypeOption[],
): TypeSelection =>
  selection === null
    ? null
    : selection.filter((type) => options.some((option) => option.type === type));
