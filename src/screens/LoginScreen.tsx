import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { useAutoReset } from '../hooks/useAutoReset';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/navigation/BackButton';
import AppButton from '../components/AppButton';
import { layout } from '../config/layout';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [touchedMobile, setTouchedMobile] = useAutoReset(false);
  const [touchedPassword, setTouchedPassword] = useAutoReset(false);

  const passwordRef = useRef<TextInput>(null);

  const { login } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!mobile.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fill_all_fields'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await login({ mobile: mobile.trim(), password });
      if (!result.success)
        Alert.alert(t('auth.login_failed'), result.error || t('auth.invalid_credentials'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const isRTL = language === 'ar';
  const currentStyles = styles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    isRTL,
    typography,
    fontWeight,
  );

  const isMobileValid = new RegExp('^01[0125][0-9]{8}$').test(mobile.trim());
  const isPasswordValid = password.length >= 8;

  const getMobileBorderColor = () => {
    if (!touchedMobile) return '#E2E8F0';
    return isMobileValid ? '#10B981' : '#F59E0B';
  };

  const getPasswordBorderColor = () => {
    if (!touchedPassword) return '#E2E8F0';
    return isPasswordValid ? '#10B981' : '#F59E0B';
  };

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackButton
        onPress={() => navigation.goBack()}
        style={[currentStyles.backButton, { top: insets.top + spacing.sm, left: spacing.lg }]}
        color={theme.colors.text}
      />

      <TouchableOpacity
        onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        style={[currentStyles.languageButton, { top: insets.top + spacing.sm, right: spacing.lg }]}
      >
        <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
        <Text style={currentStyles.languageText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.title}> {t('auth.welcome_back')} </Text>
          <Text style={currentStyles.subtitle}> {t('auth.sign_in_subtitle')} </Text>
        </View>

        <View style={currentStyles.form}>
          {/* Mobile Input */}
          <View style={[currentStyles.inputWrapper, { borderColor: getMobileBorderColor() }]}>
            <Ionicons
              name="call-outline"
              size={20}
              color={isMobileValid ? '#10B981' : theme.colors.textSecondary}
              style={currentStyles.inputIcon}
            />
            <TextInput
              autoFocus
              style={[currentStyles.input]}
              value={mobile}
              onChangeText={(val) => setMobile(val.replace(/[^0-9]/g, '').slice(0, 11))}
              maxLength={11}
              placeholder={t('auth.mobile_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              onBlur={() => setTouchedMobile(true)}
              blurOnSubmit={false}
            />
            {touchedMobile && !isMobileValid && (
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#F59E0B"
                style={{ marginHorizontal: 8 }}
              />
            )}
            {isMobileValid && (
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#10B981"
                style={{ marginHorizontal: 8 }}
              />
            )}
          </View>

          {/* Password Input */}
          <View style={[currentStyles.inputWrapper, { borderColor: getPasswordBorderColor() }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={currentStyles.inputIcon}
            />
            <TextInput
              // @ts-ignore: React Native types sometimes incorrectly omit `ref` from TextInputProps
              ref={passwordRef}
              style={[currentStyles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onBlur={() => setTouchedPassword(true)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={currentStyles.forgotContainer}>
            <Text style={currentStyles.forgotText}> {t('auth.forgot_password')} </Text>
          </TouchableOpacity>

          <AppButton
            title={t('auth.sign_in')}
            onPress={handleLogin}
            size="lg"
            loading={isLoading}
          />
        </View>

        <View style={currentStyles.footer}>
          <Text style={currentStyles.footerText}> {t('auth.dont_have_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
            <Text style={currentStyles.linkText}> {t('auth.sign_up')} </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: Platform.OS === 'ios' ? common.insets.top : common.insets.top + 30,
      paddingBottom: Math.max(common.insets.bottom, 20),
    },
    header: { alignItems: 'center', marginBottom: 32 },
    logo: { width: 100, height: 85, marginBottom: 24 },
    title: {
      ...typography('display'),
      color: '#0F172A',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      ...typography('body'),
      color: '#64748B',
      textAlign: 'center',
      ...fontWeight('500'),
    },
    form: { marginBottom: 32 },
    languageButton: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 6,
      zIndex: 10,
      ...layout.shadow,
    },
    languageText: {
      ...typography('label'),
      ...fontWeight('700'),
      color: theme.colors.primary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      height: 56,
    },
    inputIcon: {
      marginRight: 12,
      marginLeft: 12,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: '#1E293B',
      height: '100%',
    },
    forgotContainer: {
      alignSelf: 'flex-start',
      marginBottom: 32,
    },
    forgotText: {
      ...typography('label'),
      color: theme.colors.primary,
      ...fontWeight('600'),
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      gap: 4,
    },
    footerText: { ...typography('body'), color: '#64748B' },
    linkText: {
      ...typography('button'),
      color: '#1E3A8A',
      ...fontWeight('700'),
    },
    backButton: {
      position: 'absolute',
      zIndex: 10,
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });

export default LoginScreen;
