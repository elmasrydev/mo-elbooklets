import {
  groupUserAnswers,
  alignedMatchPairs,
  buildMatchReviewRows,
  findSwappedPairs,
  type ReviewUserAnswer,
} from '../../utils/quizResultGroups';

type ReviewQuestion = ReviewUserAnswer['question'];

// Typed factory so fixtures stay minimal but exhaustive (no `any`, no missing
// fields). Only the fields a test cares about are overridden.
function row(
  over: {
    parentId?: string | null;
    question?: Partial<ReviewQuestion>;
  } & Partial<Omit<ReviewUserAnswer, 'question' | 'parent_question_id'>> = {},
): ReviewUserAnswer {
  const { question: qOver, parentId, ...rest } = over;
  return {
    selected_answer: null,
    is_correct: false,
    score: 0,
    explanation: null,
    parent_question_id: parentId ?? null,
    match_results: null,
    descriptive_feedback: null,
    ...rest,
    question: {
      id: 'q',
      question: '',
      type: 'mcq',
      answer_1: null,
      answer_2: null,
      answer_3: null,
      answer_4: null,
      explanation: null,
      imageUrl: null,
      matchColumns: null,
      parent: null,
      ...qOver,
    },
  };
}

const columns = (leftTexts: string[], rightTexts: string[]) => ({
  left: leftTexts.map((text, i) => ({ id: `L${i}`, text })),
  right: rightTexts.map((text, i) => ({ id: `R${i}`, text })),
});

describe('groupUserAnswers', () => {
  it('keeps standalone rows as single groups in order', () => {
    const rows = [row({ question: { id: 'a' } }), row({ question: { id: 'b' } })];
    const groups = groupUserAnswers(rows);
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.kind === 'single')).toBe(true);
  });

  it('collects paragraph children under one group at the first child position', () => {
    const rows = [
      row({ question: { id: 'q1' } }),
      row({
        parentId: 'p9',
        question: { id: 'c1', parent: { id: 'p9', question: 'Passage text' } },
      }),
      row({
        parentId: 'p9',
        question: { id: 'c2', parent: { id: 'p9', question: 'Passage text' } },
      }),
      row({ question: { id: 'q2' } }),
    ];
    const groups = groupUserAnswers(rows);
    expect(groups.map((g) => g.kind)).toEqual(['single', 'paragraph', 'single']);
    const paragraph = groups[1];
    if (paragraph.kind !== 'paragraph') throw new Error('expected paragraph group');
    expect(paragraph.parentId).toBe('p9');
    expect(paragraph.passage).toBe('Passage text');
    expect(paragraph.children).toHaveLength(2);
  });

  it('is regression-safe for legacy responses without paragraph rows', () => {
    const rows = [row(), row(), row()];
    const groups = groupUserAnswers(rows);
    expect(groups).toHaveLength(3);
    expect(groups.every((g) => g.kind === 'single')).toBe(true);
  });
});

describe('alignedMatchPairs', () => {
  it('pairs left[i] with right[i] from the unshuffled columns', () => {
    const pairs = alignedMatchPairs(columns(['Sun', 'Moon'], ['Day', 'Night']));
    expect(pairs).toEqual([
      { left: { id: 'L0', text: 'Sun' }, right: { id: 'R0', text: 'Day' } },
      { left: { id: 'L1', text: 'Moon' }, right: { id: 'R1', text: 'Night' } },
    ]);
  });

  it('returns [] when there are no columns', () => {
    expect(alignedMatchPairs(null)).toEqual([]);
  });
});

describe('buildMatchReviewRows', () => {
  it('resolves the chosen and correct right for each left', () => {
    const cols = columns(['Sun', 'Moon'], ['Day', 'Night']);
    // Student swapped: L0->R1 (wrong), L1->R0 (wrong).
    const results = [
      { leftId: 'L0', rightId: 'R1', isCorrect: false },
      { leftId: 'L1', rightId: 'R0', isCorrect: false },
    ];
    const reviewRows = buildMatchReviewRows(results, cols);
    expect(reviewRows[0]).toEqual({
      leftId: 'L0',
      leftText: 'Sun',
      chosenRightId: 'R1',
      chosenRightText: 'Night',
      correctRightId: 'R0',
      correctRightText: 'Day',
      isCorrect: false,
    });
    expect(reviewRows[1].chosenRightText).toBe('Day');
    expect(reviewRows[1].correctRightText).toBe('Night');
  });

  it('marks a left with no submitted pair as unanswered', () => {
    const cols = columns(['Sun'], ['Day']);
    const reviewRows = buildMatchReviewRows([], cols);
    expect(reviewRows[0].chosenRightId).toBeNull();
    expect(reviewRows[0].isCorrect).toBe(false);
    expect(reviewRows[0].correctRightText).toBe('Day');
  });
});

describe('findSwappedPairs', () => {
  it('detects an exchanged pair', () => {
    const cols = columns(['Sun', 'Moon'], ['Day', 'Night']);
    const results = [
      { leftId: 'L0', rightId: 'R1', isCorrect: false }, // Sun -> Night (should be Day)
      { leftId: 'L1', rightId: 'R0', isCorrect: false }, // Moon -> Day (should be Night)
    ];
    expect(findSwappedPairs(results, cols)).toEqual([{ a: 0, b: 1 }]);
  });

  it('reports no swap when the answers are correct', () => {
    const cols = columns(['Sun', 'Moon'], ['Day', 'Night']);
    const results = [
      { leftId: 'L0', rightId: 'R0', isCorrect: true },
      { leftId: 'L1', rightId: 'R1', isCorrect: true },
    ];
    expect(findSwappedPairs(results, cols)).toEqual([]);
  });

  it('reports no swap when only one side is wrong', () => {
    const cols = columns(['Sun', 'Moon', 'Star'], ['Day', 'Night', 'Space']);
    const results = [
      { leftId: 'L0', rightId: 'R2', isCorrect: false }, // Sun -> Space (not a mutual swap)
      { leftId: 'L1', rightId: 'R1', isCorrect: true },
      { leftId: 'L2', rightId: 'R2', isCorrect: true },
    ];
    expect(findSwappedPairs(results, cols)).toEqual([]);
  });
});
