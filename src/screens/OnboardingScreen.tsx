import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
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
  const [activeRole, setActiveRole] = useState<'student' | 'parent'>('student');

  const handleGetStarted = () => {
    if (activeRole === 'student') {
      navigation.navigate('Register');
    } else {
      navigation.navigate('ParentRegister');
    }
  };

  const handleSignIn = () => {
    if (activeRole === 'student') {
      navigation.navigate('Login');
    } else {
      navigation.navigate('ParentLogin');
    }
  };

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={currentStyles.container}
      >
        {/* Top Header Buttons */}
        {isDebugMode() && (
          <TouchableOpacity
            onPress={() => setShowApiModal(true)}
            style={[
              currentStyles.languageButton,
              { top: insets.top + spacing.sm, left: spacing.md },
            ]}
          >
            <Ionicons name="server-outline" size={20} color={theme.colors.primary} />
            <Text style={currentStyles.languageText}>API</Text>
          </TouchableOpacity>
        )}

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
          source={require('../../assets/transWithSlogan.png')}
          style={currentStyles.logo}
          resizeMode="contain"
        />

        {/* Role Toggle */}
        <View style={currentStyles.roleToggleContainer}>
          <TouchableOpacity
            onPress={() => setActiveRole('student')}
            style={[
              currentStyles.roleToggleButton,
              activeRole === 'student' && currentStyles.roleToggleActive,
            ]}
          >
            <Text
              style={[
                currentStyles.roleToggleText,
                activeRole === 'student' && currentStyles.roleToggleActiveText,
              ]}
            >
              {t('onboarding.role_student')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveRole('parent')}
            style={[
              currentStyles.roleToggleButton,
              activeRole === 'parent' && currentStyles.roleToggleActive,
            ]}
          >
            <Text
              style={[
                currentStyles.roleToggleText,
                activeRole === 'parent' && currentStyles.roleToggleActiveText,
              ]}
            >
              {t('onboarding.role_parent')}
            </Text>
          </TouchableOpacity>
        </View>

        <Image
          source={require('../../assets/onboarding-bg.png')}
          style={currentStyles.onboardingBg}
          resizeMode="contain"
        />

        {/* Bottom Content */}
        <View style={currentStyles.bottomContent}>
          <AppButton
            title={t('onboarding.get_started')}
            onPress={handleGetStarted}
            size="lg"
          />

          <View style={[currentStyles.footer]}>
            <Text style={currentStyles.footerText}>
              {t('onboarding.already_have_account')}{' '}
              <Text style={currentStyles.link} onPress={handleSignIn}>
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
      height: 80,
      width: 262,
    },
    roleToggleContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 4,
      marginTop: 20,
      marginBottom: 10,
      width: '80%',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    roleToggleButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    roleToggleActive: {
      backgroundColor: theme.colors.primary,
    },
    roleToggleText: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
    },
    roleToggleActiveText: {
      color: '#FFFFFF',
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
