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
  const { language, setLanguage, isRTL } = useLanguage();
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

  const currentStyles = styles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    isRTL,
    typography,
    fontWeight,
    insets,
  );

  const isMobileValid = new RegExp('^01[0125][0-9]{8}$').test(mobile.trim());
  const isPasswordValid = password.length >= 8;

  const getMobileBorderColor = () => {
    if (touchedMobile && !isMobileValid) return '#EF4444'; // Red-500
    if (mobile.length > 0) return theme.colors.primary;
    return theme.colors.border;
  };

  const getPasswordBorderColor = () => {
    if (touchedPassword && !isPasswordValid) return '#EF4444';
    if (password.length > 0) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={currentStyles.card}>
          {/* Header */}
          <View style={currentStyles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={currentStyles.backButtonContainer}
            >
              <Ionicons
                name={isRTL ? 'arrow-forward' : 'arrow-back'}
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={currentStyles.headerTitle}>{t('auth.login')}</Text>
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

          {/* Form */}
          <View style={currentStyles.form}>
            {/* Mobile/Email */}
            <View style={currentStyles.inputGroup}>
              <Text style={currentStyles.inputLabel}>{t('auth.mobile_placeholder')}</Text>
              <View style={[currentStyles.inputWrapper, { borderColor: getMobileBorderColor() }]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.textTertiary}
                  style={currentStyles.inputIconLeft}
                />
                <TextInput
                  style={currentStyles.input}
                  value={mobile}
                  onChangeText={(val) => setMobile(val.replace(/[^0-9]/g, '').slice(0, 11))}
                  maxLength={11}
                  placeholder={t('auth.mobile_placeholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!isLoading}
                  textAlign={isRTL ? 'right' : 'left'}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onBlur={() => setTouchedMobile(true)}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={currentStyles.inputGroup}>
              <View style={currentStyles.passwordLabelRow}>
                <Text style={currentStyles.inputLabel}>{t('auth.password_placeholder')}</Text>
                <TouchableOpacity>
                  <Text style={currentStyles.forgotText}>{t('auth.forgot_password')}</Text>
                </TouchableOpacity>
              </View>
              <View style={[currentStyles.inputWrapper, { borderColor: getPasswordBorderColor() }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.textTertiary}
                  style={currentStyles.inputIconLeft}
                />
                <TextInput
                  // @ts-ignore
                  ref={passwordRef}
                  style={currentStyles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor={theme.colors.textTertiary}
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
                  style={currentStyles.inputIconRight}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={currentStyles.signInButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={currentStyles.signInButtonText}>{t('auth.sign_in')}</Text>
              <Ionicons
                name={isRTL ? 'log-in-outline' : 'log-in-outline'}
                size={20}
                color="#FFF"
                style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
              />
            </TouchableOpacity>

            {/* Divider */}
            <View style={currentStyles.dividerRow}>
              <View style={currentStyles.dividerLine} />
              <Text style={currentStyles.dividerText}>{'        '}</Text>
              <View style={currentStyles.dividerLine} />
            </View>

            {/* Language Toggle */}
            <TouchableOpacity
              style={currentStyles.languageButton}
              onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              activeOpacity={0.7}
            >
              <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
              <Text style={currentStyles.languageButtonText}>
                {language === 'ar' ? 'English' : 'عربي'}
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={currentStyles.footer}>
              <Text style={currentStyles.footerText}>{t('auth.dont_have_account')} </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text style={currentStyles.createAccountText}>{t('auth.sign_up')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Primary Border */}
          <View style={currentStyles.bottomBorder} />
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
  insets: any,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
      paddingTop: Math.max(insets.top + spacing.xl, spacing.xxl * 2),
      paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xxl * 2),
    },
    card: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
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
        web: {
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backButtonContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      ...typography('subtitle1'),
      ...fontWeight('700'),
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
    },
    logo: {
      width: 100,
      height: 80,
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 28,
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
      textAlign: 'left',
    },
    passwordLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: spacing.xs,
    },
    forgotText: {
      fontSize: 12,
      ...fontWeight('600'),
      color: theme.colors.primary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      borderWidth: 1,
      borderRadius: borderRadius.lg || 12,
      backgroundColor: theme.colors.background,
    },
    inputIconLeft: {
      paddingHorizontal: spacing.md,
    },
    inputIconRight: {
      paddingHorizontal: spacing.md,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      height: '100%',
    },
    signInButton: {
      height: 56,
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.lg || 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
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
      marginTop: spacing.sm,
    },
    signInButtonText: {
      ...typography('button'),
      ...fontWeight('700'),
      color: '#FFFFFF',
      marginRight: spacing.sm,
      marginLeft: isRTL ? spacing.sm : 0,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: spacing.md,
      fontSize: 14,
      color: theme.colors.textTertiary,
    },
    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: borderRadius.lg || 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      marginBottom: spacing.md,
    },
    languageButtonText: {
      fontSize: 14,
      ...fontWeight('600'),
      color: theme.colors.text,
      marginLeft: spacing.sm,
      marginRight: isRTL ? spacing.sm : 0,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: spacing.lg,
    },
    footerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    createAccountText: {
      fontSize: 14,
      ...fontWeight('700'),
      color: theme.colors.primary,
    },
    bottomBorder: {
      height: 8,
      backgroundColor: theme.colors.primary,
      width: '100%',
    },
  });

export default LoginScreen;
