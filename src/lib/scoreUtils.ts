export const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return '#10B981'; // Excellent
  if (percentage >= 75) return '#3B82F6'; // Good
  if (percentage >= 50) return '#F59E0B'; // Passed
  return '#EF4444'; // Failed
};

export const getScoreStatusKey = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 50) return 'passed';
  return 'failed';
};
