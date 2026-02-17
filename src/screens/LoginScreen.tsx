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
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();

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

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={currentStyles.scrollContainer}>
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.title}> {t('auth.welcome_back')} </Text>
          <Text style={currentStyles.subtitle}> {t('auth.sign_in_subtitle')} </Text>
        </View>

        <View style={currentStyles.form}>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.mobile_number')} </Text>
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

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.password')} </Text>
            <TextInput
              style={currentStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
            />
          </View>

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
              {language === 'en' ? 'العربية' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    langRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    langButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight || 'rgba(16, 185, 129, 0.08)',
    },
    langButtonText: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 100, height: 100, marginBottom: 20 },
    title: {
      fontSize: fontSizes['3xl'],
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: { fontSize: fontSizes.base, color: theme.colors.textSecondary },
    form: { marginBottom: 30 },
    inputContainer: { marginBottom: 20 },
    label: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: common.textAlign,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      padding: 15,
      fontSize: fontSizes.base,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
    loginButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md,
      padding: 12, // Reduced from 15
      alignItems: 'center',
      marginTop: 10,
    },
    disabledButton: { backgroundColor: theme.colors.buttonDisabled },
    loginButtonText: {
      color: '#fff',
      fontSize: fontSizes.sm, // Changed from lg to sm
      fontWeight: '600', // Changed from bold (if it was) to 600
    },
    footer: { flexDirection: common.rowDirection, justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: fontSizes.base, color: theme.colors.textSecondary },
    linkText: { fontSize: fontSizes.base, color: theme.colors.primary, fontWeight: '600' },
  });

export default LoginScreen;
