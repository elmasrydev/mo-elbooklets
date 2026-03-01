import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import AppButton from '../components/AppButton';
import { layout } from '../config/layout';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted, onLogin }) => {
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  const currentStyles = styles(typography, insets, isRTL);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <View style={currentStyles.container}>
      {/* 1. Full-screen Background Image */}
      <Image
        source={require('../../assets/onboarding-bg.png')}
        style={currentStyles.onboardingBg}
        resizeMode="cover"
      />

      <View style={currentStyles.safeArea}>
        {/* 2. Top Header with Logo & Language Switcher */}
        <View style={currentStyles.header}>
          <TouchableOpacity
            style={currentStyles.languageButton}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={20} color="#1E3A8A" />
            <Text style={currentStyles.languageText}>
              {language === 'ar' ? 'English' : 'العربية'}
            </Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/logo-icon.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />

          {/* Empty view for header balancing if needed */}
          <View style={{ width: 44 }} />
        </View>

        {/* Spacer to push content to bottom */}
        <View style={currentStyles.spacer} />

        {/* 3. Bottom Content */}
        <View style={currentStyles.bottomContent}>
          <Text style={currentStyles.title}> {t('onboarding.title')} </Text>
          <Text style={currentStyles.subtitle}> {t('onboarding.subtitle')} </Text>

          <AppButton title={t('onboarding.get_started')} onPress={onGetStarted} size="lg" />

          <View style={[currentStyles.footer]}>
            <Text style={currentStyles.footerText}>
              {t('onboarding.already_have_account')}{' '}
              <Text style={currentStyles.link} onPress={onLogin}>
                {t('onboarding.sign_in')}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = (typography: any, insets: { top: number; bottom: number }, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingTop: insets.top,
    },
    onboardingBg: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      zIndex: -1,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      paddingHorizontal: layout.screenPadding,
    },
    languageButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 25,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    languageText: {
      ...typography('button'),
      fontSize: 14,
      color: '#1E3A8A',
      fontWeight: '700',
    },
    logo: {
      zIndex: 1,
      width: 150, // Reduced from 400 to fit header properly
      height: 40,
    },
    spacer: {
      flex: 1,
    },
    bottomContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom, 70),
      alignItems: 'center',
    },
    title: {
      ...typography('h1'),
      fontWeight: '800',
      color: '#0F172A',
      textAlign: 'center',
      marginBottom: 14,
    },
    subtitle: {
      ...typography('body'),
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 32,
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
      fontWeight: '700',
    },
  });

export default OnboardingScreen;
