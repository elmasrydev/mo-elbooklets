import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';

export const useSubscriptionGate = () => {
  const { user } = useAuth();
  const { showConfirm } = useModal();
  const { t } = useTranslation();

  const checkSubscription = useCallback(
    (options?: { skipModal?: boolean }) => {
      // Check if explicitly false, "false", 0, or "0"
      const isSubscribed = user?.is_subscribed;
      const isExplicitlyFalse =
        isSubscribed === false ||
        String(isSubscribed).toLowerCase() === 'false' ||
        (isSubscribed as any) === 0 ||
        String(isSubscribed) === '0';

      if (user && isExplicitlyFalse) {
        if (!options?.skipModal) {
          showConfirm({
            title: t('subscription.required_title', 'Subscription Required'),
            message: t(
              'subscription.required_message',
              'You must subscribe to access all features. Please subscribe to continue.',
            ),
            showCancel: false,
            onConfirm: () => {}, // Just dismiss the popup
          });
        }
        return false; // Not allowed
      }
      return true; // Allowed (either subscribed or field not present yet)
    },
    [user, showConfirm, t],
  );

  return { checkSubscription };
};
