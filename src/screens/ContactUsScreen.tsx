import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UnifiedHeader from '../components/UnifiedHeader';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModal } from '../context/ModalContext';
import AppButton from '../components/AppButton';
import { tryFetchWithFallback } from '../config/api';
import * as SecureStore from 'expo-secure-store';
import { analytics } from '../lib/analytics';

const ContactUsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius, fontSizes } = useTheme();
  const { isRTL } = useLanguage();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const { showConfirm } = useModal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const subjectRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedSubject, setTouchedSubject] = useState(false);
  const [touchedMessage, setTouchedMessage] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isNameValid = name.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isSubjectValid = subject.trim().length >= 3;
  const isMessageValid = message.trim().length >= 10;

  const handleSubmit = async () => {
    setTouchedName(true);
    setTouchedEmail(true);
    setTouchedSubject(true);
    setTouchedMessage(true);

    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
      let errorMessage = t('contact_us.form_incomplete');
      if (!isNameValid) errorMessage = t('contact_us.name_error');
      else if (!isEmailValid) errorMessage = t('auth.invalid_email');
      else if (!isSubjectValid) errorMessage = t('contact_us.subject_error');
      else if (!isMessageValid) errorMessage = t('contact_us.message_error');

      showConfirm({
        title: t('common.error'),
        message: errorMessage,
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const mutation = `
        mutation SendContactMessage($name: String!, $email: String!, $subject: String!, $message: String!) {
          sendContactMessage(name: $name, email: $email, subject: $subject, message: $message) {
            success
            message
          }
        }
      `;

      const response = await tryFetchWithFallback(
        mutation,
        { name, email, subject, message },
        token || undefined,
      );

      if (response.data?.sendContactMessage?.success) {
        analytics.trackContactSupport(subject);
        showConfirm({
          title: t('common.success'),
          message: response.data.sendContactMessage.message || t('contact_us.success_message'),
          showCancel: false,
          onConfirm: () => navigation.goBack(),
        });
      } else {
        const errMsg =
          response.data?.sendContactMessage?.message ||
          response.errors?.[0]?.message ||
          t('common.error');
        showConfirm({
          title: t('common.error'),
          message: errMsg,
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      showConfirm({
        title: t('common.error'),
        message: err.message || t('common.error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStyles = useMemo(
    () =>
      styles({
        theme,
        spacing,
        borderRadius,
        isRTL,
        typography,
        fontWeight,
        insets,
        fontSizes,
      }),
    [theme, spacing, borderRadius, isRTL, typography, fontWeight, insets, fontSizes],
  );

  const getBorderColor = (fieldName: string, touched: boolean, valid: boolean) => {
    if (focusedField === fieldName) return theme.colors.primary;
    if (touched && !valid) return '#FF6B6B';
    return theme.colors.border;
  };

  const getIconColor = (fieldName: string, touched: boolean, valid: boolean, value: string) => {
    if (focusedField === fieldName) return theme.colors.primary;
    if (touched && !valid) return '#FF6B6B';
    if (value.length > 0 && valid) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <UnifiedHeader
        title={t('contact_us.header_title')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        centerAlign={true}
      />

      <View style={currentStyles.cardContainer}>
        <View style={currentStyles.card}>
          <ScrollView
            ref={scrollViewRef}
            style={currentStyles.cardScrollView}
            contentContainerStyle={currentStyles.cardContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={currentStyles.headerInfo}>
              <Text style={currentStyles.title}>{t('contact_us.title')}</Text>
              <Text style={currentStyles.subtitle}>{t('contact_us.subtitle')}</Text>
            </View>

            <View style={currentStyles.form}>
              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor('name', touchedName, isNameValid) },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={getIconColor('name', touchedName, isNameValid, name)}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={currentStyles.input}
                  placeholder={t('contact_us.name_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouchedName(true);
                  }}
                />
              </View>

              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor('email', touchedEmail, isEmailValid) },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={getIconColor('email', touchedEmail, isEmailValid, email)}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  ref={emailRef}
                  style={currentStyles.input}
                  placeholder={t('contact_us.email_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => subjectRef.current?.focus()}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouchedEmail(true);
                  }}
                />
              </View>

              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor('subject', touchedSubject, isSubjectValid) },
                ]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={getIconColor('subject', touchedSubject, isSubjectValid, subject)}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  ref={subjectRef}
                  style={currentStyles.input}
                  placeholder={t('contact_us.subject_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={subject}
                  onChangeText={setSubject}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => messageRef.current?.focus()}
                  onFocus={() => setFocusedField('subject')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouchedSubject(true);
                  }}
                />
              </View>

              <View
                style={[
                  currentStyles.inputWrapper,
                  currentStyles.textAreaWrapper,
                  { borderColor: getBorderColor('message', touchedMessage, isMessageValid) },
                ]}
              >
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={20}
                  color={getIconColor('message', touchedMessage, isMessageValid, message)}
                  style={[
                    currentStyles.inputIcon,
                    { marginTop: Platform.OS === 'ios' ? spacing.sm : 12 },
                  ]}
                />
                <TextInput
                  ref={messageRef}
                  style={[currentStyles.input, currentStyles.textArea]}
                  placeholder={t('contact_us.message_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  editable={!loading}
                  returnKeyType="default"
                  onFocus={() => {
                    setFocusedField('message');
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouchedMessage(true);
                  }}
                />
              </View>

              <AppButton
                title={t('contact_us.send_message')}
                onPress={handleSubmit}
                loading={loading}
                variant="primary"
                size="lg"
                style={{ marginTop: spacing.sm, height: 56, borderRadius: 16 }}
                icon={
                  <Ionicons
                    name="send-outline"
                    size={20}
                    color="#FFF"
                    style={
                      isRTL
                        ? { transform: [{ rotate: '215deg' }] }
                        : {
                            transform: [
                              { rotate: '-35deg' },
                              { translateY: -2 },
                              { translateX: 2 },
                            ],
                          }
                    }
                  />
                }
                iconPosition={isRTL ? 'left' : 'right'}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, isRTL, typography, fontWeight, insets, fontSizes } = config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    cardContainer: {
      flex: 1,
      padding: spacing.md,
      paddingBottom: insets.bottom + spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl || 24,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    cardScrollView: {
      flex: 1,
    },
    cardContent: {
      flexGrow: 1,
      paddingBottom: spacing.xl,
    },
    headerInfo: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    title: {
      ...typography('h2'),
      fontSize: 28,
      ...fontWeight('800'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    subtitle: {
      ...typography('bodyLarge'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      height: 56,
      gap: 8,
    },
    textAreaWrapper: {
      height: 140,
      alignItems: 'flex-start',
      paddingTop: Platform.OS === 'ios' ? spacing.sm : 0,
    },
    inputIcon: {
      marginEnd: spacing.sm,
    },
    input: {
      flex: 1,
      ...typography('body'),
      color: theme.colors.text,
      height: '100%',
      textAlign: 'left',
    },
    textArea: {
      height: 120,
      textAlignVertical: 'top',
      paddingTop: Platform.OS === 'ios' ? 0 : spacing.sm,
    },
  });
};

export default ContactUsScreen;
