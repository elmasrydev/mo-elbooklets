import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import AppButton from '../components/AppButton';
import { layout } from '../config/layout';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const { theme, spacing } = useTheme();

  const currentStyles = styles(typography, fontWeight, insets, isRTL, theme);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <>
      <View style={currentStyles.container}>
        {/* 2. Top Header with Logo & Language Switcher */}
        <TouchableOpacity
          onPress={toggleLanguage}
          style={[
            currentStyles.languageButton,
            { top: insets.top + spacing.sm, right: spacing.md },
          ]}
        >
          <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
          <Text style={currentStyles.languageText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/logo-transparent.png')}
          style={currentStyles.logo}
          resizeMode="contain"
        />

        <Image
          source={require('../../assets/onboarding-bg.png')}
          style={currentStyles.onboardingBg}
          resizeMode="contain"
        />

        {/* 3. Bottom Content */}
        <View style={currentStyles.bottomContent}>
          <Text style={currentStyles.title}> {t('onboarding.title')} </Text>
          <Text style={currentStyles.subtitle}> {t('onboarding.subtitle')} </Text>

          <AppButton
            title={t('onboarding.get_started')}
            onPress={() => navigation.navigate('Register')}
            size="lg"
          />

          <View style={[currentStyles.footer]}>
            <Text style={currentStyles.footerText}>
              {t('onboarding.already_have_account')}{' '}
              <Text style={currentStyles.link} onPress={() => navigation.navigate('Login')}>
                {t('onboarding.sign_in')}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = (
  typography: any,
  fontWeight: any,
  insets: { top: number; bottom: number },
  isRTL: boolean,
  theme: any,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingTop: insets.top,
    },
    onboardingBg: {
      width: '95%',
    },
    languageButton: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 6,
      zIndex: 10,
      ...layout.shadow,
    },
    languageText: {
      ...typography('bodySmall'),
      ...fontWeight('700'),
      color: theme.colors.primary,
    },
    logo: {
      marginTop: 20,
      width: 100,
      height: 85,
    },
    bottomContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom, 20),
      alignItems: 'center',
    },
    title: {
      ...typography('h1'),
      ...fontWeight('800'),
      color: '#0F172A',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      ...typography('body'),
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 20,
    },
    footer: {
      marginTop: 25,
      marginBottom: 25,
    },
    footerText: {
      ...typography('body'),
      fontSize: 15,
      color: '#475569',
    },
    link: {
      ...typography('button'),
      color: '#1E3A8A',
      ...fontWeight('700'),
    },
  });

export default OnboardingScreen;
