import {
  hasQuizAttemptsLeft,
  isLockedOut,
  isQuizzingBlocked,
  isUnlimitedQuizzes,
  TrialStatus,
} from '../../utils/trialStatus';

const status = (overrides: Partial<TrialStatus> = {}): TrialStatus => ({
  isSubscribed: true,
  onTrial: true,
  trialEndsAt: '2026-12-21 20:32:15',
  trialDaysRemaining: 120,
  dailyQuizLimit: 2,
  remainingQuizzesToday: 2,
  ...overrides,
});

// null = unlimited, 0 = no access. Conflating them locks out paying students.
describe('quiz allowance', () => {
  it('reads null as unlimited and 0 as blocked', () => {
    expect(isUnlimitedQuizzes(null)).toBe(true);
    expect(isUnlimitedQuizzes(0)).toBe(false);
    expect(isQuizzingBlocked(0)).toBe(true);
    expect(isQuizzingBlocked(null)).toBe(false);
  });

  it('lets an unlimited plan start a quiz however many are "remaining"', () => {
    expect(hasQuizAttemptsLeft(status({ dailyQuizLimit: null, remainingQuizzesToday: null }))).toBe(
      true,
    );
  });

  it('blocks when today is spent, allows while attempts remain', () => {
    expect(hasQuizAttemptsLeft(status({ remainingQuizzesToday: 0 }))).toBe(false);
    expect(hasQuizAttemptsLeft(status({ remainingQuizzesToday: 1 }))).toBe(true);
  });

  it('blocks an ended trial, whose limit is 0', () => {
    expect(hasQuizAttemptsLeft(status({ dailyQuizLimit: 0, remainingQuizzesToday: 0 }))).toBe(
      false,
    );
  });
});

// An environment without the trial fields yields no status at all. Both
// predicates must fail open there, or the app locks itself.
describe('unknown status', () => {
  it('never blocks on a missing status', () => {
    expect(hasQuizAttemptsLeft(null)).toBe(true);
    expect(isLockedOut(null)).toBe(false);
  });
});

describe('plan state', () => {
  it('locks out only an explicit unsubscribed answer', () => {
    expect(isLockedOut(status({ isSubscribed: false, onTrial: false }))).toBe(true);
    expect(isLockedOut(status())).toBe(false);
  });
});
