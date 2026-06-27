import {
  subjectStatus,
  quizPercent,
  ON_TRACK_THRESHOLD,
  NEEDS_ATTENTION_THRESHOLD,
} from '../../utils/childProgress';

describe('subjectStatus', () => {
  it('returns on_track at and above the on-track threshold', () => {
    expect(subjectStatus(ON_TRACK_THRESHOLD)).toBe('on_track');
    expect(subjectStatus(80)).toBe('on_track');
    expect(subjectStatus(100)).toBe('on_track');
  });

  it('returns needs_attention between the two thresholds', () => {
    expect(subjectStatus(NEEDS_ATTENTION_THRESHOLD)).toBe('needs_attention');
    expect(subjectStatus(50)).toBe('needs_attention');
    expect(subjectStatus(74)).toBe('needs_attention');
  });

  it('returns critical below the needs-attention threshold', () => {
    expect(subjectStatus(49)).toBe('critical');
    expect(subjectStatus(20)).toBe('critical');
    expect(subjectStatus(0)).toBe('critical');
  });

  it('treats non-finite scores as critical', () => {
    expect(subjectStatus(NaN)).toBe('critical');
  });
});

describe('quizPercent', () => {
  it('computes a rounded percentage from correct/total', () => {
    expect(quizPercent(7, 8)).toBe(88);
    expect(quizPercent(1, 5)).toBe(20);
    expect(quizPercent(3, 6)).toBe(50);
  });

  it('returns 100 when all answers are correct and 0 when none are', () => {
    expect(quizPercent(8, 8)).toBe(100);
    expect(quizPercent(0, 5)).toBe(0);
  });

  it('returns 0 instead of dividing by zero when there are no questions', () => {
    expect(quizPercent(5, 0)).toBe(0);
  });

  it('clamps out-of-range counts to [0, 100]', () => {
    expect(quizPercent(12, 10)).toBe(100);
    expect(quizPercent(-1, 10)).toBe(0);
  });
});
