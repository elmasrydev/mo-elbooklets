export const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return '#10B981'; // Excellent
  if (percentage >= 75) return '#3B82F6'; // Good
  if (percentage >= 50) return '#F59E0B'; // Passed
  return '#FF6B6B'; // Failed
};

export const getScoreStatusKey = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 50) return 'passed';
  return 'failed';
};

/**
 * Format a unit-based quiz score for display. `score` is a Float — descriptive
 * questions produce partial values like 6.5 — so show one decimal when needed
 * and a plain integer otherwise: 7 → "7", 6.5 → "6.5", 6.666 → "6.7".
 */
export const formatScore = (score: number): string => {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};
