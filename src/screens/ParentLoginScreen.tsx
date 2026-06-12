import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isDebugMode } from '../config/debug';

const EGYPT_MOBILE_REGEX = /^01[0125]\d{8}$/;

const ParentLoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(isDebugMode());
  const [isLoading, setIsLoading] = useState(false);

  // Validation States
  const [touchedMobile, setTouchedMobile] = useAutoReset(false);
  const [touchedPassword, setTouchedPassword] = useAutoReset(false);
  const isMobileValid = EGYPT_MOBILE_REGEX.test(mobile.trim());
  const isPasswordValid = password.length >= 6;

  const passwordRef = useRef<TextInput>(null);

  const { parentLogin } = useAuth();
  const { showConfirm } = useModal();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setTouchedMobile(true);
    setTouchedPassword(true);

    if (!isMobileValid || !isPasswordValid) {
      let errorMsg = t('auth.fill_all_fields');
      if (!isMobileValid && mobile.trim().length > 0) {
        errorMsg = t('auth.invalid_egyptian_mobile');
      } else if (!isPasswordValid && password.length > 0) {
        errorMsg = t('auth.password_min_6');
      }

      showConfirm({
        title: t('common.error'),
        message: errorMsg,
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await parentLogin({ mobile: mobile.trim(), password });
      if (!result.success) {
        const rawError = (result.error || '').toLowerCase();
        let errorKey = 'auth.invalid_credentials';

        if (
          rawError.includes('not found') ||
          rawError.includes('no account') ||
          rawError.includes('no user')
        ) {
          errorKey = 'auth.no_account_found';
        } else if (
          rawError.includes('password') ||
          rawError.includes('incorrect') ||
          rawError.includes('wrong')
        ) {
          errorKey = 'auth.incorrect_password';
        }

        showConfirm({
          title: t('auth.login_failed'),
          message: t(errorKey),
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (error) {
      console.error('Parent login screen error:', error);
      showConfirm({
        title: t('common.error'),
        message: t('common.unexpected_error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyles = useMemo(
    () =>
      styles({
        theme,
        fontSizes,
        spacing,
        borderRadius,
        isRTL,
        typography,
        fontWeight,
        insets,
      }),
    [theme, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight, insets],
  );

  const getBorderColor = (touched: boolean, valid: boolean, value: string) => {
    if (!touched && value.length === 0) return theme.colors.border;
    if (touched && !valid) return theme.colors.error || '#FF6B6B';
    if (value.length > 0 && valid) return theme.colors.primary;
    return theme.colors.border;
  };

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
        {/* Fixed Header */}
        <View style={currentStyles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={currentStyles.backButton}>
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('auth.parent_login_title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <View style={currentStyles.hero}>
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.title}>{t('auth.welcome_back')}</Text>
          <Text style={currentStyles.subtitle}>{t('auth.sign_in_subtitle')}</Text>
        </View>

        {/* Form Card */}
        <View style={currentStyles.card}>
          <View style={currentStyles.form}>
            {/* Mobile */}
            <View style={currentStyles.inputGroup}>
              <Text style={currentStyles.inputLabel}>{t('auth.mobile_placeholder')}</Text>
              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor(touchedMobile, isMobileValid, mobile) },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={touchedMobile && !isMobileValid ? '#FF6B6B' : theme.colors.textTertiary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  testID="parent-login-mobile"
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={mobile}
                  onChangeText={(val) => setMobile(val.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                  returnKeyType="next"
                  onBlur={() => setTouchedMobile(true)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={currentStyles.inputGroup}>
              <View style={currentStyles.labelRow}>
                <Text style={currentStyles.inputLabel}>{t('auth.password_placeholder')}</Text>
                <TouchableOpacity
                  testID="parent-login-forgot-password"
                  onPress={() => navigation.navigate('ParentForgotPassword')}
                >
                  <Text style={currentStyles.forgotText}>{t('auth.forgot_password')}</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor(touchedPassword, isPasswordValid, password) },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    touchedPassword && !isPasswordValid ? '#FF6B6B' : theme.colors.textTertiary
                  }
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  testID="parent-login-password"
                  ref={passwordRef}
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  editable={!isLoading}
                  returnKeyType="done"
                  onBlur={() => setTouchedPassword(true)}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  testID="parent-login-toggle-password"
                  onPress={() => setShowPassword(!showPassword)}
                  style={currentStyles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              testID="parent-login-submit"
              style={[currentStyles.submitButton, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={currentStyles.submitButtonText}>{t('auth.sign_in')}</Text>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" style={{ marginStart: 8 }} />
              ) : (
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color="#FFF"
                  style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Area */}
        <View style={currentStyles.footerContainer}>
          {/* Language Toggle */}
          <TouchableOpacity
            testID="parent-login-language-toggle"
            style={currentStyles.langButton}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            activeOpacity={0.7}
          >
            <Ionicons name="language-outline" size={18} color={theme.colors.primary} />
            <Text style={currentStyles.langText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={currentStyles.footer}>
            <Text style={currentStyles.footerText}>{t('auth.dont_have_account')} </Text>
            <TouchableOpacity
              testID="parent-login-register-link"
              onPress={() => navigation.navigate('ParentRegister')}
              disabled={isLoading}
            >
              <Text style={currentStyles.linkText}>{t('auth.sign_up')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, insets, typography, fontWeight, fontSizes, isRTL } = config;
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
    hero: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    logo: { width: 90, height: 70, marginBottom: spacing.md },
    title: {
      fontSize: 28,
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
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
    labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    forgotText: { ...typography('caption'), ...fontWeight('600'), color: '#005ab4' },
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
    inputIcon: { marginHorizontal: spacing.xs },
    eyeIcon: { padding: spacing.xs },
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
    footerContainer: {
      marginTop: spacing.md,
    },
    langButton: {
      marginTop: spacing.lg,
      alignSelf: 'center',
      padding: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    langText: { ...typography('bodySmall'), color: theme.colors.primary, ...fontWeight('600') },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
    footerText: { ...typography('body'), color: theme.colors.textSecondary },
    linkText: { ...typography('body'), ...fontWeight('700'), color: '#005ab4' },
    bottomAccent: { height: 8, backgroundColor: theme.colors.primary },
  });
};

export default ParentLoginScreen;
