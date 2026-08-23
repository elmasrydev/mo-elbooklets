import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useTrialStatus } from '../context/TrialStatusContext';
import { isLockedOut } from '../utils/trialStatus';

/**
 * The one place that answers "may this student open paid content" (contract:
 * `mobile-trial-restrictions.md` §3 and §5).
 *
 * **Fail open.** Only a state we positively know to be unsubscribed blocks. An
 * unknown state — no trial query yet, a backend without the fields, a dropped
 * request — lets the student through and leaves the refusal to the server,
 * which is the authority anyway. Blocking on "we don't know" is how a paying
 * student ends up locked out of an app they can't fix.
 *
 * Every refusal shows the app's existing premium notice. There is deliberately
 * **no in-app subscription or purchase screen**: selling from inside the app is
 * a store-policy problem (Apple 3.1.1) and no IAP is planned for now, so the
 * modal informs and stops there.
 */
export const useSubscriptionGate = () => {
  const { user } = useAuth();
  const { status } = useTrialStatus();
  const { showConfirm } = useModal();
  const { t } = useTranslation();

  /**
   * The live trial query wins over the copy cached at sign-in: that snapshot
   * can be days old, and it is what let an expired student keep passing the
   * gate (and a freshly upgraded one keep failing it).
   */
  const isSubscriptionBlocked = status
    ? isLockedOut(status)
    : !!user && user.is_subscribed === false;

  /** The app's standard premium notice — the only paywall surface there is. */
  const showPremiumNotice = useCallback(() => {
    showConfirm({
      title: t('subscription.required_title'),
      message: t('subscription.required_message'),
      showCancel: false,
      onConfirm: () => {},
    });
  }, [showConfirm, t]);

  /** Blocked? Returns false (and, unless muted, says why). */
  const checkSubscription = useCallback(
    (options?: { skipModal?: boolean }) => {
      if (!isSubscriptionBlocked) return true;
      if (!options?.skipModal) showPremiumNotice();
      return false;
    },
    [isSubscriptionBlocked, showPremiumNotice],
  );

  // `showPremiumNotice` is also what a locked *row* raises: the trial's
  // per-subject lesson allowance (or a plan covering a different subject)
  // leaves the student unblocked at app level, so `checkSubscription` passes
  // and nothing else would explain why that row will not open.
  return { checkSubscription, showPremiumNotice };
};
