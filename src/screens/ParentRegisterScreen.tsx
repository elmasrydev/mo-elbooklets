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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAutoReset } from '../hooks/useAutoReset';

const EGYPT_MOBILE_REGEX = /^01[0125]\d{8}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const ParentRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Touch States for Inline Validation
  const [touchedName, setTouchedName] = useAutoReset(false);
  const [touchedMobile, setTouchedMobile] = useAutoReset(false);
  const [touchedPassword, setTouchedPassword] = useAutoReset(false);
  const [touchedConfirm, setTouchedConfirm] = useAutoReset(false);

  const mobileRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { parentRegister } = useAuth();
  const { showConfirm } = useModal();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  // Validation Flags
  const isNameValid = name.trim().length >= 3;
  const isMobileValid = EGYPT_MOBILE_REGEX.test(mobile.trim());
  const isPasswordStrong = STRONG_PASSWORD_REGEX.test(password);
  const isConfirmValid = password === confirmPassword && password.length > 0;

  const getBorderColor = (touched: boolean, valid: boolean, value: string) => {
    if (!touched && value.length === 0) return theme.colors.border;
    if (touched && !valid) return theme.colors.error || '#FF6B6B';
    if (value.length > 0 && valid) return theme.colors.primary;
    return theme.colors.border;
  };

  const handleRegister = async () => {
    setTouchedName(true);
    setTouchedMobile(true);
    setTouchedPassword(true);
    setTouchedConfirm(true);

    if (!isNameValid || !isMobileValid || !isPasswordStrong || !isConfirmValid) {
      let errorMsg = t('auth.fill_all_fields');

      if (!isNameValid && name.trim().length > 0) errorMsg = t('auth.name_too_short');
      else if (!isMobileValid && mobile.trim().length > 0) errorMsg = t('auth.invalid_egyptian_mobile');
      else if (!isPasswordStrong && password.length > 0) errorMsg = t('auth.password_not_strong_enough');
      else if (!isConfirmValid && confirmPassword.length > 0) errorMsg = t('auth.passwords_not_match');

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
      const result = await parentRegister({
        name: name.trim(),
        mobile: mobile.trim(),
        password,
      });
      if (!result.success) {
        showConfirm({
          title: t('auth.registration_failed'),
          message: t(result.error || 'auth.registration_error'),
          showCancel: false,
          onConfirm: () => {},
        });
      } else {
        // Redirect to parent dashboard and show success
        navigation.reset({
          index: 0,
          routes: [{ name: 'ParentStack' }],
        });
      }
    } catch (error) {
      console.error('Parent registration screen error:', error);
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

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={currentStyles.cardContainer}>
        <View style={currentStyles.card}>
          <View style={currentStyles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={currentStyles.backButton}>
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={currentStyles.headerTitle}>{t('auth.parent_register_title')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={currentStyles.cardScrollView}
            contentContainerStyle={currentStyles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={currentStyles.hero}>
              <Image source={require('../../assets/logo-transparent.png')} style={currentStyles.logo} resizeMode="contain" />
              <Text style={currentStyles.title}>{t('auth.create_account')}</Text>
              <Text style={currentStyles.subtitle}>{t('auth.parent_register_subtitle')}</Text>
            </View>

            <View style={currentStyles.form}>
              {/* Full Name */}
              <View style={currentStyles.inputGroup}>
                <Text style={currentStyles.inputLabel}>{t('auth.full_name')}</Text>
                <View
                  style={[
                    currentStyles.inputWrapper,
                    { borderColor: getBorderColor(touchedName, isNameValid, name) },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={touchedName && !isNameValid ? '#FF6B6B' : theme.colors.textTertiary}
                    style={currentStyles.inputIcon}
                  />
                  <TextInput
                    style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={name}
                    onChangeText={(val) => setName(val.replace(/[^a-zA-Z\s\u0621-\u064A]/g, ''))}
                    placeholder={t('auth.full_name_placeholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    editable={!isLoading}
                    returnKeyType="next"
                    onBlur={() => setTouchedName(true)}
                    onSubmitEditing={() => mobileRef.current?.focus()}
                  />
                </View>
                {touchedName && !isNameValid && name.length > 0 && (
                  <Text style={currentStyles.errorText}>{t('auth.name_too_short')}</Text>
                )}
              </View>

              {/* Mobile Number */}
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
                    ref={mobileRef}
                    style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={mobile}
                    onChangeText={(val) => setMobile(val.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    placeholder={t('auth.mobile_number_eg_placeholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    returnKeyType="next"
                    onBlur={() => setTouchedMobile(true)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
                {touchedMobile && !isMobileValid && mobile.length > 0 && (
                  <Text style={currentStyles.errorText}>{t('auth.invalid_egyptian_mobile')}</Text>
                )}
              </View>

              {/* Password */}
              <View style={currentStyles.inputGroup}>
                <Text style={currentStyles.inputLabel}>{t('auth.password_placeholder')}</Text>
                <View
                  style={[
                    currentStyles.inputWrapper,
                    { borderColor: getBorderColor(touchedPassword, isPasswordStrong, password) },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      touchedPassword && !isPasswordStrong ? '#FF6B6B' : theme.colors.textTertiary
                    }
                    style={currentStyles.inputIcon}
                  />
                  <TextInput
                    ref={passwordRef}
                    style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.password_placeholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="next"
                    onBlur={() => setTouchedPassword(true)}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity
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
                {touchedPassword && !isPasswordStrong && password.length > 0 ? (
                  <Text style={currentStyles.errorText}>{t('auth.password_not_strong_enough')}</Text>
                ) : (
                  <Text style={currentStyles.hintText}>{t('auth.password_strength_hint')}</Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={currentStyles.inputGroup}>
                <Text style={currentStyles.inputLabel}>{t('auth.confirm_password')}</Text>
                <View
                  style={[
                    currentStyles.inputWrapper,
                    { borderColor: getBorderColor(touchedConfirm, isConfirmValid, confirmPassword) },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={
                      touchedConfirm && !isConfirmValid ? '#FF6B6B' : theme.colors.textTertiary
                    }
                    style={currentStyles.inputIcon}
                  />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('auth.confirm_password_placeholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    returnKeyType="done"
                    onBlur={() => setTouchedConfirm(true)}
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={currentStyles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                {touchedConfirm && !isConfirmValid && confirmPassword.length > 0 && (
                  <Text style={currentStyles.errorText}>{t('auth.passwords_not_match')}</Text>
                )}
              </View>

            <TouchableOpacity
                style={[currentStyles.submitButton, isLoading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={currentStyles.submitButtonText}>{t('auth.sign_up')}</Text>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" style={{ marginStart: 8 }} />
                ) : (
                  <Ionicons
                    name={isRTL ? 'arrow-back-outline' : 'arrow-forward-outline'}
                    size={20}
                    color="#FFF"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={currentStyles.langButton}
                onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                activeOpacity={0.7}
              >
                <Ionicons name="language-outline" size={18} color={theme.colors.primary} />
                <Text style={currentStyles.langText}>
                  {language === 'ar' ? 'English' : 'عربي'}
                </Text>
              </TouchableOpacity>

              <View style={currentStyles.footer}>
                <Text style={currentStyles.footerText}>{t('auth.already_have_account')} </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ParentLogin')}
                  disabled={isLoading}
                >
                  <Text style={currentStyles.linkText}>{t('auth.sign_in')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          <View style={currentStyles.bottomAccent} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, insets, typography, fontWeight, fontSizes, isRTL } = config;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    cardContainer: {
      flex: 1,
      padding: spacing.md,
      paddingTop: insets.top + spacing.md,
      paddingBottom: insets.bottom + spacing.md,
    },
    card: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
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
    cardScrollView: { flex: 1 },
    cardContent: { flexGrow: 1 },
    hero: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    logo: { width: 90, height: 70, marginBottom: spacing.md },
    title: {
      ...typography('h2'),
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
    form: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.md },
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
      height: 56,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md || 12,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.sm,
    },
    inputIcon: { marginHorizontal: spacing.xs },
    eyeIcon: { padding: spacing.xs },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      height: '100%',
      paddingHorizontal: spacing.sm,
    },
    errorText: {
      ...typography('caption'),
      color: '#FF6B6B',
      marginTop: 4,
      textAlign: 'left',
    },
    hintText: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginTop: 4,
      textAlign: 'left',
      fontSize: 10,
    },
    submitButton: {
      height: 56,
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md || 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    submitButtonText: { ...typography('button'), ...fontWeight('700'), color: '#FFFFFF' },
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
    linkText: { ...typography('body'), ...fontWeight('700'), color: theme.colors.primary },
    bottomAccent: { height: 8, backgroundColor: theme.colors.primary },
  });
};

export default ParentRegisterScreen;
