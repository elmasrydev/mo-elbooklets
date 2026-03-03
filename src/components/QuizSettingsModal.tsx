import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import AppButton from './AppButton';

interface QuizType {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  isDefault: boolean;
}

interface QuizSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (quizTypeId: string) => void;
  quizTypes: QuizType[];
  initialQuizTypeId?: string | null;
}

const QuizSettingsModal: React.FC<QuizSettingsModalProps> = ({
  visible,
  onClose,
  onStart,
  quizTypes,
  initialQuizTypeId,
}) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialQuizTypeId || null);

  useEffect(() => {
    if (visible && !selectedTypeId && quizTypes.length > 0) {
      const defaultType = quizTypes.find((qt) => qt.isDefault) || quizTypes[0];
      setSelectedTypeId(defaultType.id);
    }
  }, [visible, quizTypes, selectedTypeId]);

  const handleStart = () => {
    if (selectedTypeId) {
      onStart(selectedTypeId);
    }
  };

  const currentStyles = styles(
    theme,
    common,
    typography,
    fontWeight,
    fontSizes,
    spacing,
    borderRadius,
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={currentStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={currentStyles.modalContainer}>
              <View style={currentStyles.handleBar} />
              <View style={currentStyles.header}>
                <View style={currentStyles.headerIconContainer}>
                  <Ionicons name="options" size={24} color={theme.colors.primary} />
                </View>
                <View style={currentStyles.headerTextContainer}>
                  <Text style={currentStyles.title}> {t('quiz_lessons.quiz_settings')} </Text>
                  <Text style={currentStyles.subtitle}>
                    {' '}
                    {t('quiz_lessons.customize_experience')}{' '}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={currentStyles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
                <Text style={currentStyles.sectionTitle}>
                  {' '}
                  {t('quiz_lessons.select_quiz_type')}{' '}
                </Text>

                <View style={currentStyles.optionsContainer}>
                  {quizTypes.map((type) => {
                    const isSelected = selectedTypeId === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          currentStyles.optionCard,
                          isSelected && currentStyles.optionCardSelected,
                        ]}
                        onPress={() => setSelectedTypeId(type.id)}
                        activeOpacity={0.7}
                      >
                        <View style={currentStyles.optionIconContainer}>
                          <Ionicons
                            name={
                              type.slug.includes('exam') ? 'ribbon-outline' : 'stopwatch-outline'
                            }
                            size={24}
                            color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                          />
                        </View>
                        <View style={currentStyles.optionInfo}>
                          <Text
                            style={[
                              currentStyles.optionTitle,
                              isSelected && currentStyles.optionTitleSelected,
                            ]}
                          >
                            {t(`quiz_types.${type.slug}`, { defaultValue: type.name })}
                          </Text>
                          <Text style={currentStyles.optionSubtitle}>
                            {type.questionCount} {t('quiz_lessons.questions')}
                          </Text>
                        </View>
                        <View style={currentStyles.radioButton}>
                          {isSelected && <View style={currentStyles.radioButtonInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View
                style={[
                  currentStyles.footer,
                  { paddingBottom: Math.max(insets.bottom, spacing.md) },
                ]}
              >
                <AppButton
                  title={t('quiz_lessons.start_quiz')}
                  onPress={handleStart}
                  disabled={!selectedTypeId}
                  size="lg"
                  icon={
                    <Ionicons
                      name={common.isRTL ? 'arrow-back' : 'arrow-forward'}
                      size={20}
                      color="#fff"
                    />
                  }
                  iconPosition="right"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = (
  theme: any,
  common: any,
  typography: any,
  fontWeight: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: '70%',
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    header: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    headerIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryLight || 'rgba(59, 130, 246, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.lg),
    },
    headerTextContainer: {
      flex: 1,
      alignItems: common.alignStart,
    },
    title: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    subtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    sectionTitle: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: common.textAlign,
    },
    optionsContainer: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    optionCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface || '#F9FAFB',
    },
    optionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    optionInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    optionTitle: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    optionTitleSelected: {
      color: theme.colors.primary,
    },
    optionSubtitle: {
      ...typography('caption'),
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.textTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginStart(spacing.md),
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    infoBox: {
      flexDirection: common.rowDirection,
      backgroundColor: theme.colors.infoLight || '#E0F2FE',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      ...typography('caption'),
      fontSize: 12,
      color: theme.colors.info || '#0284C7',
      ...common.marginStart(spacing.sm),
      textAlign: common.textAlign,
    },
    footer: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    startButton: {
      flexDirection: common.rowDirection,
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: borderRadius.xl,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    startButtonDisabled: {
      backgroundColor: theme.colors.textTertiary,
      shadowOpacity: 0,
    },
    startButtonText: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: '#fff',
    },
  });

export default QuizSettingsModal;
