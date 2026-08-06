import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useLanguage } from '../../context/LanguageContext';
import { usePaymentAccess } from '../../context/PaymentAccessContext';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import PlanCard from '../../components/payment/PlanCard';
import {
  StartPaymobCheckoutDocument,
  SubscriptionPlansDocument,
  SubscriptionPlansQuery,
} from '../../generated/graphql';
import { loadFailureMessage } from '../../utils/queryError';
import { INPUT_TEXT_ALIGN } from '../../lib/rtl';
import { isArabicText } from '../../config/fonts';
import { analytics } from '../../lib/analytics';
import { logError } from '../../utils/logger';
import {
  canStartCheckout,
  checkoutSubjectIds,
  planDisplayName,
  pruneSelectedSubjects,
  subjectSelectionState,
  toggleSubjectSelection,
} from '../../utils/subscriptionPlans';
import { readPendingPayment, savePendingPayment } from '../../utils/paymentStorage';
import { PendingPaymentRecord } from '../../utils/paymobCheckout';

type Plan = SubscriptionPlansQuery['subscriptionPlans']['plans'][number];

/**
 * The subscription plan picker.
 *
 * Plans are always re-read from the network before checkout: prices, plans and
 * the already-subscribed subject list all move server-side, and a stale planId
 * or a subject bought meanwhile is rejected by the mutation.
 */
const PackagesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography } = useTypography();
  const { language } = useLanguage();
  const { isPaymentAllowed } = usePaymentAccess();
  const { refreshUser } = useAuth();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentRecord | null>(null);

  const { data, loading, error, refetch } = useQuery(SubscriptionPlansDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const [startCheckout] = useMutation(StartPaymobCheckoutDocument);

  const result = data?.subscriptionPlans;
  const plans = useMemo(() => result?.plans ?? [], [result]);
  const selectableSubjects = useMemo(() => result?.selectableSubjects ?? [], [result]);
  const hasPendingOrder = result?.hasPendingOrder ?? false;
  const hasFullAccess = result?.hasFullAccess ?? false;

  const selectedPlan = useMemo<Plan | null>(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  // The flag can be switched off while this screen is open; it is the only thing
  // standing between the store build and a purchase surface, so leaving is the
  // safe response rather than letting the screen linger.
  useEffect(() => {
    if (!isPaymentAllowed && navigation.canGoBack()) navigation.goBack();
  }, [isPaymentAllowed, navigation]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      // A checkout that never resolved on this device — the app was killed, or an
      // offline method is still awaiting payment. Offer to confirm it rather than
      // letting the student pay twice for the same thing.
      void readPendingPayment().then(setPendingPayment);
    }, [refetch]),
  );

  // A subject can leave `selectableSubjects` between fetches (bought on another
  // device), and a plan can be withdrawn — both would fail at checkout.
  useEffect(() => {
    setSelectedSubjectIds((current) => pruneSelectedSubjects(current, selectableSubjects));
  }, [selectableSubjects]);

  useEffect(() => {
    if (selectedPlanId && !plans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(null);
    }
  }, [plans, selectedPlanId]);

  const selection = selectedPlan ? subjectSelectionState(selectedPlan, selectedSubjectIds) : null;
  const canBuy =
    canStartCheckout({
      plan: selectedPlan,
      selectedIds: selectedSubjectIds,
      hasPendingOrder,
      hasFullAccess,
    }) && !isStarting;

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds((current) =>
      toggleSubjectSelection(current, subjectId, selection?.limit ?? null),
    );
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || isStarting) return;
    setCheckoutError(null);
    setIsStarting(true);
    const planLabel = planDisplayName(selectedPlan, language === 'ar' ? 'ar' : 'en');

    try {
      // Re-read the plans first: this is the last moment the selection can be
      // checked against what the server currently offers.
      const fresh = await refetch();
      const freshResult = fresh.data?.subscriptionPlans;
      if (freshResult?.hasPendingOrder || freshResult?.hasFullAccess) {
        setCheckoutError(t('payment.selection_changed'));
        return;
      }
      if (!freshResult?.plans.some((plan) => plan.id === selectedPlan.id)) {
        setSelectedPlanId(null);
        setCheckoutError(t('payment.selection_changed'));
        return;
      }

      const trimmedPromo = promoCode.trim();
      const { data: checkoutData } = await startCheckout({
        variables: {
          planId: selectedPlan.id,
          subjectIds: checkoutSubjectIds(selectedPlan, selectedSubjectIds),
          promoCode: trimmedPromo.length > 0 ? trimmedPromo : null,
        },
      });

      const checkout = checkoutData?.createPaymobCheckout;
      if (!checkout) {
        setCheckoutError(t('payment.start_failed'));
        return;
      }

      analytics.track('Payment Checkout Started', {
        plan_id: selectedPlan.id,
        reference: checkout.reference,
        free_order: checkout.status === 'active',
      });

      // A fully-discounted order is already live; there is nothing to pay and no
      // URL to open, so it skips the webview entirely.
      if (checkout.status === 'active' || !checkout.checkoutUrl) {
        await refreshUser();
        navigation.navigate('PaymobCheckout', {
          freeOrder: true,
          planLabel,
        });
        return;
      }

      if (checkout.reference) {
        await savePendingPayment({
          reference: checkout.reference,
          planLabel,
          startedAt: Date.now(),
        });
      }

      navigation.navigate('PaymobCheckout', {
        checkoutUrl: checkout.checkoutUrl,
        reference: checkout.reference,
        planLabel,
      });
    } catch (mutationError) {
      // Promo rejection and plan validation both arrive here as GraphQL errors,
      // already worded for the student by the backend.
      const message = (mutationError as { message?: string })?.message;
      setCheckoutError(message || t('payment.start_failed'));
      logError('Paymob checkout could not be started', mutationError);
    } finally {
      setIsStarting(false);
    }
  };

  const s = styles(theme, spacing, borderRadius);
  const failure = loadFailureMessage(data, error, t('payment.plans_load_failed'));

  const renderBody = () => {
    if (loading && !result) return <GenericListSkeleton />;

    if (failure) {
      return (
        <View style={s.stateBox} testID="packages-error">
          <Ionicons name="alert-circle-outline" size={44} color={theme.colors.error} />
          <Text style={[typography('body'), s.stateText]}>{failure}</Text>
          <Text style={[typography('caption'), s.stateHint]}>
            {t('payment.plans_load_failed_hint')}
          </Text>
          <AppButton title={t('common.retry')} onPress={() => void refetch()} fullWidth={false} />
        </View>
      );
    }

    if (hasFullAccess) {
      return (
        <View style={s.stateBox} testID="packages-full-access">
          <Ionicons name="checkmark-circle" size={44} color={theme.colors.success} />
          <Text style={[typography('h3', '700'), s.stateText]}>
            {t('payment.full_access_title')}
          </Text>
          <Text style={[typography('caption'), s.stateHint]}>
            {t('payment.full_access_message')}
          </Text>
        </View>
      );
    }

    if (hasPendingOrder) {
      return (
        <View style={s.stateBox} testID="packages-pending-order-notice">
          <Ionicons name="time-outline" size={44} color={theme.colors.warning} />
          <Text style={[typography('h3', '700'), s.stateText]}>
            {t('payment.pending_order_title')}
          </Text>
          <Text style={[typography('caption'), s.stateHint]}>
            {t('payment.pending_order_message')}
          </Text>
          <AppButton title={t('common.retry')} onPress={() => void refetch()} fullWidth={false} />
        </View>
      );
    }

    if (plans.length === 0) {
      return (
        <View style={s.stateBox} testID="packages-empty">
          <Ionicons name="pricetags-outline" size={44} color={theme.colors.textTertiary} />
          <Text style={[typography('body'), s.stateText]}>{t('payment.no_plans')}</Text>
        </View>
      );
    }

    return (
      <>
        {/* Server order is meaningful (cheapest first) — never re-sorted here. */}
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedPlanId}
            onPress={() => setSelectedPlanId(plan.id)}
          />
        ))}

        {selectedPlan?.requiresSubjectSelection ? (
          <View style={s.section}>
            <Text style={[typography('h3', '700'), s.sectionTitle]}>
              {t('payment.choose_subjects')}
            </Text>
            <Text style={[typography('caption'), s.sectionHint]}>
              {selection?.limit
                ? t('payment.choose_subjects_limit', { count: selection.limit })
                : t('payment.choose_subjects_any')}
            </Text>
            <View style={s.subjectGrid}>
              {selectableSubjects.map((subject) => {
                const isSelected = selectedSubjectIds.includes(subject.id);
                return (
                  <TouchableOpacity
                    key={subject.id}
                    testID={`packages-subject-${subject.id}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    activeOpacity={0.85}
                    onPress={() => handleSubjectToggle(subject.id)}
                    style={[s.subjectChip, isSelected && s.subjectChipSelected]}
                  >
                    <Text
                      style={[
                        typography(
                          'caption',
                          isSelected ? '600' : undefined,
                          isArabicText(subject.name),
                        ),
                        s.subjectText,
                        isSelected && s.subjectTextSelected,
                      ]}
                    >
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selection?.error === 'none_selected' ? (
              <Text style={[typography('caption'), s.inlineError]}>
                {t('payment.select_at_least_one')}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={s.section}>
          <Text style={[typography('h3', '700'), s.sectionTitle]}>{t('payment.promo_title')}</Text>
          <TextInput
            testID="packages-promo-input"
            value={promoCode}
            onChangeText={(value) => {
              setPromoCode(value);
              setCheckoutError(null);
            }}
            placeholder={t('payment.promo_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[typography('body'), s.promoInput]}
            textAlign={INPUT_TEXT_ALIGN}
          />
          <Text style={[typography('caption'), s.sectionHint]}>{t('payment.promo_hint')}</Text>
        </View>

        {checkoutError ? (
          <Text testID="packages-checkout-error" style={[typography('caption'), s.inlineError]}>
            {checkoutError}
          </Text>
        ) : null}
      </>
    );
  };

  return (
    <View style={s.container}>
      <UnifiedHeader showBackButton title={t('payment.packages_title')} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {pendingPayment ? (
          <TouchableOpacity
            testID="packages-pending-payment-banner"
            activeOpacity={0.85}
            style={s.pendingBanner}
            onPress={() =>
              navigation.navigate('PaymobCheckout', {
                reference: pendingPayment.reference,
                planLabel: pendingPayment.planLabel,
              })
            }
          >
            <Ionicons name="hourglass-outline" size={20} color={theme.colors.warningText} />
            <Text style={[typography('caption'), s.pendingBannerText]}>
              {t('payment.unconfirmed_payment')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.warningText} />
          </TouchableOpacity>
        ) : null}
        {renderBody()}
      </ScrollView>

      {plans.length > 0 && !hasPendingOrder && !hasFullAccess ? (
        <View style={s.footer}>
          <AppButton
            testID="packages-subscribe-button"
            title={t('payment.subscribe_now')}
            onPress={handleSubscribe}
            disabled={!canBuy}
            loading={isStarting}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    section: {
      marginTop: spacing.mdd,
    },
    sectionTitle: {
      color: theme.colors.text,
      textAlign: 'left',
    },
    sectionHint: {
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginTop: spacing.xxs,
    },
    subjectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.ssm,
    },
    subjectChip: {
      paddingHorizontal: spacing.ssm,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    subjectChipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary50,
    },
    subjectText: {
      color: theme.colors.textSecondary,
      textAlign: 'left',
    },
    subjectTextSelected: {
      color: theme.colors.primary,
    },
    promoInput: {
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
      paddingHorizontal: spacing.ssm,
      paddingVertical: spacing.ssm,
    },
    pendingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.ssm,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.warningBackground,
      marginBottom: spacing.ssm,
    },
    pendingBannerText: {
      flex: 1,
      color: theme.colors.warningText,
      textAlign: 'left',
    },
    inlineError: {
      color: theme.colors.error,
      textAlign: 'left',
      marginTop: spacing.sm,
    },
    stateBox: {
      alignItems: 'center',
      gap: spacing.ssm,
      paddingVertical: spacing['3xl'],
    },
    stateText: {
      color: theme.colors.text,
      textAlign: 'center',
    },
    stateHint: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });

export default PackagesScreen;
