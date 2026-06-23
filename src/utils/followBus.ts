/**
 * Lightweight pub/sub so a follow/unfollow performed on one screen reflects
 * instantly on every other mounted screen showing that same user — the
 * Community search list, the Followers/Following lists, and the student
 * profile. Emitted from useFollowToggle so every follow action propagates.
 */
type FollowListener = (userId: string, isFollowing: boolean) => void;

const listeners = new Set<FollowListener>();

export const emitFollowChange = (userId: string, isFollowing: boolean): void => {
  listeners.forEach((listener) => listener(userId, isFollowing));
};

export const subscribeFollowChange = (listener: FollowListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
