import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { usePaymentAccess } from '../context/PaymentAccessContext';
import { useTranslation } from 'react-i18next';

export const useSubscriptionGate = () => {
  const { user } = useAuth();
  const { showConfirm } = useModal();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { isPaymentAllowed } = usePaymentAccess();

  /** Send the student to the plan picker. Only ever offered when the backend allows buying. */
  const openPackages = useCallback(() => {
    navigation.navigate('Packages');
  }, [navigation]);

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
            // Buying is only offered where the backend permits it; everywhere
            // else this stays the informational notice it has always been.
            confirmLabel: isPaymentAllowed ? t('payment.subscribe_now') : undefined,
            showCancel: isPaymentAllowed,
            onConfirm: isPaymentAllowed ? openPackages : () => {},
          });
        }
        return false; // Not allowed
      }
      return true; // Allowed (either subscribed or field not present yet)
    },
    [user, showConfirm, t, isPaymentAllowed, openPackages],
  );

  return { checkSubscription, isPaymentAllowed, openPackages };
};
