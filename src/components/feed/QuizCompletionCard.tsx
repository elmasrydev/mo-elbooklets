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

const ConfettiPiece: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const randomY = -Math.random() * 150 - 50;
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: randomY,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: randomX,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(rotate, {
            toValue: Math.random() * 360,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(1000),
            Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { scale },
            {
              rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
            },
          ],
          opacity,
        },
      ]}
    />
  );
};

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
  const color = getScoreColor(scorePercent);
  const xpEarned = Math.round(scorePercent * 1.2);
  const isPerfect = scorePercent >= 95;
  const confettiColors = [
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#ff9ff3',
    '#feca57',
    '#5f27cd',
  ];

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
  );

  return (
    <View
      style={[
        common.card,
        isPerfect && currentStyles.cardPerfect,
        { marginBottom: spacing.sectionGap },
      ]}
    >
      {isPerfect && (
        <View style={currentStyles.confettiContainer}>
          {confettiColors.map((color, index) =>
            Array.from({ length: 8 }).map((_, i) => (
              <ConfettiPiece key={`${index}-${i}`} delay={Math.random() * 1000} color={color} />
            )),
          )}
        </View>
      )}

      <View style={currentStyles.contentRow}>
        <View style={currentStyles.progressContainer}>
          <CircularProgress size={80} strokeWidth={8} percentage={scorePercent} color={color} />
        </View>
        <View style={currentStyles.mainContent}>
          <View style={currentStyles.header}>
            <View style={currentStyles.headerLeft}>
              <View style={currentStyles.avatar}>
                <Text style={currentStyles.avatarText}> {getInitials(item.user.name)} </Text>
              </View>
              <View style={currentStyles.userInfo}>
                <View style={currentStyles.nameRow}>
                  <Text style={currentStyles.userName}> {item.user.name} </Text>
                  {isPerfect && <Text style={currentStyles.fireEmoji}>🔥</Text>}
                </View>
                <Text style={currentStyles.timeAgo}>
                  {' '}
                  {getTimeAgo(item.createdAt, t, language)}{' '}
                </Text>
              </View>
            </View>
            <View style={currentStyles.xpBadge}>
              <Text style={currentStyles.xpValue}> +{xpEarned} </Text>
              <Text style={currentStyles.xpLabel}> XP </Text>
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

          <View style={currentStyles.actionsRow}>
            <View style={currentStyles.actionsLeft}>
              <TouchableOpacity style={currentStyles.actionButton} onPress={onLike}>
                <Ionicons
                  name={item.isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={item.isLiked ? '#EF4444' : theme.colors.textSecondary}
                />
                <Text
                  style={[currentStyles.actionText, item.isLiked && currentStyles.actionTextLiked]}
                >
                  {item.likes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.actionButton} onPress={onComment}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={currentStyles.actionText}> {item.comments} </Text>
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.actionButton}>
                <Ionicons name="share-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {isCurrentUser && onReview && (
              <TouchableOpacity style={currentStyles.reviewButton} onPress={onReview}>
                <Text style={currentStyles.reviewButtonText}> {t('home_screen.review')} </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {isPerfect && (
        <View style={currentStyles.celebrationRow}>
          <Text style={currentStyles.celebrationEmoji}>🎉</Text>
        </View>
      )}
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
) =>
  StyleSheet.create({
    cardPerfect: { borderStyle: 'dashed', borderColor: theme.colors.primary, borderWidth: 2 },
    confettiContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 40,
    },
    contentRow: { flexDirection: common.rowDirection, gap: 16 },
    progressContainer: { alignItems: 'center', justifyContent: 'center' },
    mainContent: { flex: 1 },
    header: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    headerLeft: { flexDirection: common.rowDirection, alignItems: 'center', gap: 12, flex: 1 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    avatarText: {
      ...typography('caption'),
      ...fontWeight('900'),
      color: theme.colors.textSecondary,
    },
    userInfo: { gap: 2, alignItems: common.alignStart, flex: 1 },
    nameRow: { flexDirection: common.rowDirection, alignItems: 'center', gap: 6 },
    userName: { ...typography('label'), ...fontWeight('900'), color: theme.colors.text },
    fireEmoji: { fontSize: 16 },
    timeAgo: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('700'),
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    xpBadge: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      minWidth: 60,
      ...common.marginStart(8),
    },
    xpValue: { ...typography('body'), ...fontWeight('900'), color: theme.colors.primary },
    xpLabel: {
      ...typography('caption'),
      fontSize: 8,
      ...fontWeight('900'),
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    title: {
      ...typography('h3'),
      ...fontWeight('600'),
      color: theme.colors.text,
      marginBottom: spacing.sm,
      lineHeight: 24,
    },
    description: {
      ...typography('caption'),
      ...fontWeight('500'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    actionsRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.md,
    },
    actionsLeft: { flexDirection: common.rowDirection, gap: 16 },
    actionButton: { flexDirection: common.rowDirection, alignItems: 'center', gap: 6 },
    actionText: {
      ...typography('caption'),
      fontSize: 12,
      ...fontWeight('900'),
      color: theme.colors.textSecondary,
    },
    actionTextLiked: { color: '#EF4444' },
    reviewButton: {
      backgroundColor: `${theme.colors.primary}15`,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    reviewButtonText: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('900'),
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    celebrationRow: { alignItems: 'center', marginTop: spacing.md },
    celebrationEmoji: { fontSize: 32 },
  });

const styles = StyleSheet.create({
  confettiPiece: { position: 'absolute', width: 8, height: 8, borderRadius: 2 },
});

export default React.memo(QuizCompletionCard);
