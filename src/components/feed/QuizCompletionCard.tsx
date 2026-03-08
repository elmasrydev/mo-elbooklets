import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import CircularProgress from '../CircularProgress';
import { getScoreColor } from '../../lib/scoreUtils';
import { getTimeAgo } from '../../lib/dateUtils';

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
  onComment: () => void;
  onReview?: () => void;
  isCurrentUser?: boolean;
}

const CONFETTI_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#ff9ff3',
  '#feca57',
  '#5f27cd',
];
const CONFETTI_PIECES = CONFETTI_COLORS.flatMap((color, ci) =>
  [0, 1].map((i) => ({
    key: `${ci}-${i}`,
    color,
    delay: ci * 100 + i * 180,
    offsetX: -130 + ci * 33 + i * 16,
    endY: -(50 + (ci % 4) * 30 + i * 40),
  })),
);

const ConfettiPiece = React.memo<{
  delay: number;
  color: string;
  offsetX: number;
  endY: number;
}>(({ delay, color, offsetX, endY }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setTimeout(run, delay);
      });
    };
    const initialTimeout = setTimeout(run, delay);
    return () => clearTimeout(initialTimeout);
  }, []);

  const driftX = offsetX * 0.4;
  const rotateDeg = `${(offsetX + 100) * 4}deg`;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          opacity: anim.interpolate({
            inputRange: [0, 0.05, 0.6, 1],
            outputRange: [0, 1, 0.8, 0],
          }),
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, offsetX + driftX],
              }),
            },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, endY] }) },
            {
              scale: anim.interpolate({
                inputRange: [0, 0.05, 0.7, 1],
                outputRange: [0, 1, 0.8, 0],
              }),
            },
            { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rotateDeg] }) },
          ],
        },
      ]}
    />
  );
});

const QuizCompletionCard: React.FC<QuizCompletionCardProps> = ({
  item,
  onLike,
  onComment,
  onReview,
  isCurrentUser = false,
}) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const scorePercent = Math.round((item.quizData.score / item.quizData.totalQuestions) * 100);
  const scoreColor = getScoreColor(scorePercent);
  const xpEarned = Math.round(scorePercent * 1.2);
  const isPerfect = scorePercent >= 95;

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
    fontSizes,
    spacing,
    borderRadius,
    typography,
    fontWeight,
    scoreColor,
  );

  return (
    <View style={[common.card, isPerfect && currentStyles.cardPerfect, { marginBottom: spacing.sectionGap }]}>
      {isPerfect && (
        <View style={currentStyles.confettiContainer}>
          {CONFETTI_PIECES.map((p) => (
            <ConfettiPiece key={p.key} delay={p.delay} color={p.color} offsetX={p.offsetX} endY={p.endY} />
          ))}
        </View>
      )}

      <View style={currentStyles.contentRow}>
        <View style={currentStyles.leftSection}>
          <CircularProgress size={74} strokeWidth={7} percentage={scorePercent} color={scoreColor} />
          {isPerfect && (
            <View style={currentStyles.perfectBadge}>
              <Ionicons name="star" size={14} color="#fff" />
            </View>
          )}
        </View>

        <View style={currentStyles.rightSection}>
          <View style={currentStyles.header}>
            <View style={currentStyles.headerLeft}>
              <View style={currentStyles.avatar}>
                <Text style={currentStyles.avatarText}>{getInitials(item.user.name)}</Text>
              </View>
              <View style={currentStyles.userInfo}>
                <View style={currentStyles.nameRow}>
                  <Text style={currentStyles.userName}>{item.user.name}</Text>
                  {isPerfect && <Text style={currentStyles.fireEmoji}>🔥</Text>}
                </View>
                <Text style={currentStyles.timeAgo}>{getTimeAgo(item.createdAt, t, language)}</Text>
              </View>
            </View>
            <View style={currentStyles.xpBadge}>
              <Text style={currentStyles.xpValue}>+{xpEarned}</Text>
              <Text style={currentStyles.xpLabel}>XP</Text>
            </View>
          </View>

          <Text style={[currentStyles.title, { textAlign: common.textAlign }]}>
            {t('social_screen.aced_quiz', { subject: item.quizData.quiz.subject.name })}
          </Text>
          <Text style={[currentStyles.description, { textAlign: common.textAlign }]}>
            {t('social_screen.quiz_description', {
              user: item.user.name,
              subject: item.quizData.quiz.subject.name,
              percent: scorePercent,
            })}
          </Text>

          <View style={currentStyles.footerActions}>
            <View style={currentStyles.socialStats}>
              <TouchableOpacity style={currentStyles.statBtn} onPress={onLike}>
                <Ionicons
                  name={item.isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={item.isLiked ? theme.colors.error : theme.colors.textSecondary}
                />
                <Text style={[currentStyles.statText, item.isLiked && { color: theme.colors.error }]}>
                  {item.likes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.statBtn} onPress={onComment}>
                <Ionicons name="chatbubble-outline" size={19} color={theme.colors.textSecondary} />
                <Text style={currentStyles.statText}>{item.comments}</Text>
              </TouchableOpacity>
            </View>

            {isCurrentUser && onReview && (
              <TouchableOpacity style={currentStyles.reviewBtn} onPress={onReview}>
                <Text style={currentStyles.reviewBtnText}>{t('home_screen.review')}</Text>
                <Ionicons name="chevron-forward" size={12} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  fontWeight: any,
  scoreColor: string,
) =>
  StyleSheet.create({
    cardPerfect: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    confettiContainer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    },
    contentRow: {
      flexDirection: common.rowDirection,
      gap: 16,
    },
    leftSection: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 4,
    },
    perfectBadge: {
      position: 'absolute',
      bottom: -6,
      backgroundColor: theme.colors.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    rightSection: {
      flex: 1,
    },
    header: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.mode === 'light' ? theme.colors.background : theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    avatarText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    userInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    nameRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
    },
    userName: {
      ...typography('caption'),
      ...fontWeight('900'),
      color: theme.colors.text,
    },
    fireEmoji: {
      fontSize: 14,
    },
    timeAgo: {
      ...typography('caption'),
      fontSize: 10,
      color: theme.colors.textTertiary,
      marginTop: 1,
    },
    xpBadge: {
      backgroundColor: theme.mode === 'light' ? `${theme.colors.primary}10` : `${theme.colors.primary}20`,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 3,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    xpValue: {
      ...typography('caption'),
      ...fontWeight('900'),
      color: theme.colors.primary,
    },
    xpLabel: {
      ...typography('caption'),
      fontSize: 8,
      ...fontWeight('900'),
      color: theme.colors.primary,
      opacity: 0.8,
    },
    title: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: 6,
    },
    description: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      lineHeight: 18,
      marginBottom: 16,
    },
    footerActions: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    socialStats: {
      flexDirection: common.rowDirection,
      gap: 16,
    },
    statBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    reviewBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${theme.colors.primary}10`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    reviewBtnText: {
      ...typography('caption'),
      ...fontWeight('900'),
      color: theme.colors.primary,
      fontSize: 11,
    },
  });

const styles = StyleSheet.create({
  confettiPiece: { position: 'absolute', width: 8, height: 8, borderRadius: 2 },
});

export default React.memo(QuizCompletionCard);
