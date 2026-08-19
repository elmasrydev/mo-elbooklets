import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';
import { useModal } from '../context/ModalContext';
import { useAutoReset } from '../hooks/useAutoReset';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EMAIL_REGEX, EGYPT_MOBILE_REGEX, PASSWORD_REGEX } from '../utils/validators';
import { INPUT_TEXT_ALIGN } from '../lib/rtl';
import { apolloClient } from '../lib/apollo';
import {
  SendPasswordResetOtpDocument,
  ResetPasswordWithOtpDocument,
  SendParentPasswordResetOtpDocument,
  ResetParentPasswordWithOtpDocument,
} from '../generated/graphql';
import { useOtpTimer, DEFAULT_OTP_EXPIRY_SECONDS } from '../hooks/useOtpTimer';
import OtpCodeInput, { OTP_LENGTH } from '../components/OtpCodeInput';
import { digitsOnly } from '../utils/digits';
import { isDebugMode } from '../config/debug';

type ResetAudience = 'student' | 'parent';

type ForgotPasswordRouteParams = {
  ForgotPassword: { audience?: ResetAudience; fromProfile?: boolean } | undefined;
};

/** The national number is always sent with its leading zero and `+2` (guide section 1). */
const COUNTRY_CODE = '+2';

interface OtpSendPayload {
  success: boolean;
  message?: string | null;
  expires_in?: number | null;
}

interface ResetPayload {
  success: boolean;
  message?: string | null;
}

/**
 * Password recovery for both audiences.
 *
 * WhatsApp code first — both roles sign in by mobile and `email` is nullable on
 * student accounts, so the email link reaches only a minority (guide section 4).
 * The email path stays as a secondary option for someone who no longer holds the
 * number.
 *
 * Three entry points converge here: the student login screen, the parent login
 * screen, and the profile (`fromProfile`, with the signed-in number prefilled).
 */
