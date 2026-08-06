import {
  canStartCheckout,
  checkoutSubjectIds,
  isUnlimited,
  planDescription,
  planDisplayName,
  pruneSelectedSubjects,
  subjectSelectionState,
  toggleSubjectSelection,
} from '../../utils/subscriptionPlans';

const perSubject = { requiresSubjectSelection: true, allowedSubjectsCount: 2 };
const fullAccess = { requiresSubjectSelection: false, allowedSubjectsCount: null };

describe('isUnlimited', () => {
  // The backend expresses "no limit" as either null or 0, and a raw 0 on screen
  // would read as "no lessons at all".
  it.each([null, undefined, 0])('treats %p as unlimited', (limit) => {
    expect(isUnlimited(limit as number | null | undefined)).toBe(true);
  });

  it.each([1, 5, 100])('treats %p as a real limit', (limit) => {
    expect(isUnlimited(limit)).toBe(false);
  });
});

describe('plan text', () => {
  const plan = {
    name: 'server localized',
    description: 'server description',
    nameAr: 'اشتراك مادة',
    nameEn: 'Single subject',
    descriptionAr: 'وصف عربي',
    descriptionEn: 'English description',
  };

  it('follows the app language rather than the cached server string', () => {
    expect(planDisplayName(plan, 'ar')).toBe('اشتراك مادة');
    expect(planDisplayName(plan, 'en')).toBe('Single subject');
    expect(planDescription(plan, 'ar')).toBe('وصف عربي');
    expect(planDescription(plan, 'en')).toBe('English description');
  });

  it('falls back to the server-localized field when a language is missing', () => {
    const partial = { name: 'server localized', nameAr: null, nameEn: null };
    expect(planDisplayName(partial, 'ar')).toBe('server localized');
    expect(planDescription(partial, 'en')).toBeNull();
  });
});

describe('subjectSelectionState', () => {
  it('accepts any selection for a full-access plan', () => {
    expect(subjectSelectionState(fullAccess, [])).toEqual({
      isValid: true,
      error: null,
      limit: null,
    });
  });

  it('requires at least one subject for a per-subject plan', () => {
    expect(subjectSelectionState(perSubject, [])).toEqual({
      isValid: false,
      error: 'none_selected',
      limit: 2,
    });
  });

  it('rejects more subjects than the plan allows', () => {
    expect(subjectSelectionState(perSubject, ['1', '2', '3'])).toEqual({
      isValid: false,
      error: 'over_limit',
      limit: 2,
    });
  });

  it('accepts a selection at the limit', () => {
    expect(subjectSelectionState(perSubject, ['1', '2']).isValid).toBe(true);
  });

  it('accepts any count when the plan states no limit', () => {
    const noLimit = { requiresSubjectSelection: true, allowedSubjectsCount: null };
    expect(subjectSelectionState(noLimit, ['1', '2', '3']).isValid).toBe(true);
  });
});

describe('checkoutSubjectIds', () => {
  it('sends null for a full-access plan', () => {
    expect(checkoutSubjectIds(fullAccess, ['1'])).toBeNull();
  });

  it('sends the picked ids for a per-subject plan', () => {
    expect(checkoutSubjectIds(perSubject, ['1', '2'])).toEqual(['1', '2']);
  });
});

describe('canStartCheckout', () => {
  const base = {
    plan: perSubject,
    selectedIds: ['1'],
    hasPendingOrder: false,
    hasFullAccess: false,
  };

  it('allows a valid selection', () => {
    expect(canStartCheckout(base)).toBe(true);
  });

  it('blocks when no plan is chosen', () => {
    expect(canStartCheckout({ ...base, plan: null })).toBe(false);
  });

  // Both of these are rejected by the mutation, so the button never offers them.
  it('blocks while an earlier order awaits approval', () => {
    expect(canStartCheckout({ ...base, hasPendingOrder: true })).toBe(false);
  });

  it('blocks when the grade is already fully covered', () => {
    expect(canStartCheckout({ ...base, hasFullAccess: true })).toBe(false);
  });

  it('blocks an invalid subject selection', () => {
    expect(canStartCheckout({ ...base, selectedIds: [] })).toBe(false);
  });
});

describe('pruneSelectedSubjects', () => {
  it('drops subjects the server no longer offers', () => {
    expect(pruneSelectedSubjects(['1', '2', '3'], [{ id: '1' }, { id: '3' }])).toEqual(['1', '3']);
  });

  it('empties the selection when nothing is selectable', () => {
    expect(pruneSelectedSubjects(['1'], [])).toEqual([]);
  });
});

describe('toggleSubjectSelection', () => {
  it('adds and removes', () => {
    expect(toggleSubjectSelection([], '1', 2)).toEqual(['1']);
    expect(toggleSubjectSelection(['1', '2'], '1', 2)).toEqual(['2']);
  });

  // Silently dropping an earlier pick would take the choice away from the student.
  it('ignores a pick past the limit instead of replacing one', () => {
    expect(toggleSubjectSelection(['1', '2'], '3', 2)).toEqual(['1', '2']);
  });

  it('still allows deselecting while at the limit', () => {
    expect(toggleSubjectSelection(['1', '2'], '2', 2)).toEqual(['1']);
  });

  it('adds without bound when there is no limit', () => {
    expect(toggleSubjectSelection(['1', '2'], '3', null)).toEqual(['1', '2', '3']);
  });
});
