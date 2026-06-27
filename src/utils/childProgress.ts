/**
 * Parent-facing derivations over a child's subject scores.
 *
 * The score colour itself comes from the app-wide `getScoreColor` (scoreUtils) so the
 * parent view stays consistent with what the student sees. This module only adds the
 * 3-tier "is my child on track?" badge the parent dashboard design calls for, with
 * thresholds aligned to `getScoreColor`'s buckets (≥75 good/blue, ≥50 amber, <50 red).
 */
export type SubjectStatus = 'on_track' | 'needs_attention' | 'critical';

export const ON_TRACK_THRESHOLD = 75;
export const NEEDS_ATTENTION_THRESHOLD = 50;

/**
 * Maps an average score (0–100 percent) to a parent-facing status.
 *
 * Boundary cases:
 *   - score >= 75            → 'on_track'        (75, 100)
 *   - 50 <= score < 75       → 'needs_attention' (50, 74)
 *   - score < 50             → 'critical'        (0, 49)
 *   - NaN / non-finite       → 'critical'        (treated as no real progress)
 */
export const subjectStatus = (score: number): SubjectStatus => {
  if (score >= ON_TRACK_THRESHOLD) return 'on_track';
  if (score >= NEEDS_ATTENTION_THRESHOLD) return 'needs_attention';
  return 'critical';
};

/**
 * Quiz score percentage from the raw correct-answer count and total questions.
 * `recent_activity.score` is a count (not a percent), paired with `total_questions`.
 *
 * Boundary cases:
 *   - total <= 0 (or falsy)  → 0   (avoid divide-by-zero)
 *   - correct === total      → 100
 *   - correct === 0          → 0
 *   - correct out of range   → clamped to [0, 100] (e.g. a stray correct > total)
 */
export const quizPercent = (correct: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
};
