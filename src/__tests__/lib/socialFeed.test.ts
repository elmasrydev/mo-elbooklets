import { resolveFeedCard } from '../../utils/socialFeed';

// BKLT-317: items the feed cannot render used to vanish silently, so a feed
// that was arriving but unrenderable looked identical to an empty one.
describe('resolveFeedCard', () => {
  it('maps each known type with its payload to a card', () => {
    expect(resolveFeedCard({ type: 'quiz_completion', quizData: { score: 8 } })).toBe(
      'quiz_completion',
    );
    expect(resolveFeedCard({ type: 'new_connection', connectedUser: { id: '2' } })).toBe(
      'new_connection',
    );
    expect(resolveFeedCard({ type: 'rank_change', rankData: { newRank: 3 } })).toBe('rank_change');
  });

  it('refuses a known type whose payload never arrived', () => {
    expect(resolveFeedCard({ type: 'quiz_completion' })).toBeNull();
    expect(resolveFeedCard({ type: 'quiz_completion', quizData: null })).toBeNull();
    expect(resolveFeedCard({ type: 'rank_change', rankData: null })).toBeNull();
  });

  it('refuses a type the app does not know', () => {
    // The schema types this field as String, so casing or a new backend type
    // are both real possibilities.
    expect(resolveFeedCard({ type: 'QUIZ_COMPLETION', quizData: { score: 8 } })).toBeNull();
    expect(resolveFeedCard({ type: 'badge_earned', quizData: { score: 8 } })).toBeNull();
    expect(resolveFeedCard({ type: '' })).toBeNull();
  });
});
