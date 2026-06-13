import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import { getSubjectConfig } from '../../utils/subjectTheme';
import SubjectIcon from '../SubjectIcon';

interface QuizCompletionCardProps {
  item: {
    id: string;
    user: { id: string; name: string; grade: { id: string; name: string } };
    createdAt: string;
    quizData: {
      quizUserId: string;
      quiz: { id: string; name: string; subject: { id: string; name: string }; type: string };
      score: number;
      totalQuestions: number;
      isPassed: boolean;
    };
    likes: number;
    comments: number;
    isLiked: boolean;
  };
  onLike: () => void;
  onComment?: () => void;
  onReview?: () => void;
  isCurrentUser?: boolean;
}

const QuizCompletionCard: React.FC<QuizCompletionCardProps> = ({
  item,
  onLike,
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const { totalQuestions, isPassed, quiz } = item.quizData;
  const subjectName = quiz.subject.name;

  // Calculate percentage (guard against a zero-question quiz -> NaN%)
  const scorePercent = totalQuestions
    ? Math.round((item.quizData.score / totalQuestions) * 100)
    : 0;

  // Get subject theme config (only used for subject badge and book icon)
  const subConfig = getSubjectConfig(subjectName, theme);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  const currentStyles = createStyles(
    theme,
    common,
    spacing,
    borderRadius,
    typography,
    fontWeight,
    subConfig.color,
  );

  return (
    <View style={currentStyles.cardContainer}>
      {/* Top Header: Avatar + User Info */}
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.headerLeft}>
          <View style={currentStyles.avatar}>
            <Text style={currentStyles.avatarText}>
              {getInitials(item.user.name)}
            </Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text numberOfLines={1} style={currentStyles.userName}>
              {item.user.name}
            </Text>
            <Text numberOfLines={1} style={currentStyles.userSubtitle}>
              {item.user.grade.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Subject Icon and Subject Name */}
      <View style={currentStyles.quizNameContainer}>
        <SubjectIcon
          subjectName={subjectName}
          size={32}
          style={{ backgroundColor: subConfig.bg }}
        />
        <Text style={currentStyles.quizName}>
          {subjectName}
        </Text>
      </View>

      {/* Metadata Capsule Badges Section */}
      <View style={currentStyles.metadataContainer}>
        {/* Top Row: Questions & Accuracy (50% width each) */}
        <View style={currentStyles.statsRow}>
          <View style={[currentStyles.capsule, currentStyles.flexCapsule, currentStyles.questionsCapsule]}>
            <Ionicons name="list-outline" size={14} color={theme.colors.primary} />
            <Text numberOfLines={1} style={[currentStyles.capsuleText, { color: theme.colors.primary }]}>
              {t('social_screen.questions_count', { count: totalQuestions, defaultValue: `${totalQuestions} Questions` })}
            </Text>
          </View>

          <View 
            style={[
              currentStyles.capsule, 
              currentStyles.flexCapsule,
              isPassed ? currentStyles.passedCapsule : currentStyles.failedCapsule
            ]}
          >
            <Ionicons 
              name="star-outline" 
              size={14} 
              color={isPassed ? theme.colors.success : theme.colors.error} 
            />
            <Text numberOfLines={1} style={[currentStyles.capsuleText, { color: isPassed ? theme.colors.success : theme.colors.error }]}>
              {t('social_screen.accuracy', { percent: scorePercent, defaultValue: `${scorePercent}% Accuracy` })}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Passed/Failed Status (Centered) */}
        <View style={currentStyles.statusCenteredRow}>
          <View 
            style={[
              currentStyles.capsule, 
              isPassed ? currentStyles.passedCapsule : currentStyles.failedCapsule
            ]}
          >
            <Ionicons 
              name={isPassed ? 'checkmark-circle-outline' : 'close-circle-outline'} 
              size={14} 
              color={isPassed ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[currentStyles.capsuleText, { color: isPassed ? theme.colors.success : theme.colors.error }]}>
              {isPassed 
                ? t('social_screen.passed', { defaultValue: 'Passed' }) 
                : t('social_screen.failed', { defaultValue: 'Failed' })}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Actions: Likes Badge + Like Button */}
      <View style={currentStyles.footerRow}>
        {/* Likes Count Pill Badge */}
        {item.likes > 0 ? (
          <View style={currentStyles.likesBadge}>
            <Ionicons name="thumbs-up" size={14} color={theme.colors.primary} />
            <Text style={currentStyles.likesBadgeText}>
              {item.likes}
            </Text>
          </View>
        ) : (
          <View style={currentStyles.likesBadgeEmpty} />
        )}

        {/* Action Button (Like) */}
        <TouchableOpacity 
          style={[
            currentStyles.likeBtn, 
            item.isLiked && currentStyles.likeBtnActive
          ]} 
          onPress={onLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={16}
            color={item.isLiked ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              currentStyles.likeBtnText, 
              item.isLiked && currentStyles.likeBtnTextActive
            ]}
          >
            {t('common.like', { defaultValue: 'Like' })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (
  theme: any,
  common: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  fontWeight: any,
  subjectColor: string,
) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.ssm,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap || spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    headerRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.primary}10`,
      borderWidth: 1.5,
      borderColor: `${theme.colors.primary}25`,
    },
    avatarText: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    userInfo: {
      flex: 1,
      alignItems: common.alignStart,
      gap: 2,
    },
    userName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    userSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    quizNameContainer: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      gap: 12,
    },
    quizName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      flex: 1,
      textAlign: common.textAlign,
      lineHeight: 22,
    },
    metadataContainer: {
      marginBottom: spacing.ssm,
      gap: 8,
    },
    statsRow: {
      flexDirection: common.rowDirection,
      gap: 8,
      alignItems: 'center',
    },
    statusCenteredRow: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    capsule: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: borderRadius.lg || 12,
      borderWidth: 1,
      gap: 6,
    },
    flexCapsule: {
      flex: 1,
      justifyContent: 'center',
    },
    questionsCapsule: {
      backgroundColor: theme.mode === 'light' ? '#eff6ff' : `${theme.colors.primary}15`,
      borderColor: theme.mode === 'light' ? '#dbeafe' : `${theme.colors.primary}30`,
    },
    passedCapsule: {
      backgroundColor: `${theme.colors.success}10`,
      borderColor: `${theme.colors.success}25`,
    },
    failedCapsule: {
      backgroundColor: `${theme.colors.error}10`,
      borderColor: `${theme.colors.error}25`,
    },
    capsuleText: {
      ...typography('caption'),
      ...fontWeight('600'),
    },
    footerRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.mode === 'light' ? '#e2e8f0' : `${theme.colors.border}40`,
    },
    likesBadge: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 5,
    },
    likesBadgeText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
    },
    likesBadgeEmpty: {
      height: 28,
    },
    likeBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md || 8,
      borderWidth: 1,
      borderColor: theme.mode === 'light' ? '#e2e8f0' : `${theme.colors.border}40`,
      backgroundColor: 'transparent',
    },
    likeBtnActive: {
      borderColor: theme.mode === 'light' ? '#dbeafe' : `${theme.colors.primary}30`,
      backgroundColor: theme.mode === 'light' ? '#f0f9ff' : `${theme.colors.primary}10`,
    },
    likeBtnText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    likeBtnTextActive: {
      color: theme.colors.primary,
    },
  });

export default React.memo(QuizCompletionCard);
