import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  NativeModules,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { ApiUriManager } from '../config/api';
import AppButton from './AppButton';

interface ApiUrlSwitcherModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const PRODUCTION_URL = 'https://elbooklets.com/graphql';
const DEMO_URL = 'https://demo.elbooklets.com/graphql';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    width: '100%',
  },
  infoCard: {
    padding: 16,
    marginBottom: 20,
  },
  actions: {
    gap: 12,
  },
});

const ApiUrlSwitcherModal: React.FC<ApiUrlSwitcherModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();

  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (isVisible) {
      setCurrentUrl(ApiUriManager.getActiveUrl());
    }
  }, [isVisible]);

  const handleReload = useCallback(async () => {
    if (__DEV__) {
      const DevSettings = NativeModules.DevSettings;
      if (DevSettings?.reload) {
        DevSettings.reload();
      } else {
        Alert.alert('Manual Reload Required', 'Please restart the app manually.');
      }
    } else {
      try {
        await Updates.reloadAsync();
      } catch (_e) {
        Alert.alert('Error', 'Please restart the app manually.');
      }
    }
  }, []);

  const applyUrl = useCallback(
    async (url: string) => {
      if (url === currentUrl) {
        onClose();
        return;
      }
      await ApiUriManager.updateUrl(url);
      onClose();
      setTimeout(handleReload, 500);
    },
    [currentUrl, onClose, handleReload],
  );

  const isProduction = currentUrl === PRODUCTION_URL;
  const isDemo = currentUrl === DEMO_URL;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          onStartShouldSetResponder={() => true}
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                typography('h3'),
                fontWeight('700'),
                { color: theme.colors.text },
              ]}
            >
              {t('common.api_url_switcher_title')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Current URL Info */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.colors.background,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text
                style={[
                  typography('caption'),
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('common.api_current_url')}
              </Text>
              <Text
                style={[
                  typography('bodySmall'),
                  fontWeight('600'),
                  { color: theme.colors.primary, marginTop: 4 },
                ]}
              >
                {currentUrl}
              </Text>
            </View>

            {/* Switch Buttons */}
            <View style={styles.actions}>
              <AppButton
                title={t('common.api_switch_production')}
                variant={isProduction ? 'primary' : 'outline'}
                disabled={isProduction}
                onPress={() => applyUrl(PRODUCTION_URL)}
              />
              <AppButton
                title={t('common.api_switch_demo')}
                variant={isDemo ? 'primary' : 'outline'}
                disabled={isDemo}
                onPress={() => applyUrl(DEMO_URL)}
              />
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default ApiUrlSwitcherModal;
