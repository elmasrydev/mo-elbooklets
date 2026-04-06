import React, { useState, useRef } from 'react';
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

const ParentRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mobileRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const { parentRegister } = useAuth();
  const { showConfirm } = useModal();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!name.trim() || !mobile.trim() || !password.trim()) {
      showConfirm({
        title: t('common.error'),
        message: t('auth.fill_all_fields'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    if (mobile.trim().length !== 11) {
      showConfirm({
        title: t('common.error'),
        message: t('auth.invalid_mobile'),
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

  const currentStyles = styles({ 
      theme, 
      fontSizes, 
      spacing, 
      borderRadius, 
      isRTL, 
      typography, 
      fontWeight, 
      insets 
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
                <View style={currentStyles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.textTertiary} style={currentStyles.inputIcon} />
                  <TextInput
                    style={currentStyles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('auth.full_name_placeholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    editable={!isLoading}
                    textAlign={isRTL ? 'right' : 'left'}
                    returnKeyType="next"
                    onSubmitEditing={() => mobileRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={currentStyles.inputGroup}>
                <Text style={currentStyles.inputLabel}>{t('auth.mobile_placeholder')}</Text>
                <View style={currentStyles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.textTertiary} style={currentStyles.inputIcon} />
                  <TextInput
                    ref={mobileRef}
                    style={currentStyles.input}
                    value={mobile}
                    onChangeText={(val) => setMobile(val.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    placeholder="01xxxxxxxxx"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    textAlign={isRTL ? 'right' : 'left'}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={currentStyles.inputGroup}>
                <Text style={currentStyles.inputLabel}>{t('auth.password_placeholder')}</Text>
                <View style={currentStyles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textTertiary} style={currentStyles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={currentStyles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.password_placeholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    textAlign={isRTL ? 'right' : 'left'}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={currentStyles.eyeIcon}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={currentStyles.submitButton} onPress={handleRegister} disabled={isLoading}>
                <Text style={currentStyles.submitButtonText}>{t('auth.sign_up')}</Text>
                {isLoading && <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>

              <TouchableOpacity style={currentStyles.langButton} onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
                <Text style={currentStyles.langText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
              </TouchableOpacity>

              <View style={currentStyles.footer}>
                <Text style={currentStyles.footerText}>{t('auth.already_have_account')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ParentLogin')}>
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
    cardContainer: { flex: 1, padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
    card: { flex: 1, backgroundColor: theme.colors.card, borderRadius: borderRadius.xl || 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
    headerTop: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...typography('h3'), ...fontWeight('700'), color: theme.colors.text, flex: 1, textAlign: 'center' },
    cardScrollView: { flex: 1 },
    cardContent: { flexGrow: 1 },
    hero: { alignItems: 'center', padding: spacing.xl },
    logo: { width: 90, height: 70, marginBottom: spacing.md },
    title: { ...typography('h2'), ...fontWeight('700'), color: theme.colors.text, textAlign: 'center' },
    subtitle: { ...typography('body'), color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
    form: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { ...typography('caption'), ...fontWeight('600'), color: theme.colors.textSecondary, marginBottom: spacing.xs, textAlign: isRTL ? 'right' : 'left' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 56, borderWidth: 1, borderColor: theme.colors.border, borderRadius: borderRadius.md || 12, backgroundColor: theme.colors.background, paddingHorizontal: spacing.sm },
    inputIcon: { marginHorizontal: spacing.xs },
    eyeIcon: { padding: spacing.xs },
    input: { flex: 1, fontSize: fontSizes.base, color: theme.colors.text, height: '100%', paddingHorizontal: spacing.sm },
    submitButton: { height: 56, backgroundColor: theme.colors.primary, borderRadius: borderRadius.md || 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
    submitButtonText: { ...typography('button'), ...fontWeight('700'), color: '#FFFFFF' },
    langButton: { marginTop: spacing.lg, alignSelf: 'center', padding: spacing.sm },
    langText: { ...typography('bodySmall'), color: theme.colors.primary, ...fontWeight('600') },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
    footerText: { ...typography('body'), color: theme.colors.textSecondary },
    linkText: { ...typography('body'), ...fontWeight('700'), color: theme.colors.primary },
    bottomAccent: { height: 8, backgroundColor: theme.colors.primary },
  });
};

export default ParentRegisterScreen;
