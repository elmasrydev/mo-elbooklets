import {
  canOfferTypePicker,
  availableForSelection,
  isDefaultSelection,
  questionTypesArgument,
  evaluateSelection,
  pruneSelection,
  QuestionTypeOption,
} from '../../utils/quizTypeSelection';

const OPTIONS: QuestionTypeOption[] = [
  { type: 'mcq', label: 'Multiple Choice', count: 61 },
  { type: 'true_false', label: 'True / False', count: 24 },
  { type: 'image', label: 'Picture Questions', count: 7 },
  { type: 'match', label: 'Match the Columns', count: 4 },
];
const TOTAL = 96;

describe('canOfferTypePicker', () => {
  it('offers the picker when there are enough types to choose between', () => {
    expect(canOfferTypePicker(OPTIONS, 2)).toBe(true);
  });

  it('hides the picker when a valid selection is impossible', () => {
    // One type available but two required — any selection would be rejected.
    expect(canOfferTypePicker([OPTIONS[0]], 2)).toBe(false);
    expect(canOfferTypePicker([], 2)).toBe(false);
  });
});

describe('availableForSelection', () => {
  it('sums the counts of the selected types only', () => {
    expect(availableForSelection(['match', 'image'], OPTIONS)).toBe(11);
  });

  it('ignores a type the server did not offer', () => {
    expect(availableForSelection(['paragraph'], OPTIONS)).toBe(0);
  });
});

describe('isDefaultSelection', () => {
  it('treats no explicit selection as the default mix', () => {
    expect(isDefaultSelection(null, OPTIONS)).toBe(true);
  });

  it('does NOT treat an emptied selection as the default mix', () => {
    // Unchecking every box is a mistake to correct, not a request for the full
    // random mix — otherwise the student silently gets the types they removed.
    expect(isDefaultSelection([], OPTIONS)).toBe(false);
  });

  it('treats every type selected as the default mix', () => {
    expect(isDefaultSelection(['mcq', 'true_false', 'image', 'match'], OPTIONS)).toBe(true);
  });

  it('treats a narrowed selection as custom', () => {
    expect(isDefaultSelection(['mcq', 'image'], OPTIONS)).toBe(false);
  });
});

describe('questionTypesArgument', () => {
  it('omits the argument for the default mix rather than listing every type', () => {
    expect(questionTypesArgument(['mcq', 'true_false', 'image', 'match'], OPTIONS)).toBeUndefined();
    expect(questionTypesArgument(null, OPTIONS)).toBeUndefined();
  });

  it('omits the argument for an emptied selection, which Start blocks anyway', () => {
    expect(questionTypesArgument([], OPTIONS)).toBeUndefined();
  });

  it('sends only the narrowed selection', () => {
    expect(questionTypesArgument(['image', 'mcq'], OPTIONS)).toEqual(['mcq', 'image']);
  });

  it('drops values the server never offered', () => {
    expect(questionTypesArgument(['mcq', 'paragraph'], OPTIONS)).toEqual(['mcq']);
  });

  it('omits the argument when no types are available at all', () => {
    expect(questionTypesArgument(['mcq'], [])).toBeUndefined();
  });
});

describe('evaluateSelection', () => {
  const evaluate = (selected: string[] | null, neededQuestions: number) =>
    evaluateSelection({
      selected,
      options: OPTIONS,
      minSelectedTypes: 2,
      total: TOTAL,
      neededQuestions,
    });

  it('allows the default mix to draw on the whole pool', () => {
    const status = evaluate(null, 50);
    expect(status.available).toBe(TOTAL);
    expect(status.canStart).toBe(true);
    expect(status.shortfall).toBe(0);
  });

  it('blocks a selection that cannot fill the quiz and reports the shortfall', () => {
    // The guide's worked example: match (4) + a 3-question type vs a 50-question quiz.
    const status = evaluate(['match', 'image'], 50);
    expect(status.available).toBe(11);
    expect(status.shortfall).toBe(39);
    expect(status.canStart).toBe(false);
  });

  it('blocks a single-type selection below the minimum', () => {
    const status = evaluate(['mcq'], 10);
    expect(status.tooFewTypes).toBe(true);
    expect(status.canStart).toBe(false);
  });

  it('allows a custom selection that covers the quiz size', () => {
    const status = evaluate(['mcq', 'true_false'], 50);
    expect(status.available).toBe(85);
    expect(status.canStart).toBe(true);
    expect(status.tooFewTypes).toBe(false);
  });

  it('does not apply the minimum to the default mix', () => {
    expect(evaluate(null, 10).tooFewTypes).toBe(false);
  });

  it('blocks a selection the student has emptied', () => {
    const status = evaluate([], 10);
    expect(status.tooFewTypes).toBe(true);
    expect(status.canStart).toBe(false);
  });

  it('blocks the default mix when the whole pool is too small', () => {
    const status = evaluateSelection({
      selected: null,
      options: OPTIONS,
      minSelectedTypes: 2,
      total: 8,
      neededQuestions: 50,
    });
    expect(status.shortfall).toBe(42);
    expect(status.canStart).toBe(false);
  });
});

describe('pruneSelection', () => {
  it('drops types that are no longer available after a lesson change', () => {
    expect(pruneSelection(['mcq', 'paragraph', 'match'], OPTIONS)).toEqual(['mcq', 'match']);
  });

  it('leaves the default mix alone', () => {
    expect(pruneSelection(null, OPTIONS)).toBeNull();
  });
});

describe('single-type lesson sets', () => {
  const ONE: QuestionTypeOption[] = [{ type: 'mcq', label: 'Multiple Choice', count: 12 }];

  it('hides the picker but still blocks a quiz the pool cannot fill', () => {
    // The student cannot narrow anything here, so the shortfall has to be
    // reported outside the picker or Start is dead with no explanation.
    expect(canOfferTypePicker(ONE, 2)).toBe(false);
    const status = evaluateSelection({
      selected: null,
      options: ONE,
      minSelectedTypes: 2,
      total: 12,
      neededQuestions: 20,
    });
    expect(status.canStart).toBe(false);
    expect(status.shortfall).toBe(8);
  });
});
