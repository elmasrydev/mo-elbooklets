/**
 * Reading a student's trial / subscription state (contract:
 * `mobile-trial-restrictions.md` §2 and §5).
 *
 * The server drives everything; the app only interprets. Two rules make that
 * safe, and both are the reason these are functions rather than inline checks:
 *
 * 1. **`null` and `0` are opposite extremes.** For `daily_quiz_limit`, `null`
 *    means *unlimited* (a paid plan) and `0` means *no access at all* (trial
 *    over). In JS `null <= 0` is `true` and `null ?? 0` is `0`, so a casual
 *    comparison locks out precisely the students who paid.
 * 2. **Unknown is not "blocked".** On a backend that has not deployed the
 *    trial fields — demo and production, as of 2026-08-23 — the whole query
 *    fails and there is no status at all. Every predicate here therefore fails
 *    open: no status means nothing is blocked, never a locked app.
 *
 * The limits themselves are ops-tuned per environment (PRS currently runs a
 * 120-day trial, not the 7 the contract's example shows), so nothing here
 * hardcodes a number.
 *
 * `onTrial`, `trialEndsAt` and `trialDaysRemaining` are fetched (§2 says to
 * read all five) but nothing reads them yet: the trial countdown and quiz
 * counter the contract suggests are deliberately not built, since the app
 * shows one existing premium notice instead of any new paywall UI.
 */

export interface TrialStatus {
  isSubscribed: boolean;
  /** True only while the free trial runs. A paid student is `false` here. */
  onTrial: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  /** `null` = unlimited, `0` = no access. */
  dailyQuizLimit: number | null;
  /** `null` = unlimited. A snapshot: stale the moment a quiz starts. */
  remainingQuizzesToday: number | null;
}

/** A plan with no quiz ceiling. Distinct from "we don't know" (`undefined`). */
export const isUnlimitedQuizzes = (limit: number | null | undefined): boolean => limit === null;

/** The student may not start any quiz today — trial spent, nothing bought. */
export const isQuizzingBlocked = (limit: number | null | undefined): boolean => limit === 0;

/**
 * Whether a quiz may still be started today. The server is the authority — this
 * only decides whether the app should offer the attempt, and says yes whenever
 * it cannot prove otherwise.
 */
export const hasQuizAttemptsLeft = (status: TrialStatus | null): boolean => {
  if (!status) return true;
  if (isUnlimitedQuizzes(status.dailyQuizLimit)) return true;
  if (isQuizzingBlocked(status.dailyQuizLimit)) return false;
  return typeof status.remainingQuizzesToday === 'number' ? status.remainingQuizzesToday > 0 : true;
};

/**
 * The student has no access at all: the trial ended (or a plan lapsed) and
 * nothing was bought. Only an explicit `false` counts — an absent status is
 * "unknown", and must never lock the app.
 */
export const isLockedOut = (status: TrialStatus | null): boolean => status?.isSubscribed === false;
