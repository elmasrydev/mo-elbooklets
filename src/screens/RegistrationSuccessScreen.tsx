import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RegistrationSuccessScreen: React.FC = () => {
  const { spacing } = useTheme();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const { setRegistrationSuccessPending } = useAuth();
  const insets = useSafeAreaInsets();

  const handleStartLearning = async () => {
    // Clear registration success pending flag to route user to MainTabs
    await setRegistrationSuccessPending(false);
  };

  const currentStyles = styles({
    spacing,
    typography,
    fontWeight,
    insets,
  });

  return (
    <View style={currentStyles.container}>
      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Ring */}
        <View style={currentStyles.successRing}>
          <Ionicons name="sparkles-outline" size={44} color="#059669" />
        </View>

        {/* Headers */}
        <Text style={currentStyles.title}>{t('auth.success_title')}</Text>
        <Text style={currentStyles.subtitle}>{t('auth.success_subtitle')}</Text>

        {/* CTA Button */}
        <TouchableOpacity
          style={currentStyles.primaryButton}
          onPress={handleStartLearning}
          activeOpacity={0.8}
        >
          <Ionicons name="book-outline" size={20} color="#FFFFFF" />
          <Text style={currentStyles.buttonText}>{t('auth.success_cta')}</Text>
        </TouchableOpacity>

        {/* Perks Grid */}
        <View style={currentStyles.perksContainer}>
          {/* Perk 1 */}
          <View style={currentStyles.perkItem}>
            <View style={[currentStyles.perkIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#059669" />
            </View>
            <Text style={currentStyles.perkLabel}>{t('auth.success_perk_quizzes')}</Text>
          </View>

          {/* Perk 2 */}
          <View style={currentStyles.perkItem}>
            <View style={[currentStyles.perkIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="trending-up-outline" size={22} color="#1E3063" />
            </View>
            <Text style={currentStyles.perkLabel}>{t('auth.success_perk_tracking')}</Text>
          </View>

          {/* Perk 3 */}
          <View style={currentStyles.perkItem}>
            <View style={[currentStyles.perkIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="trophy-outline" size={22} color="#d97706" />
            </View>
            <Text style={currentStyles.perkLabel}>{t('auth.success_perk_leaderboard')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (config: any) => {
  const { spacing, typography, fontWeight, insets } = config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F3F5FB',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: insets.top + spacing.xl,
      paddingBottom: insets.bottom + spacing.xl,
    },
    successRing: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: '#ecfdf5',
      borderWidth: 2,
      borderColor: '#d1fae5',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg + 4,
    },
    title: {
      fontSize: 28,
      ...fontWeight('700'),
      color: '#015AB4',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography('bodySmall'),
      color: 'rgba(30, 48, 99, 0.67)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    primaryButton: {
      flexDirection: 'row',
      width: '100%',
      height: 56,
      backgroundColor: '#005ab4',
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xl,
      ...Platform.select({
        ios: {
          shadowColor: '#005ab4',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    buttonText: {
      ...typography('button'),
      color: '#FFFFFF',
      ...fontWeight('700'),
    },
    perksContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    perkItem: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
    },
    perkIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    perkLabel: {
      fontSize: 12,
      ...fontWeight('600'),
      color: '#64748b',
      textAlign: 'center',
    },
  });
};

export default RegistrationSuccessScreen;
