/**
 * Single source of truth for quiz question `type` values and the guards that
 * branch on them. `Question.type` is a backend string (not a GraphQL enum), so
 * the app pins the known values here and every screen imports these helpers
 * instead of re-inlining string literals.
 *
 * `image` is deliberately NOT a type — an image is an attachment (`imageUrl`)
 * that can hang off a question of any type, so it is checked independently.
 */

export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  WHAT_HAPPENS: 'what_happens',
  GIVE_A_REASON: 'give_a_reason',
  MATCH: 'match',
  PARAGRAPH: 'paragraph',
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

/** AI-graded free-text answers, scored 0.0–1.0. */
const DESCRIPTIVE_SET = new Set<string>([
  QUESTION_TYPES.WHAT_HAPPENS,
  QUESTION_TYPES.GIVE_A_REASON,
]);

/** Pick-one-of-`answers` types that render as option cards. */
const CHOICE_SET = new Set<string>([QUESTION_TYPES.MCQ, QUESTION_TYPES.TRUE_FALSE]);

const SUPPORTED_SET = new Set<string>(Object.values(QUESTION_TYPES));

export const isDescriptiveType = (type: string): boolean => DESCRIPTIVE_SET.has(type);
export const isChoiceType = (type: string): boolean => CHOICE_SET.has(type);
export const isMatchType = (type: string): boolean => type === QUESTION_TYPES.MATCH;
export const isParagraphType = (type: string): boolean => type === QUESTION_TYPES.PARAGRAPH;

/**
 * Whether the client knows how to render/answer this type. An unknown value
 * (a newer type shipped by the backend before the app updates) is handled with
 * a visible fallback rather than a crash or a silently-wrong render.
 */
export const isSupportedType = (type: string): boolean => SUPPORTED_SET.has(type);
