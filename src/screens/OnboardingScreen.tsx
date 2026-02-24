import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';
import AppButton from '../components/AppButton';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted, onLogin }) => {
  const { t } = useTranslation();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  const currentStyles = styles(typography, insets);

  return (
    <View style={currentStyles.container}>
      {/* 1. Full-screen Background Image */}
      <Image
        source={require('../../assets/onboarding-bg.png')}
        style={currentStyles.onboardingBg}
        resizeMode="cover"
      />

      <View style={currentStyles.safeArea}>
        {/* 2. Top Logo Overlay */}
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo-icon.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Spacer to push content to bottom */}
        <View style={currentStyles.spacer} />

        {/* 3. Bottom Content */}
        <View style={currentStyles.bottomContent}>
          <Text style={currentStyles.title}> {t('onboarding.title')} </Text>
          <Text style={currentStyles.subtitle}> {t('onboarding.subtitle')} </Text>

          <AppButton title={t('onboarding.get_started')} onPress={onGetStarted} size="lg" />

          <View style={currentStyles.footer}>
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

const styles = (typography: any, insets: { top: number; bottom: number }) =>
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
      alignItems: 'center',
      marginTop: 40,
      paddingHorizontal: 20,
    },
    logo: {
      zIndex: 1,
      width: 400,
      height: 100,
    },
    spacer: {
      flex: 1,
    },
    bottomContent: {
      paddingHorizontal: 30,
      paddingBottom: Math.max(insets.bottom, 40),
      alignItems: 'center',
    },
    title: {
      ...typography('h1'),
      fontWeight: '800',
      color: '#0F172A',
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      ...typography('body'),
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 32,
    },
    footer: {
      marginTop: 24,
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
