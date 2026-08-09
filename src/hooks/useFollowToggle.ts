import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@apollo/client/react';

import { FollowUserDocument, FollowUserMutation } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';
import { emitFollowChange } from '../utils/followBus';

type FollowResult = FollowUserMutation['followUser'];

/**
 * The shape of an un-normalized LeaderboardEntry as it sits in the cache. Only
 * the fields this hook touches are declared — the rest are carried through by
 * spread, so a schema addition needs no change here.
 */
type CachedEntry = { id?: string; isFollowing?: boolean } | null | undefined;
type CachedBoard = { entries?: CachedEntry[]; userEntry?: CachedEntry } | undefined;

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

      // LeaderboardEntry is deliberately NOT normalized (see typePolicies in
      // apollo.ts — rank/xp are relative to the board that produced them), so
      // every cached `leaderboard(...)` field holds its own copy of the student
      // and each one has to be patched in place. Modifying the ROOT_QUERY field
      // by name covers all argument variants at once (global, per-subject,
      // per-filter, and Home's rail).
      const patch = (entry: CachedEntry): CachedEntry =>
        entry && entry.id === userId ? { ...entry, isFollowing } : entry;

      cache.modify({
        id: 'ROOT_QUERY',
        fields: {
          leaderboard: (existing) => {
            // Apollo types a modifier's value as `Reference | StoreObject`.
            // LeaderboardResult has no id, so it is never a Reference — it is
            // always the stored object.
            const board = existing as unknown as CachedBoard;
            if (!board || !Array.isArray(board.entries)) return existing;
            return {
              ...board,
              entries: board.entries.map(patch),
              userEntry: patch(board.userEntry),
            };
          },
        },
      });
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
