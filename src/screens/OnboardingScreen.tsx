import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted, onLogin }) => {
  const { t } = useTranslation();
  const { theme, spacing, fontSizes, borderRadius } = useTheme();
  const commonStyles = useCommonStyles();

  return (
    <View style={styles.container}>
      {/* 1. Full-screen Background Image */}
      <Image
        source={require('../../assets/onboarding-bg.png')}
        style={styles.onboardingBg}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* 2. Top Logo Overlay */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Spacer to push content to bottom */}
        <View style={styles.spacer} />

        {/* 3. Bottom Content */}
        <View style={styles.bottomContent}>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#1E3A8A' }]}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t('onboarding.get_started')}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('onboarding.already_have_account')}{' '}
              <Text style={styles.link} onPress={onLogin}>
                {t('onboarding.sign_in')}
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    color: '#475569',
  },
  link: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
});

export default OnboardingScreen;
