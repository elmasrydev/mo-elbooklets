import React, { useState } from 'react';
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
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/navigation/BackButton';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister, onBack }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();
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
  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, isRTL, typography);

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Floating Back Button */}
      <BackButton
        onPress={onBack}
        style={[
          currentStyles.backButton,
          { top: insets.top + spacing.sm },
          common.start(spacing.lg),
        ]}
        color={theme.colors.text}
      />

      <ScrollView
        contentContainerStyle={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo-icon.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.title}> {t('auth.welcome_back')} </Text>
          <Text style={currentStyles.subtitle}> {t('auth.sign_in_subtitle')} </Text>
        </View>

        <View style={currentStyles.form}>
          {/* Mobile Input */}
          <View style={currentStyles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={currentStyles.inputIcon}
            />
            <TextInput
              style={currentStyles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder={t('auth.mobile_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
            />
          </View>

          {/* Password Input */}
          <View style={currentStyles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={currentStyles.inputIcon}
            />
            <TextInput
              style={[currentStyles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
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

          <TouchableOpacity
            style={[currentStyles.loginButton, isLoading && currentStyles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={currentStyles.loginButtonText}> {t('auth.sign_in')} </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={currentStyles.footer}>
          <Text style={currentStyles.footerText}> {t('auth.dont_have_account')} </Text>
          <TouchableOpacity onPress={onNavigateToRegister} disabled={isLoading}>
            <Text style={currentStyles.linkText}> {t('auth.sign_up')} </Text>
          </TouchableOpacity>
        </View>

        {/* Language switch button */}
        <View style={currentStyles.langRow}>
          <TouchableOpacity
            style={currentStyles.langButton}
            onPress={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          >
            <Ionicons name="language-outline" size={18} color={theme.colors.primary} />
            <Text style={currentStyles.langButtonText}>
              {language === 'en' ? t('common.arabic') : t('common.english')}
            </Text>
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
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: 60,
      paddingBottom: spacing.xl,
    },
    header: { alignItems: 'center', marginBottom: 50 },
    logo: { width: 120, height: 120, marginBottom: 24 },
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
      fontWeight: '500', // slightly bolder body for subtitle
    },
    form: { marginBottom: 32 },
    inputWrapper: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: '#1E293B',
      height: '100%',
    },
    forgotContainer: {
      alignSelf: isRTL ? 'flex-start' : 'flex-end',
      marginBottom: 32,
    },
    forgotText: {
      ...typography('label'),
      color: theme.colors.primary,
      fontWeight: '600',
    },
    loginButton: {
      backgroundColor: '#1E3A8A', // Deep Navy from Screenshot
      borderRadius: 30, // Pill shaped button
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    disabledButton: { backgroundColor: '#94A3B8' },
    loginButtonText: {
      ...typography('button'),
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    footer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      gap: 4,
    },
    footerText: { ...typography('body'), color: '#64748B' },
    linkText: {
      ...typography('button'),
      color: '#1E3A8A',
      fontWeight: '700',
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
    langRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
    },
    langButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: 'rgba(30, 58, 138, 0.05)',
    },
    langButtonText: {
      ...typography('buttonSmall'),
      color: theme.colors.primary,
    },
  });

export default LoginScreen;
