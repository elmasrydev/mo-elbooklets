/**
 * A student only holds a competitive position once they have actually earned
 * XP (BKLT-326). The backend ranks everyone in scope, so a subject nobody has
 * attempted comes back as a full board of 0 XP / 0% students ordered #1, #2,
 * … — which reads as "Yahia beat Hanan" when neither has done anything.
 *
 * Zero-XP students always sort last, so dropping them never disturbs the rank
 * numbers of the students above; when every entry is zero the caller is left
 * with an empty list and shows its "no rankings yet" state.
 */
export const isRanked = (entry: { xp: number }): boolean => entry.xp > 0;

export const rankedEntries = <T extends { xp: number }>(entries: readonly T[]): T[] =>
  entries.filter(isRanked);
