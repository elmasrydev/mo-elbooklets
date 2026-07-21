import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@apollo/client/react';

import { FollowUserDocument, FollowUserMutation } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';
import { emitFollowChange } from '../utils/followBus';

type FollowResult = FollowUserMutation['followUser'];

export const useFollowToggle = () => {
  const { refreshUser } = useAuth();

  const [followUser, { loading: isToggling }] = useMutation(FollowUserDocument, {
    // StudentSearchResult and LeaderboardEntry are normalized by id, so one
    // cache write flips isFollowing in every mounted list at once (search
    // results, follow lists, leaderboard entries + userEntry).
    update: (cache, { data }, { variables }) => {
      const result = data?.followUser;
      if (!result?.success || !variables) return;
      for (const __typename of ['StudentSearchResult', 'LeaderboardEntry'] as const) {
        cache.modify({
          id: cache.identify({ __typename, id: variables.userId }),
          fields: { isFollowing: () => result.isFollowing },
        });
      }
    },
  });

  const toggleFollow = useCallback(
    async (userId: string): Promise<FollowResult | null> => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const { data } = await followUser({ variables: { userId } });
        const result = data?.followUser;
        if (result?.success) {
          // Broadcast for screens whose follow state lives outside the cache
          // (StudentProfile's own type, legacy local-state screens).
          emitFollowChange(userId, result.isFollowing);
          await refreshUser();
        }
        return result ?? null;
      } catch (err) {
        console.error('Follow toggle error:', err);
        return null;
      }
    },
    [followUser, refreshUser],
  );

  return { toggleFollow, isToggling };
};
