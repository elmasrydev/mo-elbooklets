import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';

const ContactUsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1500);
  };

  const currentStyles = styles(theme, spacing, borderRadius, isRTL);

  return (
    <KeyboardAvoidingView 
      style={[common.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <UnifiedHeader
        title={t('contact_us.header_title')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        centerAlign={true}
      />

      <ScrollView 
        style={currentStyles.content}
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.headerInfo}>
          <Text style={[typography('h2'), currentStyles.title]}>{t('contact_us.title')}</Text>
          <Text style={[typography('body'), currentStyles.subtitle]}>{t('contact_us.subtitle')}</Text>
        </View>

        <View style={currentStyles.form}>
          <View style={currentStyles.inputGroup}>
            <Text style={currentStyles.label}>{t('contact_us.name')}</Text>
            <View style={currentStyles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
              <TextInput
                style={currentStyles.input}
                placeholder={t('contact_us.name_placeholder')}
                placeholderTextColor={theme.colors.textSecondary + '80'}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={currentStyles.inputGroup}>
            <Text style={currentStyles.label}>{t('contact_us.email')}</Text>
            <View style={currentStyles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
              <TextInput
                style={currentStyles.input}
                placeholder={t('contact_us.email_placeholder')}
                placeholderTextColor={theme.colors.textSecondary + '80'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={currentStyles.inputGroup}>
            <Text style={currentStyles.label}>{t('contact_us.subject')}</Text>
            <View style={currentStyles.inputWrapper}>
              <Ionicons name="help-circle-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
              <TextInput
                style={currentStyles.input}
                placeholder={t('contact_us.subject_placeholder')}
                placeholderTextColor={theme.colors.textSecondary + '80'}
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          <View style={currentStyles.inputGroup}>
            <Text style={currentStyles.label}>{t('contact_us.message')}</Text>
            <View style={[currentStyles.inputWrapper, currentStyles.textAreaWrapper]}>
              <TextInput
                style={[currentStyles.input, currentStyles.textArea]}
                placeholder={t('contact_us.message_placeholder')}
                placeholderTextColor={theme.colors.textSecondary + '80'}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          <AppButton
            title={t('contact_us.send_message')}
            onPress={handleSubmit}
            loading={loading}
            containerStyle={currentStyles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any, isRTL: boolean) => StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.screenPadding,
    paddingBottom: spacing.xl * 2,
  },
  headerInfo: {
    marginBottom: spacing.xl,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  title: {
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textAlign: isRTL ? 'right' : 'left',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: isRTL ? 'right' : 'left',
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xxs,
    textAlign: isRTL ? 'right' : 'left',
  },
  inputWrapper: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: isRTL ? 0 : spacing.sm,
    marginLeft: isRTL ? spacing.sm : 0,
  },
  input: {
    flex: 1,
    height: 50,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
    fontSize: 15,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
  },
  textArea: {
    height: 120,
    paddingTop: 0,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default ContactUsScreen;
