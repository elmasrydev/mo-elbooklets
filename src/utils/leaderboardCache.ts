import type { ApolloCache } from '@apollo/client';

/**
 * Patching cached leaderboard entries.
 *
 * `LeaderboardEntry` is deliberately NOT normalized (see `typePolicies` in
 * `src/lib/apollo.ts`): its `rank`/`xp`/`avgScore` are relative to the board
 * that produced them, so one shared object would let the Math board rewrite the
 * global board's numbers for the same student.
 *
 * The cost is that `cache.identify({ __typename: 'LeaderboardEntry', id })`
 * returns `undefined`, and `cache.modify` given an undefined id **silently does
 * nothing** — a mutation's `update` that keys on it looks correct and never
 * runs. Anything that has to reach a cached entry must instead walk the
 * `leaderboard` root field, which this helper does for every argument variant
 * (global, per-subject, per-filter) in one call.
 */

/** Only the fields callers touch; the rest ride along through the spread. */
export type CachedLeaderboardEntry = ({ id?: string } & Record<string, unknown>) | null | undefined;

type CachedBoard =
  | { entries?: CachedLeaderboardEntry[]; userEntry?: CachedLeaderboardEntry }
  | undefined;

/**
 * Apply `patch` to the student with `userId` in every cached leaderboard board,
 * including each board's `userEntry`.
 */
export const patchCachedLeaderboardEntries = (
  cache: ApolloCache,
  userId: string,
  patch: (entry: Record<string, unknown>) => Record<string, unknown>,
): void => {
  const applyTo = (entry: CachedLeaderboardEntry): CachedLeaderboardEntry =>
    entry && entry.id === userId ? patch(entry as Record<string, unknown>) : entry;

  cache.modify({
    id: 'ROOT_QUERY',
    fields: {
      leaderboard: (existing: unknown) => {
        // Apollo types a modifier's value as `Reference | StoreObject`.
        // LeaderboardResult has no id, so it is never a Reference.
        const board = existing as unknown as CachedBoard;
        if (!board || !Array.isArray(board.entries)) return existing;
        return {
          ...board,
          entries: board.entries.map(applyTo),
          userEntry: applyTo(board.userEntry),
        };
      },
    },
  });
};
