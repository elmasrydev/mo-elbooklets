import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { apolloClient } from '../lib/apollo';
import {
  SendMobileOtpDocument,
  VerifyMobileOtpDocument,
  SendParentMobileOtpDocument,
  VerifyParentMobileOtpDocument,
} from '../generated/graphql';
import { useOtpTimer, DEFAULT_OTP_EXPIRY_SECONDS } from '../hooks/useOtpTimer';
import OtpCodeInput, { OTP_LENGTH } from '../components/OtpCodeInput';
import { layout } from '../config/layout';
import { isDebugMode } from '../config/debug';

type OtpAudience = 'student' | 'parent';

type OtpRouteParams = {
  OTPVerification: { audience?: OtpAudience } | undefined;
};

/**
 * The student and parent operations return identically shaped payloads under
 * different field names, so the audience picks both the document and the key.
 * Typing the mutation by that shape keeps one code path for both roles without
 * casting the generated union apart.
 */
interface OtpSendPayload {
  success: boolean;
  message?: string | null;
  expires_in?: number | null;
}

interface OtpVerifyPayload {
  success: boolean;
  message?: string | null;
  /* eslint-disable @typescript-eslint/no-explicit-any --
     The two audiences return different account shapes under different keys;
     both are handed straight to AuthContext's own typed updater. */
  user?: any;
  parent?: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const OTPVerificationScreen: React.FC = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OtpRouteParams, 'OTPVerification'>>();
  const {
    user,
    parentUser,
    refreshUser,
    updateUser,
    updateParentUser,
    logout,
    skipVerification,
    otpWasAutoSent,
    clearOtpAutoSent,
    otpShouldAutoRequest,
    clearOtpShouldAutoRequest,
  } = useAuth();
  const { showConfirm } = useModal();

  const audience: OtpAudience = route.params?.audience ?? 'student';
  const isParent = audience === 'parent';

  // The account whose number is being verified — the two roles never coexist in
  // one session, but the code is scoped to the audience either way (guide §2).
  const account = isParent ? parentUser : user;
  const sendDocument = isParent ? SendParentMobileOtpDocument : SendMobileOtpDocument;
  const verifyDocument = isParent ? VerifyParentMobileOtpDocument : VerifyMobileOtpDocument;
  const sendField = isParent ? 'sendParentMobileOtp' : 'sendMobileOtp';
  const verifyField = isParent ? 'verifyParentMobileOtp' : 'verifyMobileOtp';

  const { isActive, formattedTime, isExpired, hasLiveCode, startTimer, clearTimer } = useOtpTimer(
    isParent ? 'parent-verify' : 'student-verify',
  );

  const [phase, setPhase] = useState<'send' | 'verify'>('send');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<TextInput>(null);

  // On mount: determine initial state based on how user arrived
  useEffect(() => {
    if (otpWasAutoSent) {
      // register / login already had the backend send a code. No `expires_in`
      // rides along on the auth payload, so fall back to the documented 10min
      // lifetime; the 60s resend lock is derived from the send stamp regardless.
      clearOtpAutoSent();
      startTimer(DEFAULT_OTP_EXPIRY_SECONDS);
      setPhase('verify');
    } else if (otpShouldAutoRequest) {
      // Login of an unverified account: request the code now (auto mode so a
      // cooldown response is handled gracefully instead of as an error). (BKLT-275)
      clearOtpShouldAutoRequest();
      handleSendCode(true); // fires mutation → startTimer(expires_in) + setPhase('verify') on success
    }
    // Otherwise: existing unverified user re-opens app — useOtpTimer restores persisted timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus logic when entering verify phase
  useEffect(() => {
    if (phase === 'verify') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [phase]);

  const canGoBack = navigation.canGoBack();

  // Intercept Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (phase === 'verify') {
          // Go back to send phase
          setPhase('send');
          return true; // consumed
        }
        if (!canGoBack) {
          // Mandatory mode — block back entirely
          return true; // consumed, do nothing
        }
        return false; // let system handle it (canGoBack === true)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [phase, canGoBack]),
  );

  const handleBack = () => {
    if (phase === 'verify') {
      setPhase('send');
    } else if (canGoBack) {
      navigation.goBack();
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: t('common.logout_title', 'Log Out'),
      message: t('common.logout_desc', 'Are you sure you want to log out?'),
      confirmLabel: t('common.logout', 'Log Out'),
      onConfirm: async () => {
        await logout();
      },
    });
  };

