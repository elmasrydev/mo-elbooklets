import { isRanked, rankedEntries } from '../../utils/leaderboard';

// BKLT-326: a subject nobody has attempted came back as a full board of
// 0 XP students ordered #1, #2, … , presenting one as the top performer.
describe('leaderboard ranking eligibility', () => {
  it('excludes students who have not earned any XP', () => {
    const entries = [
      { id: '1', xp: 120, rank: 1 },
      { id: '2', xp: 40, rank: 2 },
      { id: '3', xp: 0, rank: 3 },
    ];

    expect(rankedEntries(entries).map((e) => e.id)).toEqual(['1', '2']);
  });

  it('leaves the surviving entries their original rank numbers', () => {
    // Zero-XP students sort last, so removing them cannot renumber anyone.
    const entries = [
      { id: '1', xp: 120, rank: 1 },
      { id: '2', xp: 0, rank: 2 },
    ];

    expect(rankedEntries(entries)).toEqual([{ id: '1', xp: 120, rank: 1 }]);
  });

  it('returns nothing when the whole board is on zero', () => {
    const entries = [
      { id: '1', xp: 0, rank: 1 },
      { id: '2', xp: 0, rank: 2 },
    ];

    expect(rankedEntries(entries)).toEqual([]);
  });

  it('counts a student as ranked only once they have XP', () => {
    expect(isRanked({ xp: 1 })).toBe(true);
    expect(isRanked({ xp: 0 })).toBe(false);
  });
});
