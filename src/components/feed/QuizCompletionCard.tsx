import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import { getTimeAgo } from '../../lib/dateUtils';
import { getSubjectConfig } from '../../utils/subjectTheme';
import SubjectIcon from '../SubjectIcon';
import Avatar from '../Avatar';

interface QuizCompletionCardProps {
  item: {
    id: string;
    user: {
      id: string;
      name: string;
      grade: { id: string; name: string };
      selectedAvatar?: { url?: string } | null;
    };
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

const QuizCompletionCard: React.FC<QuizCompletionCardProps> = ({ item, onLike }) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const { totalQuestions, isPassed, quiz } = item.quizData;
  const subjectName = quiz.subject.name;

  // Calculate percentage (guard against a zero-question quiz -> NaN%)
  const scorePercent = totalQuestions
    ? Math.round((item.quizData.score / totalQuestions) * 100)
    : 0;

  const subConfig = getSubjectConfig(subjectName, theme);

  const accentColor = isPassed ? theme.colors.success : theme.colors.error;
  const s = createStyles(theme, common, spacing, borderRadius, typography, fontWeight);

  return (
    <View style={s.card}>
      {/* Header: avatar + name + grade · time */}
      <View style={s.headerRow}>
        <Avatar
          uri={item.user.selectedAvatar?.url}
          name={item.user.name}
          size={42}
          fontScale={0.36}
        />
        <View style={s.userInfo}>
          <Text numberOfLines={1} style={s.userName}>
            {item.user.name}
          </Text>
          <Text numberOfLines={1} style={s.userSubtitle}>
            {item.user.grade.name} · {getTimeAgo(item.createdAt, t, language)}
          </Text>
        </View>
      </View>

      {/* Subject row + pass/fail pill */}
      <View style={s.subjectRow}>
        <View style={s.subjectLeft}>
          <SubjectIcon
            subjectName={subjectName}
            size={30}
            style={{ backgroundColor: subConfig.bg }}
          />
          <Text numberOfLines={1} style={s.subjectName}>
            {subjectName}
          </Text>
        </View>
        <View style={[s.pill, { backgroundColor: accentColor + '14' }]}>
          <Ionicons
            name={isPassed ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={accentColor}
          />
          <Text style={[s.pillText, { color: accentColor }]}>
            {isPassed
              ? t('social_screen.passed', { defaultValue: 'Passed' })
              : t('social_screen.failed', { defaultValue: 'Failed' })}
          </Text>
        </View>
      </View>

      {/* Stat chips: questions + accuracy */}
      <View style={s.statsRow}>
        <View style={[s.chip, s.chipNeutral]}>
          <Ionicons name="list-outline" size={15} color={theme.colors.textSecondary} />
          <Text numberOfLines={1} style={[s.chipText, { color: theme.colors.textSecondary }]}>
            {t('social_screen.questions_count', {
              count: totalQuestions,
              defaultValue: `${totalQuestions} Questions`,
            })}
          </Text>
        </View>
        <View style={[s.chip, { backgroundColor: accentColor + '14' }]}>
          <Ionicons name="star" size={15} color={accentColor} />
          <Text numberOfLines={1} style={[s.chipText, { color: accentColor }]}>
            {t('social_screen.accuracy', {
              percent: scorePercent,
              defaultValue: `${scorePercent}% Accuracy`,
            })}
          </Text>
        </View>
      </View>

      {/* Footer: likes count + like button */}
      <View style={s.footerRow}>
        {item.likes > 0 ? (
          <View style={s.likesCount}>
            <Ionicons name="thumbs-up" size={16} color={theme.colors.primary} />
            <Text style={s.likesCountText}>{item.likes}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[s.likeBtn, item.isLiked && s.likeBtnActive]}
          onPress={onLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={16}
            color={item.isLiked ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text style={[s.likeBtnText, item.isLiked && s.likeBtnTextActive]}>
            {item.isLiked
              ? t('common.liked', { defaultValue: 'Liked' })
              : t('common.like', { defaultValue: 'Like' })}
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
) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius['2xl'],
      marginBottom: spacing.ssm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    headerRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
      marginBottom: spacing.ssm,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary100,
    },
    avatarText: {
      ...typography('caption'),
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
      ...typography('label'),
      color: theme.colors.textTertiary,
      textAlign: common.textAlign,
    },
    subjectRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    subjectLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 9,
      flexShrink: 1,
    },
    subjectName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      flexShrink: 1,
      textAlign: common.textAlign,
    },
    pill: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
    },
    pillText: {
      ...typography('label'),
      ...fontWeight('bold'),
    },
    statsRow: {
      flexDirection: common.rowDirection,
      gap: 8,
      marginTop: spacing.ssm,
    },
    chip: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: borderRadius.md,
    },
    chipNeutral: {
      backgroundColor: theme.colors.background,
    },
    chipText: {
      ...typography('caption'),
      ...fontWeight('bold'),
    },
    footerRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: spacing.md,
      paddingTop: spacing.ssm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    likesCount: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 5,
      marginEnd: 'auto',
    },
    likesCountText: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textTertiary,
    },
    likeBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.background,
    },
    likeBtnActive: {
      backgroundColor: theme.colors.primary100,
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
