import {
  buildSubmitPayload,
  isQuestionComplete,
  countIncompleteQuestions,
  type AnswerableQuestion,
  type QuizDraft,
} from '../../utils/quizAnswers';

// Questions mirror the backend contract doc's worked example: an mcq, an image
// true_false, a 3-pair match, and a paragraph with 2 children. Five scored
// units, but only FOUR top-level questions — so a correct payload has exactly
// four entries.
const questions: AnswerableQuestion[] = [
  { id: '15380', type: 'mcq' },
  { id: '15391', type: 'true_false' },
  { id: '15403', type: 'match', matchPairs: { left: [{ id: 'L0' }, { id: 'L1' }, { id: 'L2' }] } },
  { id: '15397', type: 'paragraph', subQuestions: [{ id: '15398' }, { id: '15399' }] },
];

const fullDraft: QuizDraft = {
  '15380': { kind: 'text', value: 'Photosynthesis' },
  '15391': { kind: 'text', value: 'True' },
  '15403': { kind: 'match', pairs: { L0: 'R2', L1: 'R1', L2: 'R0' } },
  '15397': { kind: 'paragraph', children: { '15398': 'Increases', '15399': 'False' } },
};

describe('buildSubmitPayload', () => {
  it('reproduces the contract example payload verbatim', () => {
    expect(buildSubmitPayload(questions, fullDraft)).toEqual([
      { questionId: '15380', selectedAnswer: 'Photosynthesis' },
      { questionId: '15391', selectedAnswer: 'True' },
      {
        questionId: '15403',
        matchPairs: [
          { leftId: 'L0', rightId: 'R2' },
          { leftId: 'L1', rightId: 'R1' },
          { leftId: 'L2', rightId: 'R0' },
        ],
      },
      {
        questionId: '15397',
        subAnswers: [
          { questionId: '15398', selectedAnswer: 'Increases' },
          { questionId: '15399', selectedAnswer: 'False' },
        ],
      },
    ]);
  });

  it('sends exactly one entry per top-level question, never per unit', () => {
    const payload = buildSubmitPayload(questions, fullDraft);
    expect(payload).toHaveLength(questions.length); // 4, not 5
    expect(payload.map((entry) => entry.questionId)).toEqual(['15380', '15391', '15403', '15397']);
  });

  it('sends selectedAnswer: null for an unanswered choice question', () => {
    expect(buildSubmitPayload([{ id: 'q1', type: 'mcq' }], {})).toEqual([
      { questionId: 'q1', selectedAnswer: null },
    ]);
  });

  it('treats whitespace-only free text as unanswered', () => {
    const draft: QuizDraft = { q1: { kind: 'text', value: '   ' } };
    expect(buildSubmitPayload([{ id: 'q1', type: 'give_a_reason' }], draft)).toEqual([
      { questionId: 'q1', selectedAnswer: null },
    ]);
  });

  it('nulls a missing paragraph child but still emits one subAnswer per child', () => {
    const draft: QuizDraft = { p: { kind: 'paragraph', children: { c1: 'Yes' } } };
    const paragraph: AnswerableQuestion = {
      id: 'p',
      type: 'paragraph',
      subQuestions: [{ id: 'c1' }, { id: 'c2' }],
    };
    expect(buildSubmitPayload([paragraph], draft)).toEqual([
      {
        questionId: 'p',
        subAnswers: [
          { questionId: 'c1', selectedAnswer: 'Yes' },
          { questionId: 'c2', selectedAnswer: null },
        ],
      },
    ]);
  });

  it('falls back to selectedAnswer: null for a match with no pairs drawn', () => {
    const match: AnswerableQuestion = {
      id: 'm',
      type: 'match',
      matchPairs: { left: [{ id: 'L0' }] },
    };
    expect(buildSubmitPayload([match], {})).toEqual([{ questionId: 'm', selectedAnswer: null }]);
  });

  it('keeps the count invariant for an unknown/future type', () => {
    expect(buildSubmitPayload([{ id: 'x', type: 'ordering' }], {})).toEqual([
      { questionId: 'x', selectedAnswer: null },
    ]);
  });
});

describe('isQuestionComplete', () => {
  it('is complete only when a choice question has a non-blank answer', () => {
    const q: AnswerableQuestion = { id: 'q1', type: 'mcq' };
    expect(isQuestionComplete(q, {})).toBe(false);
    expect(isQuestionComplete(q, { q1: { kind: 'text', value: '' } })).toBe(false);
    expect(isQuestionComplete(q, { q1: { kind: 'text', value: 'A' } })).toBe(true);
  });

  it('needs every left item paired for a match question', () => {
    const q: AnswerableQuestion = {
      id: 'm',
      type: 'match',
      matchPairs: { left: [{ id: 'L0' }, { id: 'L1' }] },
    };
    expect(isQuestionComplete(q, { m: { kind: 'match', pairs: { L0: 'R0' } } })).toBe(false);
    expect(isQuestionComplete(q, { m: { kind: 'match', pairs: { L0: 'R0', L1: 'R1' } } })).toBe(
      true,
    );
  });

  it('needs every child answered for a paragraph question', () => {
    const q: AnswerableQuestion = {
      id: 'p',
      type: 'paragraph',
      subQuestions: [{ id: 'c1' }, { id: 'c2' }],
    };
    expect(isQuestionComplete(q, { p: { kind: 'paragraph', children: { c1: 'a' } } })).toBe(false);
    expect(
      isQuestionComplete(q, { p: { kind: 'paragraph', children: { c1: 'a', c2: 'b' } } }),
    ).toBe(true);
  });

  it('treats an unknown type as complete so the student is never trapped', () => {
    expect(isQuestionComplete({ id: 'x', type: 'ordering' }, {})).toBe(true);
  });

  // Malformed backend data used to dead-end the attempt: the card renders as
  // unsupported, but Next and Finish demanded an answer that could never be
  // given, so the student could neither advance nor submit.
  it('treats a match with no left column as complete', () => {
    expect(isQuestionComplete({ id: 'm', type: 'match' }, {})).toBe(true);
    expect(isQuestionComplete({ id: 'm', type: 'match', matchPairs: null }, {})).toBe(true);
    expect(isQuestionComplete({ id: 'm', type: 'match', matchPairs: { left: [] } }, {})).toBe(true);
  });

  it('treats a paragraph with no sub-questions as complete', () => {
    expect(isQuestionComplete({ id: 'p', type: 'paragraph' }, {})).toBe(true);
    expect(isQuestionComplete({ id: 'p', type: 'paragraph', subQuestions: null }, {})).toBe(true);
    expect(isQuestionComplete({ id: 'p', type: 'paragraph', subQuestions: [] }, {})).toBe(true);
  });

  it('still blocks a well-formed match that is only partly paired', () => {
    const q: AnswerableQuestion = {
      id: 'm',
      type: 'match',
      matchPairs: { left: [{ id: 'L0' }, { id: 'L1' }] },
    };
    expect(isQuestionComplete(q, {})).toBe(false);
  });
});

describe('countIncompleteQuestions', () => {
  it('counts only the unanswered top-level questions', () => {
    const partial: QuizDraft = {
      '15380': { kind: 'text', value: 'Photosynthesis' },
      '15403': { kind: 'match', pairs: { L0: 'R2', L1: 'R1', L2: 'R0' } },
    };
    // 15391 (true_false) and 15397 (paragraph) are untouched.
    expect(countIncompleteQuestions(questions, partial)).toBe(2);
    expect(countIncompleteQuestions(questions, fullDraft)).toBe(0);
  });
});
