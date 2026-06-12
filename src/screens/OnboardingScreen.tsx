import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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
import { analytics } from '../lib/analytics';
import { isDebugMode } from '../config/debug';
import ApiUrlSwitcherModal from '../components/ApiUrlSwitcherModal';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
    analytics.trackOnboardingCompleted();
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
    <LinearGradient colors={['#f9fbff', '#eaf1fc', '#e3edfb']} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={currentStyles.container}
      >
        {/* Top Header Buttons */}
        <View style={[currentStyles.topRow, { paddingTop: insets.top + spacing.sm }]}>
          {isDebugMode() ? (
            <TouchableOpacity
              testID="onboarding-api-switcher-chip"
              onPress={() => setShowApiModal(true)}
              style={currentStyles.chip}
              activeOpacity={0.8}
            >
              <Ionicons name="server-outline" size={16} color={theme.colors.primary} />
              <Text style={currentStyles.chipText}>API</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            testID="onboarding-language-toggle"
            onPress={toggleLanguage}
            style={currentStyles.chip}
            activeOpacity={0.8}
          >
            <Text style={currentStyles.chipText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
            <Ionicons name="language-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Brand Container */}
        <View style={currentStyles.brandContainer}>
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.brandWord}>El Booklets</Text>
        </View>

        {/* Role Toggle */}
        <View style={currentStyles.segmentedContainer}>
          <TouchableOpacity
            testID="onboarding-student-tab"
            onPress={() => setActiveRole('student')}
            style={[
              currentStyles.segmentButton,
              activeRole === 'student' && currentStyles.segmentButtonActive,
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                currentStyles.segmentText,
                activeRole === 'student' && currentStyles.segmentTextActive,
              ]}
            >
              {t('onboarding.role_student')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="onboarding-parent-tab"
            onPress={() => setActiveRole('parent')}
            style={[
              currentStyles.segmentButton,
              activeRole === 'parent' && currentStyles.segmentButtonActive,
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                currentStyles.segmentText,
                activeRole === 'parent' && currentStyles.segmentTextActive,
              ]}
            >
              {t('onboarding.role_parent')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card Illustration */}
        <LinearGradient colors={['#ffffff', '#eaf3ff', '#dbeafa']} style={currentStyles.heroCard}>
          {/* Blobs */}
          <View style={currentStyles.blob1} />
          <View style={currentStyles.blob2} />

          {/* Floating Badges */}
          <View style={[currentStyles.fabBadge, currentStyles.fab1]}>
            <Ionicons name="bulb" size={20} color="#d97706" />
          </View>
          <View style={[currentStyles.fabBadge, currentStyles.fab2]}>
            <Ionicons name="book" size={18} color="#16a34a" />
          </View>
          <View style={[currentStyles.fabBadge, currentStyles.fab3]}>
            <Ionicons name="trending-up" size={19} color="#004a9a" />
          </View>
          <View style={[currentStyles.fabBadge, currentStyles.fab4]}>
            <Ionicons name="ribbon" size={18} color="#1e54b8" />
          </View>

          {/* Mock Device */}
          <View style={currentStyles.mockDevice}>
            <View style={[currentStyles.deviceBar, { width: '60%' }]} />

            <View style={currentStyles.qRow}>
              <View style={currentStyles.deviceCheckCircle}>
                <Ionicons name="checkmark" size={11} color="#ffffff" />
              </View>
              <View style={currentStyles.deviceLine} />
            </View>

            <View style={currentStyles.qRow}>
              <View style={currentStyles.deviceCheckCircle}>
                <Ionicons name="checkmark" size={11} color="#ffffff" />
              </View>
              <View style={currentStyles.deviceLine} />
            </View>

            <View style={[currentStyles.qRow, currentStyles.qRowMuted]}>
              <View style={[currentStyles.deviceCheckCircle, currentStyles.deviceCheckMuted]}>
                <Ionicons name="flash" size={11} color="#004a9a" />
              </View>
              <View style={currentStyles.deviceLine} />
            </View>
          </View>
        </LinearGradient>

        {/* Headline & Features */}
        <View style={currentStyles.titleSection}>
          <Text style={currentStyles.title}>{t('onboarding.title')}</Text>

          <View style={currentStyles.featuresRow}>
            {t('onboarding.subtitle')
              .split(/[•·]/)
              .map((feat, index) => {
                const trimmedFeat = feat.trim();
                if (!trimmedFeat) return null;
                return (
                  <View key={index} style={currentStyles.featureItem}>
                    {index === 0 ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#16a34a"
                        style={{ marginEnd: 4 }}
                      />
                    ) : (
                      <View style={currentStyles.featureDot} />
                    )}
                    <Text style={currentStyles.featureText}>{trimmedFeat}</Text>
                  </View>
                );
              })}
          </View>
        </View>

        {/* CTA Container */}
        <View style={currentStyles.bottomContent}>
          <AppButton
            testID="onboarding-get-started"
            title={t('onboarding.get_started')}
            onPress={handleGetStarted}
            size="lg"
            icon={
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#ffffff" />
            }
            iconPosition="right"
          />

          <View style={currentStyles.footer}>
            <Text style={currentStyles.footerText}>{t('onboarding.already_have_account')} </Text>
            <TouchableOpacity
              testID="onboarding-sign-in"
              onPress={handleSignIn}
              activeOpacity={0.7}
              style={{ padding: 10, margin: -10 }}
            >
              <Text style={currentStyles.link}>{t('onboarding.sign_in')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ApiUrlSwitcherModal isVisible={showApiModal} onClose={() => setShowApiModal(false)} />
    </LinearGradient>
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
      alignItems: 'center',
      paddingBottom: Math.max(insets.bottom, 24),
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      marginBottom: 14,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(0,74,154,0.08)',
      borderRadius: 100,
      paddingHorizontal: 14,
      paddingVertical: 9,
      ...layout.shadow,
    },
    chipText: {
      ...typography('bodySmall'),
      ...fontWeight('700'),
      color: '#1E3063',
    },
    brandContainer: {
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 18,
    },
    logo: {
      height: 70,
      width: 70,
    },
    brandWord: {
      marginTop: 8,
      fontSize: 18,
      ...fontWeight('900'),
      color: '#1E54B8',
      letterSpacing: -0.2,
    },
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 5,
      gap: 4,
      width: '88%',
      marginBottom: 22,
      ...layout.shadow,
    },
    segmentButton: {
      flex: 1,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    segmentButtonActive: {
      backgroundColor: '#004A9A',
      shadowColor: '#004A9A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 4,
    },
    segmentText: {
      ...typography('body'),
      ...fontWeight('800'),
      color: '#475569',
    },
    segmentTextActive: {
      color: '#FFFFFF',
    },
    heroCard: {
      position: 'relative',
      borderRadius: 28,
      overflow: 'hidden',
      paddingVertical: 26,
      paddingHorizontal: 18,
      marginBottom: 22,
      minHeight: 236,
      width: '88%',
      alignItems: 'center',
      justifyContent: 'center',
      ...layout.shadow,
    },
    blob1: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#cfe3ff',
      position: 'absolute',
      top: -24,
      start: -20,
      opacity: 0.5,
    },
    blob2: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: '#d9f5e4',
      position: 'absolute',
      bottom: -18,
      end: -14,
      opacity: 0.5,
    },
    fabBadge: {
      position: 'absolute',
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      ...layout.shadow,
      zIndex: 10,
    },
    fab1: {
      top: 24,
      start: 24,
    },
    fab2: {
      bottom: 30,
      start: 18,
      width: 42,
      height: 42,
    },
    fab3: {
      top: 30,
      end: 22,
      width: 44,
      height: 44,
    },
    fab4: {
      bottom: 24,
      end: 28,
      width: 40,
      height: 40,
    },
    mockDevice: {
      width: 150,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 14,
      ...layout.shadow,
      transform: [{ rotate: '-3deg' }],
      zIndex: 2,
    },
    deviceBar: {
      height: 7,
      borderRadius: 6,
      backgroundColor: '#F3F5FB',
      marginBottom: 9,
    },
    qRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
    },
    qRowMuted: {
      opacity: 0.8,
    },
    deviceCheckCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#16a34a',
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: 8,
    },
    deviceCheckMuted: {
      backgroundColor: '#DBEAFA',
    },
    deviceLine: {
      flex: 1,
      height: 8,
      borderRadius: 5,
      backgroundColor: '#F3F5FB',
    },
    titleSection: {
      width: '100%',
      paddingHorizontal: layout.screenPadding,
      alignItems: 'center',
      marginBottom: 22,
    },
    title: {
      fontSize: 24,
      ...fontWeight('900'),
      color: '#1E3063',
      textAlign: 'center',
      lineHeight: 30,
      marginBottom: 10,
    },
    featuresRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 2,
    },
    featureDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#004A9A',
      marginEnd: 4,
      marginStart: 6,
    },
    featureText: {
      fontSize: 12,
      ...fontWeight('600'),
      color: '#475569',
    },
    bottomContent: {
      width: '88%',
      alignItems: 'center',
      marginTop: 'auto',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 14,
    },
    footerText: {
      ...typography('body'),
      fontSize: 14,
      color: '#94a3b8',
    },
    link: {
      ...typography('button'),
      color: '#1E54B8',
      ...fontWeight('800'),
    },
  });

export default OnboardingScreen;