const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ForgotPasswordRouteParams, 'ForgotPassword'>>();
  const audience: ResetAudience = route.params?.audience ?? 'student';
  const fromProfile = route.params?.fromProfile ?? false;
  const isParent = audience === 'parent';

  const { forgotPassword, parentForgotPassword, user, parentUser, logout } = useAuth();
  const account = isParent ? parentUser : user;

  const [step, setStep] = useState<'mobile' | 'code' | 'email'>('mobile');
  const [mobile, setMobile] = useState(fromProfile ? (account?.mobile ?? '') : '');
  const [email, setEmail] = useState(fromProfile ? (account?.email ?? '') : '');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(isDebugMode());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [touchedEmail, setTouchedEmail] = useAutoReset(false);
  const [touchedMobile, setTouchedMobile] = useAutoReset(false);
  const codeInputRef = useRef<TextInput>(null);

  const { showConfirm } = useModal();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const {
    isActive,
    formattedTime,
    isExpired,
    hasLiveCode,
    sentTo,
    sendCount,
    hasReachedSendLimit,
    startTimer,
    clearTimer,
  } = useOtpTimer(isParent ? 'parent-reset' : 'student-reset');

  // Someone who reached this screen from their profile already has an email on
  // file or does not — offering the link when we know there is none is a dead end.
  const canUseEmail = !fromProfile || !!account?.email;

  const isMobileValid = EGYPT_MOBILE_REGEX.test(mobile);

  const showError = (message: string) =>
    showConfirm({
      title: t('common.error'),
      message,
      showCancel: false,
      onConfirm: () => {},
    });

  /**
   * Sends a code and moves to the code step.
   *
   * Deliberately NOT shared with the mobile-step Continue button: that one may
   * reuse a live code, this one must always spend a message. Wiring resend
   * through the reuse shortcut makes it a silent no-op for the code's whole
   * 10-minute life — the user taps it, nothing happens, and they cannot recover
   * their account.
   */
  const handleSendCode = async (): Promise<boolean> => {
    setTouchedMobile(true);
    if (!isMobileValid) {
      showError(t('auth.invalid_egyptian_mobile'));
      return false;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await apolloClient.mutate<Record<string, OtpSendPayload | null>>({
        mutation: isParent ? SendParentPasswordResetOtpDocument : SendPasswordResetOtpDocument,
        variables: { mobile, country_code: COUNTRY_CODE },
      });

      const response =
        result.data?.[isParent ? 'sendParentPasswordResetOtp' : 'sendPasswordResetOtp'];

      if (response?.success) {
        startTimer(response.expires_in ?? DEFAULT_OTP_EXPIRY_SECONDS, mobile);
        // Advance whether or not the number is registered: the API deliberately
        // returns the same payload either way, and stopping early here would
        // leak exactly what that shared response exists to hide (guide section 4).
        setOtpCode('');
        setStep('code');
        return true;
      } else {
        // A send only ever fails because of a rate limit, and `message` arrives
        // pre-translated. Show it and stop — retrying lengthens the lockout.
        showError(response?.message || t('common.unexpected_error'));
      }
    } catch {
      showError(t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  /**
   * Mobile-step Continue. Always attempts a send — silently skipping it because
   * a code already exists makes the button look broken, which is exactly what a
   * user tapping "Continue" is not expecting.
   *
   * When the server refuses because one was sent moments ago, we still walk to
   * the code step IF we know a live code exists for this number: the server's
   * message explains the wait, and the code they already hold stays reachable.
   * Without that, a rate-limited send left them stranded on this step with no
   * route to the code field (guide §5).
   */
  const handleContinue = async () => {
    const sent = await handleSendCode();
    if (!sent && hasLiveCode && sentTo === mobile) {
      setErrorMsg('');
      setStep('code');
    }
  };

  const handleResetPassword = async () => {
    if (otpCode.length !== OTP_LENGTH) {
      setErrorMsg(t('otp.invalid_code'));
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setErrorMsg(t('auth.password_min_8'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwords_not_match'));
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await apolloClient.mutate<Record<string, ResetPayload | null>>({
        mutation: isParent ? ResetParentPasswordWithOtpDocument : ResetPasswordWithOtpDocument,
        variables: {
          mobile,
          country_code: COUNTRY_CODE,
          otp: otpCode,
          password,
          password_confirmation: confirmPassword,
        },
        // A partial response carries field errors alongside data; read both.
        errorPolicy: 'all',
      });

      const response =
        result.data?.[isParent ? 'resetParentPasswordWithOtp' : 'resetPasswordWithOtp'];

      if (response?.success) {
        await clearTimer();
        // The server revoked every token for this account, including the one
        // this app is holding. Never reuse it and never auto-login.
        const leaveResetFlow = async () => {
          if (fromProfile) {
            await logout();
          } else {
            navigation.navigate(isParent ? 'ParentLogin' : 'Login');
          }
        };
        showConfirm({
          title: t('auth.reset_success_title'),
          message: t('auth.reset_success_message'),
          showCancel: false,
          // `showCancel: false` only hides the button — the modal would still be
          // dismissible by its ✕ or the backdrop, and that path skips onConfirm,
          // stranding the app on a session whose token the server just killed.
          dismissible: false,
          onConfirm: leaveResetFlow,
          onCancel: leaveResetFlow,
        });
        return;
      }

      // Password-policy violations (too short, mismatched) arrive as top-level
      // GraphQL errors rather than as success:false — handle both shapes.
      if (result.error) {
        setErrorMsg(result.error.message);
        return;
      }

      setErrorMsg(response?.message || t('otp.invalid_code'));
    } catch (error: any) {
      setErrorMsg(error?.message || t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailLink = async () => {
    setTouchedEmail(true);
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      showError(t('auth.invalid_email_format'));
      return;
    }

    setIsLoading(true);
    try {
      const result = isParent ? await parentForgotPassword(trimmed) : await forgotPassword(trimmed);

      if (result.success) {
        showConfirm({
          title: t('auth.forgot_password_success_title'),
          message: t('auth.forgot_password_success_message'),
          showCancel: false,
          onConfirm: () => navigation.goBack(),
        });
      } else {
        showConfirm({
          title: t('auth.forgot_password_failed'),
          message: result.message || t('common.unexpected_error'),
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch {
      showError(t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'mobile') {
      navigation.goBack();
    } else {
      setErrorMsg('');
      setStep('mobile');
    }
  };

  const currentStyles = styles({
    theme,
    spacing,
    borderRadius,
    typography,
    fontWeight,
    insets,
  });

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (v: string) => void,
    testID: string,
    toggleTestID: string,
  ) => (
    <View style={currentStyles.inputGroup}>
      <Text style={currentStyles.inputLabel}>{label}</Text>
      <View style={currentStyles.inputWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={theme.colors.textTertiary}
          style={currentStyles.inputIcon}
        />
        <TextInput
          testID={testID}
          style={[currentStyles.input, { textAlign: INPUT_TEXT_ALIGN }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={label}
          placeholderTextColor={theme.colors.textTertiary}
          editable={!isLoading}
        />
        <TouchableOpacity testID={toggleTestID} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMobileStep = () => (
    <>
      <View style={currentStyles.header}>
        <View style={currentStyles.iconCircle}>
          <Ionicons name="logo-whatsapp" size={40} color="#25D366" />
        </View>
        <Text style={currentStyles.title}>{t('auth.forgot_password')}</Text>
        <Text style={currentStyles.subtitle}>{t('auth.forgot_password_subtitle')}</Text>
      </View>

      <View style={currentStyles.card}>
        <View style={currentStyles.form}>
          <View style={currentStyles.inputGroup}>
            <Text style={currentStyles.inputLabel}>{t('auth.mobile_number')}</Text>
            <View
              style={[
                currentStyles.inputWrapper,
                touchedMobile &&
                  !isMobileValid &&
                  mobile.length > 0 && { borderColor: theme.colors.error || '#FF6B6B' },
              ]}
            >
              <View
                style={[
                  currentStyles.countryCodeContainer,
                  isRTL
                    ? { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }
                    : { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
                ]}
              >
                <Text style={currentStyles.countryCodeText}>🇪🇬 {COUNTRY_CODE} </Text>
              </View>
              <TextInput
                testID="forgot-mobile-input"
                style={[currentStyles.input, { textAlign: INPUT_TEXT_ALIGN }]}
                value={mobile}
                onChangeText={(val) => setMobile(digitsOnly(val).slice(0, 11))}
                maxLength={11}
                placeholder={t('auth.mobile_placeholder')}
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onBlur={() => setTouchedMobile(true)}
              />
            </View>
            {touchedMobile && !isMobileValid && mobile.length > 0 && (
              <Text style={currentStyles.errorText}>{t('auth.invalid_egyptian_mobile')}</Text>
            )}
          </View>

          <TouchableOpacity
            testID="forgot-send-button"
            style={[currentStyles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text style={currentStyles.submitButtonText}>{t('common.continue')}</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons
                name={isRTL ? 'arrow-back-outline' : 'arrow-forward-outline'}
                size={20}
                color="#FFF"
              />
            )}
          </TouchableOpacity>

          {canUseEmail && (
            <TouchableOpacity
              testID="forgot-email-link"
              style={currentStyles.secondaryLink}
              onPress={() => setStep('email')}
            >
              <Text style={currentStyles.secondaryLinkText}>
                {t('auth.reset_by_email_instead')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={currentStyles.header}>
        <View style={currentStyles.iconCircle}>
          <Ionicons name="chatbubbles-outline" size={40} color="#005ab4" />
        </View>
        <Text style={currentStyles.title}>{t('auth.set_new_password')}</Text>
        <Text style={currentStyles.subtitle}>{t('otp.otp_sent_to')}</Text>
        <Text style={currentStyles.mobileBadge}>
          {COUNTRY_CODE} {mobile}
        </Text>
      </View>

      <View style={currentStyles.card}>
        <View style={currentStyles.form}>
          <TouchableOpacity
            onPress={() => codeInputRef.current?.focus()}
            activeOpacity={1}
            style={{ marginBottom: spacing.lg }}
          >
            <OtpCodeInput
              testID="forgot-otp-hidden-input"
              inputRef={codeInputRef}
              value={otpCode}
              hasError={!!errorMsg}
              onChange={(code) => {
                setErrorMsg('');
                setOtpCode(code);
              }}
            />
          </TouchableOpacity>

          {renderPasswordField(
            t('profile.new_password'),
            password,
            setPassword,
            'forgot-new-password-input',
            'forgot-new-password-toggle',
          )}
          {renderPasswordField(
            t('profile.confirm_new_password'),
            confirmPassword,
            setConfirmPassword,
            'forgot-confirm-password-input',
            'forgot-confirm-password-toggle',
          )}

          {/* The policy hint and the validation error carry the same sentence —
              show only one of them so it never appears twice. */}
          {!errorMsg && <Text style={currentStyles.hintText}>{t('auth.password_min_8')}</Text>}

          {errorMsg ? (
            <Text style={currentStyles.errorText}>{errorMsg}</Text>
          ) : isExpired ? (
            <Text style={currentStyles.errorText}>{t('otp.code_expired')}</Text>
          ) : null}

          <TouchableOpacity
            testID="forgot-reset-button"
            style={[currentStyles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <Text style={currentStyles.submitButtonText}>{t('auth.reset_password_button')}</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons
                name={isRTL ? 'arrow-back-outline' : 'arrow-forward-outline'}
                size={20}
                color="#FFF"
              />
            )}
          </TouchableOpacity>

          <View style={currentStyles.resendRow}>
            <Text style={currentStyles.resendHint}>
              {isActive ? t('otp.resend_in', { time: formattedTime }) : ''}
            </Text>
            <TouchableOpacity
              testID="forgot-resend-button"
              onPress={handleSendCode}
              disabled={isActive || isLoading || hasReachedSendLimit}
              accessibilityState={{ disabled: isActive || isLoading || hasReachedSendLimit }}
            >
              <Text
                style={[
                  currentStyles.secondaryLinkText,
                  (isActive || hasReachedSendLimit) && { color: theme.colors.textTertiary },
                ]}
              >
                {t('otp.resend_code')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* BKLT-287: once the allowance is spent, a disabled link with no
              explanation reads as a broken button — say why, and give them the
              only route left. */}
          {hasReachedSendLimit ? (
            <View style={currentStyles.limitBox} testID="forgot-resend-limit">
              <Text style={currentStyles.limitText}>{t('otp.resend_limit_reached')}</Text>
              <TouchableOpacity
                testID="forgot-contact-support"
                onPress={() => navigation.navigate('ContactUs')}
                style={currentStyles.supportButton}
                activeOpacity={0.8}
              >
                <Ionicons name="headset-outline" size={18} color="#005ab4" />
                <Text style={currentStyles.supportButtonText}>{t('common.contact_support')}</Text>
              </TouchableOpacity>
            </View>
          ) : sendCount > 0 && !isActive ? (
            <Text style={currentStyles.resendNoticeText} testID="forgot-resend-notice">
              {t('otp.resend_invalidates_previous')}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );

  const renderEmailStep = () => (
    <>
      <View style={currentStyles.header}>
        <View style={currentStyles.iconCircle}>
          <Ionicons name="mail-outline" size={40} color="#005ab4" />
        </View>
        <Text style={currentStyles.title}>{t('auth.forgot_password')}</Text>
        <Text style={currentStyles.subtitle}>{t('auth.forgot_password_email_subtitle')}</Text>
      </View>

      <View style={currentStyles.card}>
        <View style={currentStyles.form}>
          <View style={currentStyles.inputGroup}>
            <Text style={currentStyles.inputLabel}>{t('auth.email_label')}</Text>
            <View
              style={[
                currentStyles.inputWrapper,
                touchedEmail &&
                  !EMAIL_REGEX.test(email) && { borderColor: theme.colors.error || '#FF6B6B' },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.textTertiary}
                style={currentStyles.inputIcon}
              />
              <TextInput
                testID="forgot-email-input"
                style={[currentStyles.input, { textAlign: INPUT_TEXT_ALIGN }]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholder={t('auth.email_placeholder_parent')}
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="email-address"
                editable={!isLoading}
                onBlur={() => setTouchedEmail(true)}
              />
            </View>
            {touchedEmail && !EMAIL_REGEX.test(email) && email.length > 0 && (
              <Text style={currentStyles.errorText}>{t('auth.invalid_email_format')}</Text>
            )}
          </View>

          <TouchableOpacity
            testID="forgot-submit-button"
            style={[currentStyles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSendEmailLink}
            disabled={isLoading}
          >
            <Text style={currentStyles.submitButtonText}>{t('common.continue')}</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons
                name={isRTL ? 'arrow-back-outline' : 'arrow-forward-outline'}
                size={20}
                color="#FFF"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="forgot-whatsapp-link"
            style={currentStyles.secondaryLink}
            onPress={() => setStep('mobile')}
          >
            <Text style={currentStyles.secondaryLinkText}>
              {t('auth.reset_by_whatsapp_instead')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={currentStyles.headerTop}>
          <TouchableOpacity
            testID="forgot-back-button"
            onPress={handleBack}
            style={currentStyles.backButton}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('auth.forgot_password')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {step === 'mobile' && renderMobileStep()}
        {step === 'code' && renderCodeStep()}
        {step === 'email' && renderEmailStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, typography, fontWeight, insets } = config;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: insets.bottom + spacing.md,
    },
    card: {
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#01174B',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 15,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    header: { alignItems: 'center', padding: spacing.xl },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 26,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: '#01174B',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    title: { fontSize: 24, ...fontWeight('700'), color: '#005ab4', textAlign: 'center' },
    subtitle: {
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    mobileBadge: {
      ...typography('body'),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 4,
    },
    form: { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.xl },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
      textAlign: 'left',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      borderWidth: 1,
      borderColor: 'rgba(193, 198, 213, 0.4)',
      borderRadius: 12,
      backgroundColor: '#f2f3fd',
      paddingHorizontal: spacing.sm,
    },
    countryCodeContainer: {
      paddingHorizontal: spacing.xs,
      justifyContent: 'center',
      height: '100%',
    },
    countryCodeText: {
      ...typography('body'),
      ...fontWeight('600'),
      color: '#181c22',
    },
    inputIcon: { marginHorizontal: spacing.xs },
    input: {
      flex: 1,
      fontSize: 15,
      color: '#181c22',
      height: '100%',
      paddingHorizontal: spacing.sm,
    },
    submitButton: {
      height: 56,
      backgroundColor: '#005ab4',
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#005ab4',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    submitButtonText: { ...typography('button'), ...fontWeight('700'), color: '#FFFFFF' },
    secondaryLink: { marginTop: spacing.lg, alignItems: 'center' },
    secondaryLinkText: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: '#005ab4',
      textAlign: 'center',
    },
    limitBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: 'rgba(217,119,6,0.25)',
      gap: spacing.sm,
    },
    limitText: {
      ...typography('caption'),
      color: '#92400E',
      textAlign: 'left',
    },
    supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 6,
    },
    supportButtonText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#005ab4',
    },
    resendNoticeText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginTop: spacing.sm,
    },
    resendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.lg,
    },
    resendHint: { ...typography('caption'), color: theme.colors.textSecondary },
    hintText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginBottom: spacing.xs,
    },
    errorText: { ...typography('caption'), color: '#FF6B6B', marginTop: 4, textAlign: 'left' },
  });
};

export default ForgotPasswordScreen;
