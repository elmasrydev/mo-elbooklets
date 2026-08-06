/**
 * Pure state machine for the tap-to-pair match interaction, ported from the
 * `mobile-quiz-matching.html` mockup's tap handler. Kept UI-free so the
 * arm / pair / steal / undo behaviour can be unit-tested and reused by both the
 * wires board and the long-content slots view.
 *
 * `pairs` is the committed answer (leftId -> rightId) and mirrors the match
 * draft entry; `pending` is the transient "armed" card the student tapped
 * first. The component owns `pending` in local state and writes `pairs` back
 * into the quiz draft after each tap.
 *
 * A match is a 1:1 mapping: each left maps to exactly one right, and each right
 * is used by at most one left. Tapping any already-linked card first unlinks it
 * and re-arms it, so re-pairing is always a tap-to-unlink then tap-to-connect
 * sequence — never a silent one-tap displacement. (This mirrors the mockup's
 * handler, whose linked-card branch pre-empts everything else.)
 */

export type MatchSide = 'left' | 'right';
export type MatchPending = { side: MatchSide; id: string } | null;
export type MatchState = {
  pairs: Record<string, string>; // leftId -> rightId
  pending: MatchPending;
};

export const EMPTY_MATCH_STATE: MatchState = { pairs: {}, pending: null };

/** The leftId currently paired to a given rightId, if any. */
const leftPairedTo = (pairs: Record<string, string>, rightId: string): string | undefined =>
  Object.keys(pairs).find((leftId) => pairs[leftId] === rightId);

const isLinked = (pairs: Record<string, string>, side: MatchSide, id: string): boolean =>
  side === 'left' ? pairs[id] != null : Object.values(pairs).includes(id);

/**
 * Apply a tap on the card `id` in column `side`. Returns the next state; never
 * mutates the input.
 */
export function matchTap(state: MatchState, side: MatchSide, id: string): MatchState {
  const { pairs, pending } = state;

  // 1. Tapping a linked card unlinks that pair and arms the tapped card, so a
  //    single tap starts a correction.
  if (isLinked(pairs, side, id)) {
    const next = { ...pairs };
    if (side === 'left') {
      delete next[id];
    } else {
      const leftId = leftPairedTo(pairs, id);
      if (leftId) delete next[leftId];
    }
    return { pairs: next, pending: { side, id } };
  }

  // 2. Tapping the already-armed card disarms it.
  if (pending && pending.side === side && pending.id === id) {
    return { pairs, pending: null };
  }

  // 3. Nothing armed, or armed on the same column -> move the arm to this card.
  if (!pending || pending.side === side) {
    return { pairs, pending: { side, id } };
  }

  // 4. Armed on the opposite column -> form the pair. Both cards are unlinked
  //    here (case 1 catches any linked tap and re-arms instead), so adding the
  //    mapping keeps it 1:1 without displacing an existing pair.
  const leftId = side === 'left' ? id : pending.id;
  const rightId = side === 'right' ? id : pending.id;
  return { pairs: { ...pairs, [leftId]: rightId }, pending: null };
}

/** Reset all connections. */
export function clearMatch(): MatchState {
  return { pairs: {}, pending: null };
}

/** Number of committed connections. */
export const matchPairCount = (state: MatchState): number => Object.keys(state.pairs).length;
