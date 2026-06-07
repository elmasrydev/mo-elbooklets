import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { layout } from '../config/layout';

interface QuizFlowHeaderProps {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
  onClose?: () => void;
}

const QuizFlowHeader: React.FC<QuizFlowHeaderProps> = ({
  currentStep,
  totalSteps = 3,
  onBack,
  onClose,
}) => {
  const navigation = useNavigation<any>();
  const { theme, spacing, borderRadius, fontSizes } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Dismiss the entire modal stack cleanly by popping to the root screen
      if (typeof navigation.popToTop === 'function') {
        navigation.popToTop();
      } else {
        navigation.goBack();
      }
    }
  };

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onBack]);

  const HEADER_CONTENT_HEIGHT = 76;
  const headerTop = insets.top;
  const totalHeight = headerTop + HEADER_CONTENT_HEIGHT;

  const currentStyles = styles(theme, spacing, borderRadius, fontSizes, typography, fontWeight);

  return (
    <View
      style={[
        currentStyles.container,
        {
          height: totalHeight,
          paddingTop: headerTop,
        },
      ]}
    >
      <View style={currentStyles.actionRow}>
        {/* Back Button */}
        <TouchableOpacity
          style={currentStyles.iconButton}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={
              Platform.OS === 'ios'
                ? isRTL
                  ? 'chevron-forward'
                  : 'chevron-back'
                : isRTL
                  ? 'arrow-forward'
                  : 'arrow-back'
            }
            size={22}
            color="#1E3063"
          />
        </TouchableOpacity>

        {/* Step Indicator Text */}
        <Text style={currentStyles.stepText}>
          {t('quiz_flow.step_x_of_y', { current: currentStep, total: totalSteps })}
        </Text>

        {/* Close Button */}
        <TouchableOpacity
          style={currentStyles.iconButton}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color="#1E3063" />
        </TouchableOpacity>
      </View>

      {/* Step Indicator Dots */}
      <View style={currentStyles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepIndex = index + 1;
          const isActive = stepIndex === currentStep;
          const isDone = stepIndex < currentStep;

          return (
            <View
              key={stepIndex}
              style={[
                currentStyles.dot,
                isActive && currentStyles.dotActive,
                isDone && currentStyles.dotDone,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  borderRadius: any,
  fontSizes: any,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.headerBackground || '#F3F5FB',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 74, 154, 0.06)',
      justifyContent: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    stepText: {
      ...typography('caption'),
      ...fontWeight('900'),
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: '#94a3b8',
    },
    dotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 20,
      marginBottom: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: '#cbd5e1',
    },
    dotActive: {
      width: 22,
      backgroundColor: '#004A9A',
    },
    dotDone: {
      backgroundColor: '#16a34a',
    },
  });

export default React.memo(QuizFlowHeader);
