import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ParentForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touchedEmail, setTouchedEmail] = useAutoReset(false);

  const { parentForgotPassword } = useAuth();
  const { showConfirm } = useModal();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const handleReset = async () => {
    setTouchedEmail(true);
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      showConfirm({
        title: t('common.error'),
        message: t('auth.invalid_email_format'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await parentForgotPassword(email.trim());
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
    } catch (error) {
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

  const currentStyles = styles({
    theme,
    spacing,
    borderRadius,
    isRTL,
    typography,
    fontWeight,
    insets,
    fontSizes,
  });

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={currentStyles.backButton}>
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('auth.forgot_password')}</Text>
          <View style={{ width: 40 }} />
        </View>

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
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
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
              style={[currentStyles.submitButton, isLoading && { opacity: 0.7 }]}
              onPress={handleReset}
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
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, isRTL, typography, fontWeight, insets, fontSizes } = config;
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
    title: { fontSize: 24, fontWeight: '700', color: '#005ab4', textAlign: 'center' },
    subtitle: {
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
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
    errorText: { ...typography('caption'), color: '#FF6B6B', marginTop: 4, textAlign: 'left' },
  });
};

export default ParentForgotPasswordScreen;
