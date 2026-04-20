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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={currentStyles.cardContainer}>
        <View style={currentStyles.card}>
          <View style={currentStyles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={currentStyles.backButton}>
              <Ionicons
                name={isRTL ? 'arrow-forward' : 'arrow-back'}
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={currentStyles.headerTitle}>{t('auth.forgot_password')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={currentStyles.cardScrollView}
            contentContainerStyle={currentStyles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={currentStyles.header}>
              <View style={currentStyles.iconCircle}>
                <Ionicons name="mail-outline" size={40} color={theme.colors.primary} />
              </View>
              <Text style={currentStyles.title}>{t('auth.forgot_password')}</Text>
              <Text style={currentStyles.subtitle}>
                {t('auth.forgot_password_email_subtitle')}
              </Text>
            </View>

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
                {isLoading && (
                  <ActivityIndicator size="small" color="#FFF" style={{ marginStart: 8 }} />
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={currentStyles.bottomAccent} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, isRTL, typography, fontWeight, insets, fontSizes } = config;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    cardContainer: { flex: 1, padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
    card: { flex: 1, backgroundColor: theme.colors.card, borderRadius: borderRadius.xl || 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
    headerTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...typography('h3'), ...fontWeight('700'), color: theme.colors.text, flex: 1, textAlign: 'center' },
    cardScrollView: { flex: 1 },
    cardContent: { flexGrow: 1 },
    header: { alignItems: 'center', padding: spacing.xl },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    title: { ...typography('h2'), ...fontWeight('700'), color: theme.colors.text, textAlign: 'center' },
    subtitle: { ...typography('bodySmall'), color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },
    form: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { ...typography('caption'), ...fontWeight('600'), color: theme.colors.textSecondary, marginBottom: spacing.xs, textAlign: 'left' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1, borderColor: theme.colors.border, borderRadius: borderRadius.md || 12, backgroundColor: theme.colors.background, paddingHorizontal: spacing.sm },
    inputIcon: { marginHorizontal: spacing.xs },
    input: { flex: 1, fontSize: fontSizes.base, color: theme.colors.text, height: '100%', paddingHorizontal: spacing.sm },
    submitButton: { height: 56, backgroundColor: theme.colors.primary, borderRadius: borderRadius.md || 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
    submitButtonText: { ...typography('button'), ...fontWeight('700'), color: '#FFFFFF' },
    bottomAccent: { height: 8, backgroundColor: theme.colors.primary },
  });
};

export default ParentForgotPasswordScreen;
