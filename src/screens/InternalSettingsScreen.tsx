import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { isDebugMode } from '../config/debug';
import ApiUrlSwitcherModal from '../components/ApiUrlSwitcherModal';
import crashlytics from '@react-native-firebase/crashlytics';

const CrashTrigger = () => {
  throw new Error('Test React Render Error for ErrorBoundary');
};

const InternalSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, spacing, fontSizes, borderRadius, isDark } = useTheme();
  const common = useCommonStyles();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const [showApiModal, setShowApiModal] = useState(false);
  const [triggerReactCrash, setTriggerReactCrash] = useState(false);

  const handleTestCrash = () => {
    crashlytics().crash();
  };

  const handleTestLogError = () => {
    crashlytics().log('Test log from Internal Settings Screen');
    crashlytics().recordError(
      new Error('Test error from Internal Settings Screen at ' + new Date().toISOString()),
    );
  };

  const handleTestReactCrash = () => {
    setTriggerReactCrash(true);
  };

  const currentStyles = useMemo(
    () =>
      styles(
        theme,
        spacing,
        fontSizes,
        borderRadius,
        common,
        isRTL,
        typography,
        fontWeight,
        isDark,
      ),
    [theme, spacing, fontSizes, borderRadius, common, isRTL, typography, fontWeight, isDark],
  );

  return (
    <View style={currentStyles.mainContainer}>
      <UnifiedHeader
        title={t('profile_screen.internal_settings')}
        showBackButton={true}
        style={currentStyles.headerOverride}
      />

      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={currentStyles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {triggerReactCrash && <CrashTrigger />}
        
        <View style={currentStyles.section}>
          <Text style={currentStyles.sectionTitle}>{t('common.api_connection_title')}</Text>
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => setShowApiModal(true)}
          >
            <View style={[currentStyles.settingIconBox, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="server-outline" size={22} color={theme.colors.warning} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('common.api_url_switcher_title')}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        <View style={currentStyles.section}>
          <View style={currentStyles.crashTestContainer}>
            <View style={currentStyles.crashTestHeader}>
              <Ionicons name="bug-outline" size={18} color={theme.colors.warning} />
              <Text style={currentStyles.crashTestTitle}>
                {t('profile_screen.crashlytics_testing')}
              </Text>
            </View>
            <Text style={currentStyles.crashTestSubtitle}>
              {t('profile_screen.crashlytics_testing_desc')}
            </Text>
            <View style={currentStyles.crashTestButtonsRow}>
              <TouchableOpacity style={currentStyles.crashButton} onPress={handleTestCrash}>
                <Ionicons name="flame-outline" size={16} color="#fff" />
                <Text style={currentStyles.crashButtonText}>
                  {t('profile_screen.test_crash')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[currentStyles.crashButton, { backgroundColor: '#8B5CF6' }]}
                onPress={handleTestReactCrash}
              >
                <Ionicons name="warning-outline" size={16} color="#fff" />
                <Text style={currentStyles.crashButtonText}>{t('common.test_react_crash')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.logErrorButton} onPress={handleTestLogError}>
                <Ionicons name="alert-circle-outline" size={16} color="#fff" />
                <Text style={currentStyles.crashButtonText}>
                  {t('profile_screen.test_log_error')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <ApiUrlSwitcherModal isVisible={showApiModal} onClose={() => setShowApiModal(false)} />
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  fontSizes: any,
  borderRadius: any,
  common: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
  isDark: boolean,
) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerOverride: {
      backgroundColor: '#1E40AF',
      borderBottomWidth: 0,
    },
    scrollView: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: layout.screenPadding,
      paddingBottom: spacing['2xl'],
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: isRTL ? 'right' : 'left',
    },
    settingItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      ...layout.shadow,
    },
    settingIconBox: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? theme.colors.primary + '1A' : theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : spacing.md,
      marginLeft: isRTL ? spacing.md : 0,
    },
    settingContent: {
      flex: 1,
      justifyContent: 'center',
    },
    settingTitle: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    crashTestContainer: {
      padding: spacing.md,
      backgroundColor: isDark ? theme.colors.warning + '0D' : '#FFF8E1',
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.warning + '33' : '#FFE082',
    },
    crashTestHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    crashTestTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.warning,
      marginLeft: isRTL ? 0 : spacing.xs,
      marginRight: isRTL ? spacing.xs : 0,
    },
    crashTestSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: isRTL ? 'right' : 'left',
    },
    crashTestButtonsRow: {
      gap: spacing.sm,
    },
    crashButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: theme.colors.error,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    logErrorButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: theme.colors.warning,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    crashButtonText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#ffffff',
    },
  });

export default InternalSettingsScreen;
