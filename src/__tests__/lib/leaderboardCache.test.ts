import { patchCachedLeaderboardEntries } from '../../utils/leaderboardCache';

/**
 * These guard a failure that is invisible at runtime: because LeaderboardEntry
 * is not normalized, a `cache.modify` keyed on `cache.identify(...)` returns
 * false and writes nothing — no error, no warning, just a stale avatar or
 * follow button. The helper exists so that mistake can't be repeated.
 */
const makeCache = (board: unknown) => {
  const store: { leaderboard: unknown } = { leaderboard: board };
  return {
    store,
    modify: ({ fields }: any) => {
      store.leaderboard = fields.leaderboard(store.leaderboard);
      return true;
    },
  };
};

describe('patchCachedLeaderboardEntries', () => {
  it('patches the matching student in entries and in userEntry', () => {
    const cache = makeCache({
      entries: [
        { id: '1', isFollowing: false },
        { id: '2', isFollowing: false },
      ],
      userEntry: { id: '2', isFollowing: false },
    });

    patchCachedLeaderboardEntries(cache as any, '2', (entry) => ({ ...entry, isFollowing: true }));

    const board = cache.store.leaderboard as any;
    expect(board.entries[0].isFollowing).toBe(false);
    expect(board.entries[1].isFollowing).toBe(true);
    expect(board.userEntry.isFollowing).toBe(true);
  });

  it('leaves other students untouched and preserves their other fields', () => {
    const cache = makeCache({
      entries: [{ id: '1', rank: 4, xp: 120, isFollowing: false }],
      userEntry: null,
    });

    patchCachedLeaderboardEntries(cache as any, '1', (entry) => ({ ...entry, isFollowing: true }));

    expect((cache.store.leaderboard as any).entries[0]).toEqual({
      id: '1',
      rank: 4,
      xp: 120,
      isFollowing: true,
    });
  });

  it('is a no-op for a board that has not been cached yet', () => {
    const cache = makeCache(undefined);
    expect(() => patchCachedLeaderboardEntries(cache as any, '1', (e) => e)).not.toThrow();
    expect(cache.store.leaderboard).toBeUndefined();
  });

  it('tolerates a board with no entries array', () => {
    const cache = makeCache({ userEntry: { id: '1' } });
    patchCachedLeaderboardEntries(cache as any, '1', (e) => ({ ...e, isFollowing: true }));
    // Left as-is rather than half-patched: a board with no entries is not a
    // shape this helper can safely rewrite.
    expect((cache.store.leaderboard as any).userEntry.isFollowing).toBeUndefined();
  });
});
