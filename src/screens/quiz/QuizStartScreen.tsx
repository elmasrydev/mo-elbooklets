import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';

interface QuizStartScreenProps {
  subjectName: string;
  lessonsCount: number;
  quizTypeName?: string;
  onStart: () => void;
  onBack: () => void;
}

const QuizStartScreen: React.FC<QuizStartScreenProps> = ({
  subjectName,
  lessonsCount,
  quizTypeName,
  onStart,
  onBack,
}) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const currentStyles = styles(theme, common, typography, spacing, borderRadius);

  return (
    <View style={common.container}>
      <View style={common.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Ionicons
            name={common.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <View style={common.headerTextWrapper}>
          <Text style={common.headerTitle}> {t('quiz_start.header_title')} </Text>
        </View>
      </View>

      <View style={currentStyles.content}>
        {/* Illustration / Icon */}
        <View style={currentStyles.illustrationContainer}>
          <View style={currentStyles.illustrationCircle}>
            <Ionicons name="rocket" size={64} color={theme.colors.primary} />
          </View>
        </View>

        <Text style={currentStyles.readyTitle}> {t('quiz_start.ready_to_go')} </Text>
        <Text style={currentStyles.goodLuckText}> {t('quiz_start.good_luck')} </Text>

        {/* Quiz Info Cards */}
        <View style={currentStyles.infoCards}>
          <View style={currentStyles.infoCard}>
            <View style={currentStyles.infoCardIcon}>
              <Ionicons name="book-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={currentStyles.infoCardContent}>
              <Text style={currentStyles.infoLabel}> {t('quiz_start.subject')} </Text>
              <Text style={currentStyles.infoValue}> {subjectName} </Text>
            </View>
          </View>

          <View style={currentStyles.infoCard}>
            <View style={currentStyles.infoCardIcon}>
              <Ionicons name="documents-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={currentStyles.infoCardContent}>
              <Text style={currentStyles.infoLabel}> {t('quiz_start.lessons_selected')} </Text>
              <Text style={currentStyles.infoValue}>
                {lessonsCount}{' '}
                {lessonsCount === 1 ? t('study_chapters.lessons') : t('study_chapters.lessons')}
              </Text>
            </View>
          </View>

          {quizTypeName && (
            <View style={currentStyles.infoCard}>
              <View style={currentStyles.infoCardIcon}>
                <Ionicons name="options-outline" size={22} color={theme.colors.primary} />
              </View>
              <View style={currentStyles.infoCardContent}>
                <Text style={currentStyles.infoLabel}> {t('quiz_start.quiz_type')} </Text>
                <Text style={currentStyles.infoValue}> {quizTypeName} </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={currentStyles.footer}>
        <TouchableOpacity style={currentStyles.backBtn} onPress={onBack}>
          <Ionicons
            name={common.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={18}
            color={theme.colors.text}
            style={{ marginRight: common.isRTL ? 0 : 6, marginLeft: common.isRTL ? 6 : 0 }}
          />
          <Text style={currentStyles.backBtnText}> {t('quiz_start.go_back')} </Text>
        </TouchableOpacity>

        <TouchableOpacity style={currentStyles.startButton} onPress={onStart} activeOpacity={0.85}>
          <Ionicons
            name="flash"
            size={22}
            color="#FFFFFF"
            style={{ marginRight: common.isRTL ? 0 : 8, marginLeft: common.isRTL ? 8 : 0 }}
          />
          <Text style={currentStyles.startButtonText}> {t('quiz_start.start_quiz')} </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = (theme: any, common: any, typography: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    backButton: {
      padding: 4,
      marginRight: common.isRTL ? 0 : 16,
      marginLeft: common.isRTL ? 16 : 0,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingBottom: 80,
    },
    illustrationContainer: {
      marginBottom: spacing['2xl'],
    },
    illustrationCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: theme.colors.primaryLight || 'rgba(99, 102, 241, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    readyTitle: {
      ...typography('h1'),
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    goodLuckText: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      marginBottom: spacing['2xl'],
      textAlign: 'center',
    },
    infoCards: {
      width: '100%',
      gap: spacing.md,
    },
    infoCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    infoCardIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.primaryLight || 'rgba(99, 102, 241, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.lg),
    },
    infoCardContent: {
      flex: 1,
      alignItems: common.alignStart,
    },
    infoLabel: {
      ...typography('caption'),
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    infoValue: {
      ...typography('body'),
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    footer: {
      flexDirection: common.rowDirection,
      padding: spacing.xl,
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    backBtn: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12, // Reduced from 16
      borderRadius: borderRadius.md, // changed from xl to md
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    backBtnText: {
      ...typography('buttonSmall'), // Changed from base to sm
      color: theme.colors.text,
    },
    startButton: {
      flex: 2,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12, // Reduced from 16
      borderRadius: borderRadius.md, // changed from xl to md
      backgroundColor: '#6366F1',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 2 }, // Reduced shadow
      shadowOpacity: 0.2, // Reduced opacity
      shadowRadius: 4, // Reduced radius
      elevation: 2, // Reduced elevation
    },
    startButtonText: {
      ...typography('buttonSmall'), // Changed from base to sm
      color: '#FFFFFF',
    },
  });

export default QuizStartScreen;
