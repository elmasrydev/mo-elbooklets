import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Platform,
  Linking,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useForceUpdate } from '../context/ForceUpdateContext';
import AppButton from './AppButton';
import { layout } from '../config/layout';

const APP_STORE_URL = 'itms-apps://apps.apple.com/app/id6761079894';
const PLAY_STORE_URL = 'market://details?id=com.elbooklets.app';

const ForceUpdateModal: React.FC = () => {
  const { t } = useTranslation();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { shouldUpdate, isForceUpdate, dismissUpdate } = useForceUpdate();

  useEffect(() => {
    if (!shouldUpdate) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (shouldUpdate) return true;
      return false;
    });
    return () => backHandler.remove();
  }, [shouldUpdate]);

  const handleUpdate = () => {
    const url = Platform.select({ ios: APP_STORE_URL, android: PLAY_STORE_URL });
    if (url) Linking.openURL(url);
  };

  const handleSkip = () => {
    if (!isForceUpdate) dismissUpdate();
  };

  if (!shouldUpdate) return null;

  return (
    <Modal
      visible={shouldUpdate}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <TouchableOpacity style={styles(theme).overlay} activeOpacity={1}>
        <TouchableOpacity style={styles(theme, borderRadius, spacing).container} activeOpacity={1}>
          <View style={styles(theme, borderRadius, spacing).logoContainer}>
            <Ionicons name="rocket-outline" size={60} color={theme.colors.primary} />
          </View>

          <View style={styles(theme, borderRadius, spacing).content}>
            <Text style={styles(theme, borderRadius, spacing).title}>
              {isForceUpdate
                ? t('common.forceUpdate.requiredTitle')
                : t('common.forceUpdate.optionalTitle')}
            </Text>

            <Text style={styles(theme, borderRadius, spacing).description}>
              {isForceUpdate
                ? t('common.forceUpdate.requiredDescription')
                : t('common.forceUpdate.optionalDescription')}
            </Text>
          </View>

          <View style={styles(theme, borderRadius, spacing).buttonContainer}>
            <AppButton
              title={t('common.forceUpdate.updateNow')}
              onPress={handleUpdate}
              icon={<Ionicons name="arrow-forward-circle" size={24} color="#FFF" />}
              style={{ marginBottom: spacing.md }}
            />

            {!isForceUpdate && (
              <TouchableOpacity
                onPress={handleSkip}
                style={{ alignItems: 'center', paddingVertical: spacing.sm }}
              >
                <Text style={{ color: theme.colors.textSecondary, fontSize: fontSizes.md }}>
                  {t('common.forceUpdate.later')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isForceUpdate && (
            <View style={styles(theme, borderRadius, spacing).forceBadge}>
              <Ionicons name="lock-closed" size={14} color="#FFF" />
              <Text style={styles(theme, borderRadius, spacing).forceBadgeText}>
                {t('common.forceUpdate.mandatoryUpdate')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = (theme: any, borderRadius: any = {}, spacing: any = {}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    container: {
      width: '100%',
      backgroundColor: theme.colors?.surface || theme.colors?.card || '#FFF',
      borderRadius: borderRadius.xl || 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: spacing.xl || 32,
      marginBottom: spacing.md || 16,
    },
    content: {
      paddingHorizontal: spacing.xl || 24,
      paddingBottom: spacing.lg || 24,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors?.text || '#000',
      textAlign: 'center',
      marginBottom: spacing.sm || 8,
    },
    description: {
      fontSize: 16,
      color: theme.colors?.textSecondary || '#666',
      textAlign: 'center',
      lineHeight: 24,
    },
    buttonContainer: {
      paddingHorizontal: spacing.xl || 24,
      paddingBottom: spacing.xl || 24,
    },
    forceBadge: {
      position: 'absolute',
      top: spacing.md || 16,
      right: spacing.md || 16,
      backgroundColor: theme.colors?.error || '#ef4444',
      borderRadius: 999,
      paddingHorizontal: spacing.sm || 12,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    forceBadgeText: {
      fontSize: 12,
      color: '#FFF',
      fontWeight: '600',
      marginLeft: 4,
    },
  });

export default React.memo(ForceUpdateModal);
