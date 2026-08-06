/**
 * Rules for reading `subscriptionPlans` and validating a purchase selection.
 *
 * Kept pure and structural (each function asks for the fields it needs, not the
 * whole generated query type) so the packages screen holds only rendering and
 * these rules can be tested directly.
 */

/** The plan fields these rules depend on — a structural subset of `SubscriptionPlanOption`. */
export interface PlanRules {
  requiresSubjectSelection: boolean;
  allowedSubjectsCount?: number | null;
}

/** The localizable plan fields, a structural subset of `SubscriptionPlanOption`. */
export interface PlanText {
  name: string;
  description?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
}

export type AppLanguage = 'ar' | 'en';

/**
 * `lessonLimit` / `quizLimitPerDay` mean "unlimited" as either null or 0 — the
 * backend uses both. Rendering a raw 0 would read as "no lessons at all".
 */
export const isUnlimited = (limit?: number | null): boolean =>
  limit === null || limit === undefined || limit === 0;

/**
 * Plan names come back already localized per the request's `lang` header, but the
 * response is cached: switching language in-app would keep showing the language
 * that was current when it was fetched. Preferring the explicit per-language
 * fields keeps the label in step with the UI without a re-fetch.
 */
export const planDisplayName = (plan: PlanText, language: AppLanguage): string =>
  (language === 'ar' ? plan.nameAr : plan.nameEn) || plan.name;

export const planDescription = (plan: PlanText, language: AppLanguage): string | null =>
  (language === 'ar' ? plan.descriptionAr : plan.descriptionEn) || plan.description || null;

export type SubjectSelectionError = 'none_selected' | 'over_limit';

export interface SubjectSelectionState {
  isValid: boolean;
  error: SubjectSelectionError | null;
  /** Max subjects this plan accepts, or null when it takes none (full access). */
  limit: number | null;
}

/**
 * A `per_subject` plan needs at least one subject and at most
 * `allowedSubjectsCount`; a full-access plan takes none at all and sends
 * `subjectIds: null`.
 */
export const subjectSelectionState = (
  plan: PlanRules,
  selectedIds: readonly string[],
): SubjectSelectionState => {
  if (!plan.requiresSubjectSelection) {
    return { isValid: true, error: null, limit: null };
  }
  const limit = plan.allowedSubjectsCount ?? null;
  if (selectedIds.length === 0) {
    return { isValid: false, error: 'none_selected', limit };
  }
  if (limit !== null && selectedIds.length > limit) {
    return { isValid: false, error: 'over_limit', limit };
  }
  return { isValid: true, error: null, limit };
};

/**
 * The `subjectIds` argument for `createPaymobCheckout`: the picked ids for a
 * per_subject plan, and null for full access (the mutation rejects a list there).
 */
export const checkoutSubjectIds = (
  plan: PlanRules,
  selectedIds: readonly string[],
): string[] | null => (plan.requiresSubjectSelection ? [...selectedIds] : null);

export interface CheckoutEligibility {
  plan: PlanRules | null;
  selectedIds: readonly string[];
  hasPendingOrder: boolean;
  hasFullAccess: boolean;
}

/**
 * The single gate for the buy button. A pending order or an already-complete
 * grade is rejected by the mutation anyway, so the screen never offers it.
 */
export const canStartCheckout = ({
  plan,
  selectedIds,
  hasPendingOrder,
  hasFullAccess,
}: CheckoutEligibility): boolean => {
  if (!plan || hasPendingOrder || hasFullAccess) return false;
  return subjectSelectionState(plan, selectedIds).isValid;
};

/**
 * Drop selections that the latest `selectableSubjects` no longer offers. The list
 * is re-fetched on focus and before checkout, and a subject can disappear from it
 * (another device subscribed to it), which would otherwise fail at checkout.
 */
export const pruneSelectedSubjects = (
  selectedIds: readonly string[],
  selectableSubjects: readonly { id: string }[],
): string[] => {
  const available = new Set(selectableSubjects.map((s) => s.id));
  return selectedIds.filter((id) => available.has(id));
};

/**
 * Toggle capped at the plan's limit: picking past it is ignored rather than
 * silently dropping an earlier choice, so the student stays in control of which
 * subjects they lose.
 */
export const toggleSubjectSelection = (
  selectedIds: readonly string[],
  subjectId: string,
  limit: number | null,
): string[] => {
  if (selectedIds.includes(subjectId)) {
    return selectedIds.filter((id) => id !== subjectId);
  }
  if (limit !== null && selectedIds.length >= limit) {
    return [...selectedIds];
  }
  return [...selectedIds, subjectId];
};
