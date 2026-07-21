import { useQuery } from '@apollo/client/react';

import { ProfileCompletenessDocument, ProfileCompletenessQuery } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';

export type ProfileCompleteness = ProfileCompletenessQuery['profileCompleteness'];

export const useProfileCompleteness = () => {
  const { user } = useAuth();

  const { data, loading, refetch } = useQuery(ProfileCompletenessDocument, {
    skip: !user,
  });

  return { completeness: data?.profileCompleteness ?? null, loading, refetch };
};
