import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import AppButton from '../components/AppButton';
import { layout } from '../config/layout';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useRef, useState, useCallback } from 'react';
import { isDebugMode } from '../config/debug';
import ApiUrlSwitcherModal from '../components/ApiUrlSwitcherModal';

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

  const [showApiModal, setShowApiModal] = useState(false);
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  const handleLogoTap = useCallback(() => {
    if (!isDebugMode()) return;
    const now = Date.now();
    if (now - lastTap.current > 5000) {
      tapCount.current = 1;
    } else {
      tapCount.current += 1;
    }
    lastTap.current = now;
    if (tapCount.current >= 7) {
      setShowApiModal(true);
      tapCount.current = 0;
    }
  }, []);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={currentStyles.container}
      >
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

        <TouchableOpacity activeOpacity={1} onPress={handleLogoTap}>
          <Image
            source={require('../../assets/transWithSlogan.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Image
          source={require('../../assets/onboarding-bg.png')}
          style={currentStyles.onboardingBg}
          resizeMode="contain"
        />

        {/* 3. Bottom Content */}
        <View style={currentStyles.bottomContent}>
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
          <Text style={currentStyles.title}> {t('onboarding.title')} </Text>
          <Text style={currentStyles.subtitle}> {t('onboarding.subtitle')} </Text>
        </View>
      </ScrollView>
      <ApiUrlSwitcherModal 
        isVisible={showApiModal} 
        onClose={() => setShowApiModal(false)} 
      />
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
      flexGrow: 1,
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
      marginTop: 50,
      marginBottom: -10,
      // width: 100,
      // height: 85,
      height: 80,
      width: 262,
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
      marginTop: 10,
    },
    subtitle: {
      ...typography('body'),
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 20,
    },
    footer: {
      marginTop: 8,
    },
    footerText: {
      ...typography('body'),
      fontSize: 15,
      color: '#475569',
      marginTop: 10,
    },
    link: {
      ...typography('button'),
      color: '#1E3A8A',
      ...fontWeight('700'),
    },
  });

export default OnboardingScreen;
