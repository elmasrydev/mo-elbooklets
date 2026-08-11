import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@apollo/client/react';

import { FollowUserDocument, FollowUserMutation } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';
import { emitFollowChange } from '../utils/followBus';
import { patchCachedLeaderboardEntries } from '../utils/leaderboardCache';

type FollowResult = FollowUserMutation['followUser'];

export const useFollowToggle = () => {
  const { refreshUser } = useAuth();

  const [followUser, { loading: isToggling }] = useMutation(FollowUserDocument, {
    update: (cache, { data }, { variables }) => {
      const result = data?.followUser;
      if (!result?.success || !variables) return;
      const { userId } = variables;
      const { isFollowing } = result;

      // StudentSearchResult is normalized by id, so one write flips isFollowing
      // everywhere it is mounted (search results, follow lists).
      cache.modify({
        id: cache.identify({ __typename: 'StudentSearchResult', id: userId }),
        fields: { isFollowing: () => isFollowing },
      });

      // LeaderboardEntry is deliberately NOT normalized, so each cached board
      // holds its own copy of the student and must be patched in place.
      patchCachedLeaderboardEntries(cache, userId, (entry) => ({ ...entry, isFollowing }));
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
