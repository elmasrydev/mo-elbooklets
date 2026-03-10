import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useForceUpdate } from '../context/ForceUpdateContext';
import { useTypography } from '../hooks/useTypography';

const MaintenanceModal: React.FC = () => {
  const { isMaintenanceMode } = useForceUpdate();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography } = useTypography();
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!isMaintenanceMode) return;

    // Prevent physical back button on Android
    const onBackPress = () => true;

    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [isMaintenanceMode]);

  if (!isMaintenanceMode) return null;

  return (
    <Modal
      visible={isMaintenanceMode}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles(theme, borderRadius, spacing).overlay}>
        <View style={styles(theme, borderRadius, spacing).container}>
          <View style={styles(theme, borderRadius, spacing).iconContainer}>
            <Ionicons name="construct" size={48} color={theme.colors.primary} />
          </View>

          <View style={styles(theme, borderRadius, spacing).textContainer}>
            <Text style={[typography('h3'), styles(theme, borderRadius, spacing).title]}>
              {t('maintenance.title', 'Under Maintenance')}
            </Text>
            <Text style={[typography('body'), styles(theme, borderRadius, spacing).description]}>
              {t(
                'maintenance.description',
                'We are currently performing scheduled maintenance to improve your experience. Please check back shortly.'
              )}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = (theme: any, borderRadius: any, spacing: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    textContainer: {
      alignItems: 'center',
    },
    title: {
      color: theme.colors.textQuery,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    description: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

export default React.memo(MaintenanceModal);
