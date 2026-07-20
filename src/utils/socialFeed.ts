/** The card kinds the community feed knows how to render. */
export type FeedCardKind = 'quiz_completion' | 'new_connection' | 'rank_change';

interface RenderableFeedItem {
  type: string;
  quizData?: unknown;
  connectedUser?: unknown;
  rankData?: unknown;
}

/**
 * Which card renders this feed item, or null when the app cannot render it.
 *
 * `NewsFeedItem.type` is a String in the schema, not an enum, so nothing
 * guarantees the values the backend sends — and a known type whose payload is
 * missing is equally unrenderable. Both cases used to disappear from the feed
 * with no error and no empty state, which is invisible during a
 * "why is my feed blank" investigation (BKLT-317). Callers must report a null
 * rather than dropping the item quietly.
 */
export const resolveFeedCard = (item: RenderableFeedItem): FeedCardKind | null => {
  if (item.type === 'quiz_completion' && item.quizData) return 'quiz_completion';
  if (item.type === 'new_connection' && item.connectedUser) return 'new_connection';
  if (item.type === 'rank_change' && item.rankData) return 'rank_change';
  return null;
};
