import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import AppButton from './AppButton';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { layout } from '../config/layout';
import { spacing } from '../config/spacing';

const { width } = Dimensions.get('window');
const logo = require('../../assets/logo-transparent.png');

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  showCancel?: boolean;
  dismissible?: boolean;
  backButtonCloseDisabled?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = (props: ConfirmModalProps) => {
  const {
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel,
    cancelLabel,
    confirmVariant = 'primary',
    isLoading = false,
    showCancel = true,
    dismissible = true,
    backButtonCloseDisabled = true,
  } = props;

  const { theme, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  const handleRequestClose = () => {
    if (!backButtonCloseDisabled) {
      onCancel();
    }
  };

  const handleBackdropPress = () => {
    if (dismissible) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleRequestClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={handleBackdropPress}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.bgGray }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logoImage} />
            </View>
            <Text
              style={[
                styles.title,
                typography('h2'),
                fontWeight('700'),
                { color: theme.colors.text },
              ]}
            >
              {title}
            </Text>
          </View>

          <Text
            style={[
              styles.message,
              typography('body'),
              { color: theme.colors.textSecondary },
            ]}
          >
            {message}
          </Text>

          <View style={styles.buttonContainer}>
            <AppButton
              title={confirmLabel || t('common.ok', 'OK')}
              onPress={onConfirm}
              variant={confirmVariant}
              loading={isLoading}
              fullWidth={true}
            />
            {showCancel && (
              <AppButton
                title={cancelLabel || t('common.cancel', 'Cancel')}
                onPress={onCancel}
                variant="outline"
                fullWidth={true}
                disabled={isLoading}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.mdd,
  },
  container: {
    width: '100%',
    padding: spacing.mdd,
    paddingTop: 40,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
});
