import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
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
import messaging from '@react-native-firebase/messaging';
import { lastFcmPayload } from '../services/notificationService';
import * as Clipboard from 'expo-clipboard';
import DeviceInfo from 'react-native-device-info';
import Constants from 'expo-constants';
import { tryFetchWithFallback } from '../config/api';
import * as SecureStore from 'expo-secure-store';
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
  const { user, updateUser } = useAuth();
  const [showApiModal, setShowApiModal] = useState(false);
  const [triggerReactCrash, setTriggerReactCrash] = useState(false);

  // From notification branch (feature/BKLT-16)
  const [fcmToken, setFcmToken] = useState<string>('');
  React.useEffect(() => {
    const fetchToken = async () => {
      try {
        const isEmulator = await DeviceInfo.isEmulator();
        if (Platform.OS === 'ios' && isEmulator) {
          setFcmToken('Simulator (APNs not supported)');
          return;
        }
        // On iOS, we must explicitly register for remote messages before getting the token
        if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
          try {
            await messaging().registerDeviceForRemoteMessages();
          } catch (regErr: any) {
            console.log('Failed to register for remote messages', regErr);
          }
        }
        // Add a 5 second timeout to getToken since it hangs infinitely if APNs is missing in Xcode
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000),
        );
        const token = await Promise.race([messaging().getToken(), timeoutPromise]);
        setFcmToken(token);
      } catch (err: any) {
        console.log('Error getting FCM token', err);
        if (err.message === 'timeout') {
          setFcmToken('Timeout: APNs capability missing?');
        } else {
          setFcmToken('Error: ' + err.message);
        }
      }
    };
    fetchToken();
  }, []);
  const copyFcmToClipboard = async () => {
    if (fcmToken) {
      console.log('FCM Token copied to clipboard', fcmToken);
      await Clipboard.setStringAsync(fcmToken);
      alert('FCM Token copied to clipboard');
    }
  };
  // From OTP branch (main)
  const [isUnverifying, setIsUnverifying] = useState(false);
  const handleUnverifyMobile = async () => {
    try {
      setIsUnverifying(true);
      const token = await SecureStore.getItemAsync('auth_token');
      const input = {
        name: user?.name,
        email: user?.email,
        mobile: user?.mobile,
        mobile_verified_at: 'reset',
      };

      const result = await tryFetchWithFallback(
        `mutation UpdateProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            id
            mobile_verified_at
          }
        }`,
        { input },
        token || undefined,
      );

      if (result.data?.updateProfile && user) {
        await updateUser({ ...user, mobile_verified_at: undefined });
        alert('Unverified! Restart app or log out to see OTP screen.');
      }
    } catch (e: any) {
      alert('Failed to unverify: ' + e.message);
    } finally {
      setIsUnverifying(false);
    }
  };
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
      <UnifiedHeader title={t('profile_screen.internal_settings')} showBackButton={true} />
      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={currentStyles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {triggerReactCrash && <CrashTrigger />}
        <View style={currentStyles.section}>
          <Text style={currentStyles.sectionTitle}>{t('common.api_connection_title')}</Text>
          <TouchableOpacity style={currentStyles.settingItem} onPress={() => setShowApiModal(true)}>
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.warning + '20' },
              ]}
            >
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
          <Text style={currentStyles.sectionTitle}>Push Notifications</Text>
          <TouchableOpacity style={currentStyles.settingItem} onPress={copyFcmToClipboard}>
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.success + '20' },
              ]}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.success} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>FCM Token</Text>
              <Text style={currentStyles.settingSubtitle} numberOfLines={1} ellipsizeMode="middle">
                {fcmToken || 'Loading...'}
              </Text>
            </View>
            <Ionicons name="copy-outline" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
        {Constants.expoConfig?.extra?.debugMode && (
          <View style={currentStyles.section}>
            <Text style={currentStyles.sectionTitle}>Last Received FCM Payload</Text>
            <View style={currentStyles.jsonViewerContainer}>
              <Text style={currentStyles.jsonText}>
                {lastFcmPayload
                  ? JSON.stringify(lastFcmPayload, null, 2)
                  : 'No payload received in this session.'}
              </Text>
            </View>
          </View>
        )}
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
                <Text style={currentStyles.crashButtonText}>{t('profile_screen.test_crash')}</Text>
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
        {isDebugMode() && (
          <View style={currentStyles.section}>
            <View style={currentStyles.crashTestContainer}>
              <View style={currentStyles.crashTestHeader}>
                <Ionicons name="construct-outline" size={18} color={theme.colors.primary} />
                <Text style={[currentStyles.crashTestTitle, { color: theme.colors.primary }]}>
                  Developer Tools
                </Text>
              </View>
              <Text style={currentStyles.crashTestSubtitle}>
                Reset verification to test the OTP flow again.
              </Text>
              <TouchableOpacity
                style={[currentStyles.crashButton, { backgroundColor: '#8B5CF6' }]}
                onPress={handleUnverifyMobile}
                disabled={isUnverifying}
              >
                {isUnverifying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="phone-portrait-outline" size={16} color="#fff" />
                    <Text style={currentStyles.crashButtonText}>Unverify Mobile Number</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    settingSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
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
    jsonViewerContainer: {
      backgroundColor: isDark ? '#1E1E1E' : '#F3F4F6',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    jsonText: {
      ...typography('caption'),
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: theme.colors.textSecondary,
      textAlign: 'left',
    },
  });
export default InternalSettingsScreen;
