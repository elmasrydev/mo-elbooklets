import { useQuery } from '@apollo/client/react';

import { ProfileCompletenessDocument, ProfileCompletenessQuery } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';

export type ProfileCompleteness = ProfileCompletenessQuery['profileCompleteness'];

export const useProfileCompleteness = () => {
  const { user } = useAuth();

  const { data, loading, refetch } = useQuery(ProfileCompletenessDocument, {
    skip: !user,
    // The prompt gates on this right after the user fills a field in, so a
    // cached answer would keep asking for something already provided.
    fetchPolicy: 'cache-and-network',
  });

  return { completeness: data?.profileCompleteness ?? null, loading, refetch };
};
