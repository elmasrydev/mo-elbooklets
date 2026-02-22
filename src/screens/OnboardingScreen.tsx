import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted, onLogin }) => {
  const { t } = useTranslation();
  const { theme, spacing, fontSizes, borderRadius } = useTheme();
  const commonStyles = useCommonStyles();
  const { typography } = useTypography();

  const currentStyles = styles(typography);

  return (
    <View style={currentStyles.container}>
      {/* 1. Full-screen Background Image */}
      <Image
        source={require('../../assets/onboarding-bg.png')}
        style={currentStyles.onboardingBg}
        resizeMode="cover"
      />

      <SafeAreaView style={currentStyles.safeArea}>
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

          <TouchableOpacity
            style={[currentStyles.button, { backgroundColor: '#1E3A8A' }]}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={currentStyles.buttonText}> {t('onboarding.get_started')} </Text>
          </TouchableOpacity>

          <View style={currentStyles.footer}>
            <Text style={currentStyles.footerText}>
              {t('onboarding.already_have_account')}{' '}
              <Text style={currentStyles.link} onPress={onLogin}>
                {t('onboarding.sign_in')}
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = (typography: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
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
      paddingBottom: 40,
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
    button: {
      width: '100%',
      paddingVertical: 18,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonText: {
      ...typography('button'),
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
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
