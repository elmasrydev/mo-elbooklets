import {
  isDescriptiveType,
  isChoiceType,
  isMatchType,
  isParagraphType,
  isSupportedType,
} from '../../utils/quizQuestionTypes';

describe('quiz question type guards', () => {
  it('classifies descriptive (AI-graded) types', () => {
    expect(isDescriptiveType('what_happens')).toBe(true);
    expect(isDescriptiveType('give_a_reason')).toBe(true);
    expect(isDescriptiveType('mcq')).toBe(false);
  });

  it('classifies pick-one choice types', () => {
    expect(isChoiceType('mcq')).toBe(true);
    expect(isChoiceType('true_false')).toBe(true);
    expect(isChoiceType('match')).toBe(false);
  });

  it('classifies match and paragraph exactly', () => {
    expect(isMatchType('match')).toBe(true);
    expect(isMatchType('paragraph')).toBe(false);
    expect(isParagraphType('paragraph')).toBe(true);
    expect(isParagraphType('match')).toBe(false);
  });

  it('recognises every known type and rejects unknown/future ones', () => {
    ['mcq', 'true_false', 'what_happens', 'give_a_reason', 'match', 'paragraph'].forEach((type) =>
      expect(isSupportedType(type)).toBe(true),
    );
    expect(isSupportedType('ordering')).toBe(false);
    expect(isSupportedType('MCQ')).toBe(false); // case-sensitive, like the backend
    expect(isSupportedType('')).toBe(false);
  });
});
