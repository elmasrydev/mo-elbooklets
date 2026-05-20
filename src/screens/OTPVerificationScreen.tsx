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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { tryFetchWithFallback } from '../config/api';
import { SEND_MOBILE_OTP_MUTATION, VERIFY_MOBILE_OTP_MUTATION } from '../graphql/mutations/otpMutations';
import { useOtpTimer } from '../hooks/useOtpTimer';
import * as SecureStore from 'expo-secure-store';
import { layout } from '../config/layout';
import { isDebugMode } from '../config/debug';

const OTP_LENGTH = 6;

const OTPVerificationScreen: React.FC = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, refreshUser, logout, skipVerification } = useAuth();
  const { showConfirm } = useModal();
  const { timeLeft, isActive, formattedTime, startTimer, clearTimer } = useOtpTimer();

  const [phase, setPhase] = useState<'send' | 'verify'>('send');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<TextInput>(null);

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
    }, [phase, canGoBack])
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

  const handleSendCode = async () => {
    if (!user?.mobile) return;
    
    try {
      setIsSending(true);
      setErrorMsg('');
      const token = await SecureStore.getItemAsync('auth_token');
      
      const result = await tryFetchWithFallback(
        SEND_MOBILE_OTP_MUTATION,
        { mobile: user.mobile, country_code: user.country_code || '+20' },
        token || undefined
      );
      
      if (result.data?.sendMobileOtp?.success) {
        const expiresIn = 120; // Enforce exactly 2 minutes (120s)
        startTimer(expiresIn);
        setPhase('verify');
      } else {
        showConfirm({
          title: t('common.error'),
          message: result.data?.sendMobileOtp?.message || result.errors?.[0]?.message || t('otp.whatsapp_failed'),
          confirmLabel: t('common.ok'),
          showCancel: false,
        });
      }
    } catch (err: any) {
      showConfirm({
        title: t('common.error'),
        message: err.message || t('otp.whatsapp_failed'),
        confirmLabel: t('common.ok'),
        showCancel: false,
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
      const token = await SecureStore.getItemAsync('auth_token');

      const result = await tryFetchWithFallback(
        VERIFY_MOBILE_OTP_MUTATION,
        { otp: otpCode },
        token || undefined
      );

      if (result.data?.verifyMobileOtp?.success) {
        clearTimer();
        
        // Refresh user data directly to get updated profile completeness
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
        const errMsg = result.data?.verifyMobileOtp?.message || result.errors?.[0]?.message || t('otp.invalid_code');
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

  const renderOtpInput = () => {
    return (
      <View style={styles.otpInputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otpCode}
          onChangeText={(text) => {
            setErrorMsg('');
            setOtpCode(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
          }}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus={false}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          importantForAutofill="yes"
        />
        <View style={styles.otpBoxesContainer} pointerEvents="none">
          {[...Array(OTP_LENGTH)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                {
                  borderColor: otpCode.length === index 
                    ? theme.colors.primary 
                    : otpCode.length > index 
                      ? theme.colors.border 
                      : theme.colors.border + '50',
                  backgroundColor: theme.colors.card,
                  borderRadius: borderRadius.md,
                },
                errorMsg ? { borderColor: theme.colors.error } : null
              ]}
            >
              <Text
                style={[
                  typography('h2'),
                  fontWeight('bold'),
                  { color: theme.colors.text }
                ]}
              >
                {otpCode[index] || ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPhase1 = () => (
    <View style={styles.phaseContainer}>
      <View style={[styles.iconContainer, { backgroundColor: '#25D36620', borderRadius: borderRadius['2xl'] }]}>
        <Ionicons name="logo-whatsapp" size={64} color="#25D366" />
      </View>
      
      <Text style={[typography('h2'), fontWeight('bold'), { color: theme.colors.text, marginTop: spacing.xl, textAlign: 'center' }]}>
        {t('otp.title')}
      </Text>
      
      <Text style={[typography('body'), { color: theme.colors.textSecondary, marginTop: spacing.md, textAlign: 'center', marginHorizontal: spacing.xl }]}>
        {t('otp.verify_mobile')}
      </Text>
      
      <View style={[styles.phoneBadge, { backgroundColor: theme.colors.card, borderRadius: borderRadius.lg, borderColor: theme.colors.border }]}>
        <Text style={[typography('body'), fontWeight('bold'), { color: theme.colors.text }]}>
          {(user?.country_code || '') + ' ' + (user?.mobile || '')}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton, 
          { 
            backgroundColor: (isSending || isActive) ? theme.colors.border : theme.colors.primary, 
            borderRadius: borderRadius.xl 
          }
        ]}
        onPress={handleSendCode}
        disabled={isSending || isActive}
      >
        {isSending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[typography('body'), fontWeight('bold'), { color: (isSending || isActive) ? theme.colors.textTertiary : '#fff' }]}>
            {isActive ? t('otp.resend_in', { time: formattedTime }) : t('otp.send_code')}
          </Text>
        )}
      </TouchableOpacity>
      
      {isActive && (
        <TouchableOpacity
          style={[
            styles.primaryButton, 
            { 
              backgroundColor: theme.colors.primary, 
              borderRadius: borderRadius.xl,
              marginTop: spacing.md
            }
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
          style={[
            styles.primaryButton, 
            { 
              backgroundColor: '#8B5CF6', 
              borderRadius: borderRadius.xl,
              marginTop: spacing.xl
            }
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
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20', borderRadius: borderRadius['2xl'] }]}>
        <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.primary} />
      </View>
      
      <Text style={[typography('h2'), fontWeight('bold'), { color: theme.colors.text, marginTop: spacing.xl, textAlign: 'center' }]}>
        {t('otp.enter_code')}
      </Text>
      
      <Text style={[typography('body'), { color: theme.colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', marginHorizontal: spacing.xl }]}>
        {t('otp.otp_sent_to')}
      </Text>
      
      <Text style={[typography('body'), fontWeight('bold'), { color: theme.colors.text, marginTop: spacing.xs, textAlign: 'center' }]}>
        <Ionicons name="logo-whatsapp" size={14} color="#25D366" /> {(user?.country_code || '') + ' ' + (user?.mobile || '')}
      </Text>

      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
        style={{ marginTop: spacing.xl }}
      >
        {renderOtpInput()}
      </TouchableOpacity>
      
      {errorMsg ? (
        <Text style={[typography('caption'), { color: theme.colors.error, marginTop: spacing.md, textAlign: 'center' }]}>
          {errorMsg}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.primaryButton, 
          { 
            backgroundColor: otpCode.length === OTP_LENGTH ? theme.colors.primary : theme.colors.border,
            borderRadius: borderRadius.xl,
            marginTop: spacing.xl
          }
        ]}
        onPress={handleVerifyCode}
        disabled={isVerifying || otpCode.length !== OTP_LENGTH}
      >
        {isVerifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[typography('body'), fontWeight('bold'), { color: otpCode.length === OTP_LENGTH ? '#fff' : theme.colors.textTertiary }]}>
            {t('otp.verify')}
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg }}>
        <Text style={[typography('caption'), { color: theme.colors.textSecondary, marginEnd: spacing.xs }]}>
          {isActive ? t('otp.resend_in', { time: formattedTime }) : ''}
        </Text>
        <TouchableOpacity
          onPress={handleSendCode}
          disabled={isActive || isSending}
        >
          <Text style={[typography('caption'), fontWeight('bold'), { color: isActive ? theme.colors.textTertiary : theme.colors.primary }]}>
            {t('otp.resend_code')}
          </Text>
        </TouchableOpacity>
      </View>
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
  otpInputContainer: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OTPVerificationScreen;