  const handleSendCode = async (isAuto = false) => {
    if (!account?.mobile) return;

    try {
      setIsSending(true);
      setErrorMsg('');

      const result = await apolloClient.mutate<Record<string, OtpSendPayload | null>>({
        mutation: sendDocument,
        variables: { mobile: account.mobile, country_code: account.country_code || '+2' },
      });

      const response = result.data?.[sendField];

      if (response?.success) {
        // Countdown comes from the server, never a hardcoded guess (guide §1).
        startTimer(response.expires_in ?? DEFAULT_OTP_EXPIRY_SECONDS);
        setPhase('verify');
      } else if (isAuto) {
        // Auto-request after an unverified login. The backend usually rejects here
        // because a code was already sent (cooldown / rate-limit) — don't surface
        // that raw "wait before requesting again" text as an error. Move to the
        // verify step with a clear "your account isn't verified" message.
        // We deliberately do NOT start the resend timer: we can't tell a cooldown
        // (a code is already valid) from a genuine send failure (no code sent), and
        // starting it would lock resend with nothing arriving.
        // Leaving resend available lets the user pull a fresh code either way. (BKLT-275)
        setPhase('verify');
        showConfirm({
          title: t('otp.account_not_verified_title'),
          message: t('otp.account_not_verified_message'),
          confirmLabel: t('common.ok'),
          showCancel: false,
          onConfirm: () => {},
        });
      } else {
        // The only reason a send fails is a rate limit, and `message` arrives
        // pre-translated — show it as-is and never auto-retry (guide §5).
        showConfirm({
          title: t('common.error'),
          message: response?.message || t('otp.whatsapp_failed'),
          confirmLabel: t('common.ok'),
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      showConfirm({
        title: t('common.error'),
        message: err.message || t('otp.whatsapp_failed'),
        confirmLabel: t('common.ok'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== OTP_LENGTH) return;

    try {
      setIsVerifying(true);
      setErrorMsg('');

      const result = await apolloClient.mutate<Record<string, OtpVerifyPayload | null>>({
        mutation: verifyDocument,
        variables: { otp: otpCode },
      });

      const response = result.data?.[verifyField];

      if (response?.success) {
        clearTimer();

        // The response carries the freshly verified account. Apply it before
        // anything else: `refreshUser` swallows its own failures, so relying on
        // it alone leaves the navigator's gate closed on a flaky connection and
        // strands the user on this screen with a code they have already burnt.
        const verifiedAccount = response.parent ?? response.user;
        if (verifiedAccount) {
          if (isParent) {
            await updateParentUser(verifiedAccount);
          } else {
            await updateUser(verifiedAccount);
          }
        }

        // Best-effort: pulls the wider profile (completeness, avatar, ...).
        await refreshUser();

        showConfirm({
          title: t('common.success'),
          message: t('otp.verification_success'),
          confirmLabel: t('common.ok'),
          showCancel: false,
          onConfirm: () => {
            navigation.goBack();
          },
        });
      } else {
        const errMsg = response?.message || t('otp.invalid_code');
        setErrorMsg(errMsg);
        setOtpCode('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('otp.invalid_code'));
    } finally {
      setIsVerifying(false);
    }
  };

  const renderOtpInput = () => (
    <OtpCodeInput
      testID="otp-hidden-input"
      inputRef={inputRef}
      value={otpCode}
      hasError={!!errorMsg}
      onChange={(code) => {
        setErrorMsg('');
        setOtpCode(code);
      }}
    />
  );

  const renderPhase1 = () => (
    <View style={styles.phaseContainer}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: '#25D36620', borderRadius: borderRadius['2xl'] },
        ]}
      >
        <Ionicons name="logo-whatsapp" size={64} color="#25D366" />
      </View>

      <Text
        style={[
          typography('h2'),
          fontWeight('bold'),
          { color: theme.colors.text, marginTop: spacing.xl, textAlign: 'center' },
        ]}
      >
        {t('otp.title')}
      </Text>

      <Text
        style={[
          typography('body'),
          {
            color: theme.colors.textSecondary,
            marginTop: spacing.md,
            textAlign: 'center',
            marginHorizontal: spacing.xl,
          },
        ]}
      >
        {t('otp.verify_mobile')}
      </Text>

      <View
        style={[
          styles.phoneBadge,
          {
            backgroundColor: theme.colors.card,
            borderRadius: borderRadius.lg,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[typography('body'), fontWeight('bold'), { color: theme.colors.text }]}>
          {(account?.country_code || '') + ' ' + (account?.mobile || '')}
        </Text>
      </View>

      <TouchableOpacity
        testID="otp-send-button"
        style={[
          styles.primaryButton,
          {
            backgroundColor: isSending || isActive ? theme.colors.border : theme.colors.primary,
            borderRadius: borderRadius.xl,
          },
        ]}
        onPress={() => handleSendCode()}
        disabled={isSending || isActive}
      >
        {isSending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={[
              typography('body'),
              fontWeight('bold'),
              { color: isSending || isActive ? theme.colors.textTertiary : '#fff' },
            ]}
          >
            {isActive ? t('otp.resend_in', { time: formattedTime }) : t('otp.send_code')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Gated on the code's own life, not the 60s resend lock: a code stays
          usable for ten minutes, and hiding this would force the user to spend
          another message from a 3-per-hour budget to reach the same field. */}
      {hasLiveCode && (
        <TouchableOpacity
          testID="otp-enter-code-button"
          style={[
            styles.primaryButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.xl,
              marginTop: spacing.md,
            },
          ]}
          onPress={() => setPhase('verify')}
        >
          <Text style={[typography('body'), fontWeight('bold'), { color: '#fff' }]}>
            {t('otp.enter_code')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Trapped User Log Out Option */}
      <TouchableOpacity
        testID="otp-logout-button"
        style={{ marginTop: spacing.xl, padding: spacing.sm }}
        onPress={handleLogout}
      >
        <Text style={[typography('body'), fontWeight('bold'), { color: theme.colors.error }]}>
          {t('common.logout', 'Log Out')}
        </Text>
      </TouchableOpacity>

      {/* Debug Skip Button */}
      {isDebugMode() && (
        <TouchableOpacity
          testID="otp-skip-debug"
          style={[
            styles.primaryButton,
            {
              backgroundColor: '#8B5CF6',
              borderRadius: borderRadius.xl,
              marginTop: spacing.xl,
            },
          ]}
          onPress={skipVerification}
        >
          <Text style={[typography('body'), fontWeight('bold'), { color: '#fff' }]}>
            Skip OTP (Debug)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPhase2 = () => (
    <View style={styles.phaseContainer}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primary + '20', borderRadius: borderRadius['2xl'] },
        ]}
      >
        <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.primary} />
      </View>

      <Text
        style={[
          typography('h2'),
          fontWeight('bold'),
          { color: theme.colors.text, marginTop: spacing.xl, textAlign: 'center' },
        ]}
      >
        {t('otp.enter_code')}
      </Text>

      <Text
        style={[
          typography('body'),
          {
            color: theme.colors.textSecondary,
            marginTop: spacing.sm,
            textAlign: 'center',
            marginHorizontal: spacing.xl,
          },
        ]}
      >
        {t('otp.otp_sent_to')}
      </Text>

      <Text
        style={[
          typography('body'),
          fontWeight('bold'),
          { color: theme.colors.text, marginTop: spacing.xs, textAlign: 'center' },
        ]}
      >
        <Ionicons name="logo-whatsapp" size={14} color="#25D366" />{' '}
        {(account?.country_code || '') + ' ' + (account?.mobile || '')}
      </Text>

      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
        style={{ marginTop: spacing.xl }}
      >
        {renderOtpInput()}
      </TouchableOpacity>

      {errorMsg ? (
        <Text
          style={[
            typography('caption'),
            { color: theme.colors.error, marginTop: spacing.md, textAlign: 'center' },
          ]}
        >
          {errorMsg}
        </Text>
      ) : isExpired ? (
        <Text
          style={[
            typography('caption'),
            { color: theme.colors.error, marginTop: spacing.md, textAlign: 'center' },
          ]}
        >
          {t('otp.code_expired')}
        </Text>
      ) : null}

      <TouchableOpacity
        testID="otp-verify-button"
        style={[
          styles.primaryButton,
          {
            backgroundColor:
              otpCode.length === OTP_LENGTH ? theme.colors.primary : theme.colors.border,
            borderRadius: borderRadius.xl,
            marginTop: spacing.xl,
          },
        ]}
        onPress={handleVerifyCode}
        disabled={isVerifying || otpCode.length !== OTP_LENGTH}
      >
        {isVerifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={[
              typography('body'),
              fontWeight('bold'),
              { color: otpCode.length === OTP_LENGTH ? '#fff' : theme.colors.textTertiary },
            ]}
          >
            {t('otp.verify')}
          </Text>
        )}
      </TouchableOpacity>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.lg,
        }}
      >
        <Text
          style={[
            typography('caption'),
            { color: theme.colors.textSecondary, marginEnd: spacing.xs },
          ]}
        >
          {isActive ? t('otp.resend_in', { time: formattedTime }) : ''}
        </Text>
        <TouchableOpacity
          testID="otp-resend-button"
          onPress={() => handleSendCode()}
          disabled={isActive || isSending}
        >
          <Text
            style={[
              typography('caption'),
              fontWeight('bold'),
              { color: isActive ? theme.colors.textTertiary : theme.colors.primary },
            ]}
          >
            {t('otp.resend_code')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Skip Button */}
      {isDebugMode() && (
        <TouchableOpacity
          testID="otp-skip-debug-2"
          style={[
            styles.primaryButton,
            {
              backgroundColor: '#8B5CF6',
              borderRadius: borderRadius.xl,
              marginTop: spacing.xl,
            },
          ]}
          onPress={skipVerification}
        >
          <Text style={[typography('body'), fontWeight('bold'), { color: '#fff' }]}>
            Skip OTP (Debug)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader
        title={t('otp.title')}
        showBackButton={canGoBack || phase === 'verify'}
        onBackPress={handleBack}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: layout.screenPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {phase === 'send' ? renderPhase1() : renderPhase2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  phaseContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneBadge: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
});

export default OTPVerificationScreen;
