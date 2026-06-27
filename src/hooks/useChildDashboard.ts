import { useState, useCallback, useEffect } from 'react';
import { tryFetchWithFallback } from '../config/api';
import { GET_CHILD_DASHBOARD_QUERY } from '../graphql/parentingQueries';

export interface ChildSubjectPerformance {
  subject_name: string;
  quiz_count: number;
  avg_score: number;
}

export interface ChildRecentActivity {
  subject_name: string;
  score: number;
  total_questions: number;
  is_passed: boolean;
  completed_at: string;
}

export interface ChildDashboardData {
  child?: { name: string };
  quizzes_solved: number;
  average_score: number;
  started_subjects_count: number;
  subject_performance: ChildSubjectPerformance[];
  recent_activity: ChildRecentActivity[];
}

/**
 * Fetches a linked child's progress dashboard (childDashboard query) for the
 * parent. Uses tryFetchWithFallback like the rest of the parent flow rather than
 * Apollo, so it shares the URL fallback + auth-error handling.
 */
export const useChildDashboard = (childId: string) => {
  const [data, setData] = useState<ChildDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await tryFetchWithFallback(GET_CHILD_DASHBOARD_QUERY, { childId });
        if (res.errors) {
          // Surface every GraphQL error (e.g. all invalid fields), not just the first.
          throw new Error(res.errors.map((e: { message: string }) => e.message).join('; '));
        }
        setData(res.data?.childDashboard ?? null);
      } catch (err: any) {
        console.error('Error fetching child dashboard:', err);
        setError(err.message || 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [childId],
  );

  useEffect(() => {
    if (childId) fetchData();
  }, [childId, fetchData]);

  return { data, loading, refreshing, error, refetch: () => fetchData(true) };
};
