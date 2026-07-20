import { useState } from 'react';
import { useQuery } from '@apollo/client/react';

import { GetChildDashboardDocument, GetChildDashboardQuery } from '../generated/graphql';
import { loadFailureMessage } from '../utils/queryError';

export type ChildDashboardData = GetChildDashboardQuery['childDashboard'];
export type ChildSubjectPerformance = ChildDashboardData['subject_performance'][number];
export type ChildRecentActivity = ChildDashboardData['recent_activity'][number];

/**
 * Fetches a linked child's progress dashboard (childDashboard query) for the
 * parent.
 */
export const useChildDashboard = (childId: string) => {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    loading,
    error: queryError,
    refetch: refetchDashboard,
  } = useQuery(GetChildDashboardDocument, {
    variables: { childId },
    skip: !childId,
    notifyOnNetworkStatusChange: true,
  });

  const refetch = async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  return {
    data: data?.childDashboard ?? null,
    // Skeleton only until the first payload; the background refresh is silent.
    loading: loading && !data,
    refreshing,
    error: loadFailureMessage(data?.childDashboard, queryError, 'error'),
    refetch,
  };
};
