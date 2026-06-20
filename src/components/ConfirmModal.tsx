import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  BackHandler,
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
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  showCancel?: boolean;
  dismissible?: boolean;
  backButtonCloseDisabled?: boolean;
  countdown?: number;
  children?: React.ReactNode;
  hasInput?: boolean;
  inputPlaceholder?: string;
  onInputChange?: (text: string) => void;
  inputValue?: string;
  icon?: React.ReactNode;
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
    countdown = 0,
    children,
    hasInput = false,
    inputPlaceholder = '',
    onInputChange,
    inputValue = '',
    icon,
  } = props;

  const { theme, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  const [timeLeft, setTimeLeft] = useState(countdown);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (visible) {
      setTimeLeft(countdown);
    }
  }, [countdown, visible]);

  useEffect(() => {
    if (visible && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [visible, timeLeft]);

  // Android back button support
  useEffect(() => {
    if (!visible) return;
    const onBackPress = () => {
      if (!backButtonCloseDisabled) {
        onCancel();
      }
      return true; // Prevent default back behavior
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, backButtonCloseDisabled, onCancel]);

  const handleBackdropPress = () => {
    if (dismissible) {
      onCancel();
    }
  };

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        accessible={false}
        activeOpacity={1}
        style={styles.overlay}
        onPress={handleBackdropPress}
      >
        <TouchableWithoutFeedback accessible={false} onPress={() => Keyboard.dismiss()}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.colors.card,
                borderRadius: borderRadius.xl,
              },
            ]}
            onStartShouldSetResponder={() => true}
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
                {icon ? icon : <Image source={logo} style={styles.logoImage} />}
              </View>
              <Text
                testID="confirm-modal-title"
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
              style={[styles.message, typography('body'), { color: theme.colors.textSecondary }]}
            >
              {message}
            </Text>
            {children}

            {hasInput && (
              <TextInput
                style={[
                  styles.input,
                  typography('body'),
                  {
                    backgroundColor: theme.colors.bgGray,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder={inputPlaceholder}
                placeholderTextColor={theme.colors.textTertiary}
                value={inputValue}
                onChangeText={onInputChange}
                autoFocus={true}
              />
            )}

            <View style={styles.buttonContainer}>
              <AppButton
                testID="confirm-modal-ok"
                title={
                  timeLeft > 0
                    ? `${confirmLabel || t('common.ok', 'OK')} (${timeLeft})`
                    : confirmLabel || t('common.ok', 'OK')
                }
                onPress={onConfirm}
                variant={confirmVariant}
                loading={isLoading}
                disabled={timeLeft > 0}
                fullWidth={true}
              />
              {showCancel && (
                <AppButton
                  testID="confirm-modal-cancel"
                  title={cancelLabel || t('common.cancel', 'Cancel')}
                  onPress={onCancel}
                  variant="outline"
                  fullWidth={true}
                  disabled={isLoading}
                />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
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
    end: 12,
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
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
    // fontSize handled by typography('body')
  },
});
