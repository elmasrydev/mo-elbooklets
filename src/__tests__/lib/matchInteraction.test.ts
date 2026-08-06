import {
  matchTap,
  clearMatch,
  matchPairCount,
  EMPTY_MATCH_STATE,
  type MatchState,
} from '../../utils/matchInteraction';

describe('matchTap', () => {
  it('arms a card on first tap without forming a pair', () => {
    const next = matchTap(EMPTY_MATCH_STATE, 'left', 'L0');
    expect(next.pending).toEqual({ side: 'left', id: 'L0' });
    expect(next.pairs).toEqual({});
  });

  it('forms a pair when a card on the opposite column is tapped', () => {
    let state = matchTap(EMPTY_MATCH_STATE, 'left', 'L0');
    state = matchTap(state, 'right', 'R1');
    expect(state.pairs).toEqual({ L0: 'R1' });
    expect(state.pending).toBeNull();
  });

  it('pairs the same regardless of which column is tapped first', () => {
    let state = matchTap(EMPTY_MATCH_STATE, 'right', 'R1');
    state = matchTap(state, 'left', 'L0');
    expect(state.pairs).toEqual({ L0: 'R1' });
    expect(state.pending).toBeNull();
  });

  it('disarms when the armed card is tapped again', () => {
    let state = matchTap(EMPTY_MATCH_STATE, 'left', 'L0');
    state = matchTap(state, 'left', 'L0');
    expect(state.pending).toBeNull();
    expect(state.pairs).toEqual({});
  });

  it('moves the arm when another card on the same column is tapped', () => {
    let state = matchTap(EMPTY_MATCH_STATE, 'left', 'L0');
    state = matchTap(state, 'left', 'L1');
    expect(state.pending).toEqual({ side: 'left', id: 'L1' });
    expect(state.pairs).toEqual({});
  });

  it('unlinks and re-arms when a linked card is tapped', () => {
    let state: MatchState = { pairs: { L0: 'R1' }, pending: null };
    state = matchTap(state, 'left', 'L0');
    expect(state.pairs).toEqual({});
    expect(state.pending).toEqual({ side: 'left', id: 'L0' });
  });

  it('unlinks from the right side too', () => {
    let state: MatchState = { pairs: { L0: 'R1' }, pending: null };
    state = matchTap(state, 'right', 'R1');
    expect(state.pairs).toEqual({});
    expect(state.pending).toEqual({ side: 'right', id: 'R1' });
  });

  it('unlinks and re-arms a linked target rather than stealing it in one tap', () => {
    // L0->R1 exists; arming L2 then tapping the linked R1 unlinks it and arms
    // R1 (the L2 arm is dropped) — matching the mockup's linked-card branch,
    // which pre-empts pairing. A one-tap steal is deliberately not offered.
    let state: MatchState = { pairs: { L0: 'R1' }, pending: null };
    state = matchTap(state, 'left', 'L2');
    state = matchTap(state, 'right', 'R1');
    expect(state.pairs).toEqual({});
    expect(state.pending).toEqual({ side: 'right', id: 'R1' });
  });

  it('never mutates the input state', () => {
    const state: MatchState = { pairs: { L0: 'R1' }, pending: null };
    const snapshot = JSON.stringify(state);
    matchTap(state, 'left', 'L2');
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('re-pairs a left to a free right in two taps', () => {
    // L0->R0 exists; move L0 to the unused R1: tap L0 (unlink + arm), tap R1.
    let state: MatchState = { pairs: { L0: 'R0' }, pending: null };
    state = matchTap(state, 'left', 'L0');
    state = matchTap(state, 'right', 'R1');
    expect(state.pairs).toEqual({ L0: 'R1' });
    expect(matchPairCount(state)).toBe(1);
  });
});

describe('clearMatch / matchPairCount', () => {
  it('clears all connections', () => {
    expect(clearMatch()).toEqual({ pairs: {}, pending: null });
  });

  it('counts committed connections only', () => {
    expect(
      matchPairCount({ pairs: { L0: 'R0', L1: 'R1' }, pending: { side: 'left', id: 'L2' } }),
    ).toBe(2);
  });
});
