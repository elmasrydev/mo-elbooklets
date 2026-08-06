import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  AppState,
  Linking,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import useAndroidBack from '../../hooks/useAndroidBack';
import { usePaymentStatusPoll } from '../../hooks/usePaymentStatusPoll';
import { isExternalScheme, isPaymobReturnUrl } from '../../utils/paymobCheckout';
import { clearPendingPayment } from '../../utils/paymentStorage';
import AppButton from '../../components/AppButton';
import { analytics } from '../../lib/analytics';

interface PaymobCheckoutParams {
  checkoutUrl?: string;
  reference?: string;
  planLabel?: string;
  /** A fully-discounted order: already active, nothing to pay. */
  freeOrder?: boolean;
}

/**
 * Hosts Paymob's hosted checkout and then confirms the outcome.
 *
 * The result is a state of this screen rather than a separate route, so the
 * Android back gesture during confirmation cannot strand the student on a
 * half-finished purchase. The checkout URL carries a client secret and is
 * therefore never logged or sent to analytics — only the reference is.
 */
const PaymobCheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { checkoutUrl, reference, planLabel, freeOrder } = (route.params ??
    {}) as PaymobCheckoutParams;
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography } = useTypography();
  const { showConfirm } = useModal();
  const { refreshUser } = useAuth();

  const { phase, failureReason, start, recheck } = usePaymentStatusPoll();
  const [isWebviewOpen, setIsWebviewOpen] = useState(!freeOrder && !!checkoutUrl);
  const hasSettled = useRef(false);

  const effectivePhase = freeOrder ? 'success' : phase;

  const closeWebviewAndConfirm = useCallback(() => {
    setIsWebviewOpen(false);
    if (reference) start(reference);
  }, [reference, start]);

  // Recovery entry: opened with a reference but nothing to pay for — a checkout
  // that was started earlier and never resolved on this device (the app was
  // killed, or an offline method is still awaiting payment).
  useEffect(() => {
    if (!freeOrder && !isWebviewOpen && reference && phase === 'idle') start(reference);
  }, [freeOrder, isWebviewOpen, reference, phase, start]);

  // Closing the webview says nothing about the payment — the card may already
  // have been charged — so a cancel confirms just like a completed redirect.
  const confirmLeaveWebview = useCallback(() => {
    showConfirm({
      title: t('payment.leave_checkout_title'),
      message: t('payment.leave_checkout_message'),
      confirmLabel: t('payment.leave_checkout_confirm'),
      cancelLabel: t('common.cancel'),
      showCancel: true,
      onConfirm: closeWebviewAndConfirm,
    });
  }, [showConfirm, t, closeWebviewAndConfirm]);

  useAndroidBack(() => {
    if (isWebviewOpen) {
      confirmLeaveWebview();
      return true;
    }
    if (effectivePhase === 'confirming') return true;
    return false;
  });

  // A late webhook can land while the app is backgrounded; coming back is the
  // cheapest moment to look again.
  useEffect(() => {
    if (effectivePhase !== 'still_pending') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck();
    });
    return () => subscription.remove();
  }, [effectivePhase, recheck]);

  useEffect(() => {
    if (hasSettled.current) return;

    if (effectivePhase === 'success') {
      hasSettled.current = true;
      void clearPendingPayment();
      void refreshUser();
      analytics.track('Payment Completed', {
        reference: reference ?? null,
        free_order: !!freeOrder,
      });
      return;
    }
    if (effectivePhase === 'failed') {
      hasSettled.current = true;
      void clearPendingPayment();
      analytics.track('Payment Failed', { reference: reference ?? null });
      return;
    }
    if (effectivePhase === 'still_pending') {
      analytics.track('Payment Pending Timeout', { reference: reference ?? null });
    }
  }, [effectivePhase, refreshUser, reference, freeOrder]);

  const handleNavigationChange = (event: WebViewNavigation) => {
    if (isPaymobReturnUrl(event.url)) closeWebviewAndConfirm();
  };

  // 3-D Secure steps and wallet apps hand off through their own schemes, which
  // the webview cannot render.
  const handleShouldStartLoad = (request: WebViewNavigation): boolean => {
    if (isPaymobReturnUrl(request.url)) {
      closeWebviewAndConfirm();
      return false;
    }
    if (isExternalScheme(request.url)) {
      void Linking.openURL(request.url).catch(() => undefined);
      return false;
    }
    return true;
  };

  const s = styles(theme, spacing, borderRadius);

  if (isWebviewOpen && checkoutUrl) {
    return (
      <View style={s.container}>
        <View style={s.webviewBar}>
          <TouchableOpacity
            testID="paymob-close-button"
            onPress={confirmLeaveWebview}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[typography('body', '600'), s.webviewTitle]} numberOfLines={1}>
            {t('payment.secure_checkout')}
          </Text>
          <Ionicons name="lock-closed" size={18} color={theme.colors.success} />
        </View>
        <WebView
          testID="paymob-webview"
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          startInLoadingState
          renderLoading={() => (
            <View style={s.webviewLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        />
      </View>
    );
  }

  const renderResult = () => {
    switch (effectivePhase) {
      case 'success':
        return (
          <View style={s.stateBox} testID="payment-success">
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
            <Text style={[typography('h3', '700'), s.stateTitle]}>
              {t('payment.success_title')}
            </Text>
            <Text style={[typography('body'), s.stateText]}>
              {planLabel
                ? t('payment.success_message_plan', { plan: planLabel })
                : t('payment.success_message')}
            </Text>
            <AppButton
              testID="payment-success-continue"
              title={t('payment.start_learning')}
              onPress={() => navigation.navigate('MainTabs')}
            />
          </View>
        );

      case 'failed':
        return (
          <View style={s.stateBox} testID="payment-failed">
            <Ionicons name="close-circle" size={64} color={theme.colors.error} />
            <Text style={[typography('h3', '700'), s.stateTitle]}>{t('payment.failed_title')}</Text>
            {/* Server-worded and already translated — shown as-is. */}
            <Text style={[typography('body'), s.stateText]}>
              {failureReason || t('payment.failed_message')}
            </Text>
            <AppButton
              testID="payment-retry-button"
              title={t('payment.try_again')}
              onPress={() => navigation.goBack()}
            />
          </View>
        );

      case 'still_pending':
        return (
          <View style={s.stateBox} testID="payment-still-pending">
            <Ionicons name="hourglass-outline" size={64} color={theme.colors.warning} />
            <Text style={[typography('h3', '700'), s.stateTitle]}>
              {t('payment.pending_title')}
            </Text>
            <Text style={[typography('body'), s.stateText]}>{t('payment.pending_message')}</Text>
            <AppButton
              testID="payment-recheck-button"
              title={t('payment.check_again')}
              onPress={recheck}
            />
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
              <Text style={[typography('body', '600'), s.secondaryAction]}>
                {t('payment.back_to_app')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={s.stateBox} testID="payment-confirming">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[typography('h3', '700'), s.stateTitle]}>
              {t('payment.confirming_title')}
            </Text>
            <Text style={[typography('body'), s.stateText]}>{t('payment.confirming_message')}</Text>
          </View>
        );
    }
  };

  return <View style={s.container}>{renderResult()}</View>;
};

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webviewBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.ssm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.ssm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    webviewTitle: {
      flex: 1,
      color: theme.colors.text,
      textAlign: 'left',
    },
    webviewLoading: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    stateBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },
    stateTitle: {
      color: theme.colors.text,
      textAlign: 'center',
    },
    stateText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    secondaryAction: {
      color: theme.colors.primary,
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
  });

export default PaymobCheckoutScreen;
