import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#ff9ff3', '#feca57', '#5f27cd'];
const CONFETTI_PIECES = CONFETTI_COLORS.flatMap((color, ci) =>
  [0, 1, 2].map((i) => {
    const index = ci * 3 + i;
    const angle = (Math.PI * 2 * index) / 24;
    const distance = 45 + (index % 3) * 20;
    return {
      key: `${ci}-${i}`,
      color,
      delay: (index % 5) * 80,
      endX: Math.cos(angle) * distance,
      endY: Math.sin(angle) * distance,
      rotateDeg: `${180 + index * 45}deg`,
    };
  }),
);

const ConfettiPiece = React.memo<{ delay: number; color: string; endX: number; endY: number; rotateDeg: string }>(
  ({ delay, color, endX, endY, rotateDeg }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const run = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          setTimeout(run, delay + 500);
        });
      };
      const initialTimeout = setTimeout(run, delay);
      return () => clearTimeout(initialTimeout);
    }, []);

    const driftY = 20; // visual gravity over time

    return (
      <Animated.View
        style={[
          styles.confettiPiece,
          {
            backgroundColor: color,
            opacity: anim.interpolate({
              inputRange: [0, 0.1, 0.7, 1],
              outputRange: [0, 1, 0.9, 0],
            }),
            transform: [
              { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, endX] }) },
              { translateY: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, endY, endY + driftY] }) },
              { scale: anim.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0.2] }) },
              { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rotateDeg] }) },
            ],
          },
        ]}
      />
    );
  }
);

const QuizCompletionCard: React.FC<QuizCompletionCardProps> = ({ item, onLike, onComment, onReview, isCurrentUser = false }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const scorePercent = Math.round((item.quizData.score / item.quizData.totalQuestions) * 100);
  const isPerfect = scorePercent >= 95 || item.quizData.score === item.quizData.totalQuestions;
  
  // Theme colors based on perfect score or regular
  const primaryColor = isPerfect ? theme.colors.success : theme.colors.primary;
  const primaryBg = isPerfect ? `${theme.colors.success}10` : `${theme.colors.primary}10`;
  const primaryBorder = isPerfect ? `${theme.colors.success}20` : `${theme.colors.border}`;

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  const currentStyles = createStyles(theme, common, spacing, borderRadius, typography, fontWeight, primaryColor, primaryBg, primaryBorder);

  return (
    <View style={[currentStyles.cardContainer, isPerfect && currentStyles.perfectCardContainer]}>
      {/* Decorative Sparkles Effect */}
      {isPerfect && (
        <View style={currentStyles.sparklesIcon} pointerEvents="none">
          <MaterialIcons name="auto-awesome" size={32} color={theme.colors.border} />
        </View>
      )}

      {/* Top Header: Avatar + User Info + Score Progress */}
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.headerLeft}>
          <View style={[currentStyles.avatar, { borderColor: primaryBorder, backgroundColor: primaryBg }]}>
            <Text style={[currentStyles.avatarText, { color: primaryColor }]}>{getInitials(item.user.name)}</Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text style={[currentStyles.userName, { textAlign: common.textAlign }]}>{item.user.name}</Text>
            <Text style={[currentStyles.userSubtitle, { textAlign: common.textAlign }]}>
              {item.user.grade.name} • {getTimeAgo(item.createdAt, t, language)}
            </Text>
          </View>
        </View>
        
        <View style={currentStyles.progressContainer}>
          <CircularProgress size={56} strokeWidth={4} percentage={scorePercent} color={primaryColor} />
          {isPerfect && (
            <>
              <View style={currentStyles.confettiWrapper} pointerEvents="none">
                {CONFETTI_PIECES.map((p) => (
                  <ConfettiPiece key={p.key} delay={p.delay} color={p.color} endX={p.endX} endY={p.endY} rotateDeg={p.rotateDeg} />
                ))}
              </View>
              <View style={currentStyles.starBadge}>
                <MaterialIcons name="grade" size={14} color="#fff" />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Content Area */}
      <View style={currentStyles.contentArea}>
        {isPerfect ? (
          <>
            <Text style={[currentStyles.perfectTitle, { textAlign: common.textAlign }]}>
              {`${item.user.name.split(' ')[0]} ${t('social_screen.aced_quiz', { subject: item.quizData.quiz.subject.name, defaultValue: 'Aced the quiz!' })} ✨`}
            </Text>
            <View style={currentStyles.perfectInnerCard}>
              <MaterialIcons name="military-tech" size={24} color={theme.colors.success} style={currentStyles.perfectIcon} />
              <View style={currentStyles.perfectInnerContent}>
                <Text style={currentStyles.perfectInnerTitle}>{t('social_screen.perfect_score', 'Perfect Score! 🎯')}</Text>
                <Text style={currentStyles.perfectInnerSubtitle}>
                  {item.quizData.score}/{item.quizData.totalQuestions} {t('social_screen.questions_correct_in', 'Questions Correct in')} {item.quizData.quiz.subject.name}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={[currentStyles.regularText, { textAlign: common.textAlign }]}>
            {t('social_screen.scored_prefix', 'Scored ')} 
            <Text style={[currentStyles.highlightText, { color: theme.colors.primary }]}>{scorePercent}%</Text> 
            {t('social_screen.on_quiz_prefix', ' on a ')} 
            <Text style={[currentStyles.highlightText, { color: theme.colors.primary, textDecorationLine: 'underline' }]}>
              {item.quizData.quiz.subject.name}{t('social_screen.quiz_suffix', ' Quiz')}
            </Text>
            {'. '}
            {t('social_screen.great_accuracy', 'Great accuracy! 🎯')}
          </Text>
        )}
      </View>

      {/* Footer Actions */}
      <View style={currentStyles.footerActions}>
        <View style={currentStyles.statsRow}>
          <View style={currentStyles.statItem}>
            <MaterialIcons name="thumb-up" size={14} color="#3B82F6" />
            <Text style={currentStyles.statText}>{item.likes}</Text>
          </View>
        </View>

        <View style={currentStyles.actionButtons}>
          <TouchableOpacity style={currentStyles.likeBtn} onPress={onLike}>
            <MaterialIcons name="thumb-up" size={14} color={item.isLiked ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[currentStyles.likeBtnText, item.isLiked && { color: theme.colors.primary }]}>{t('common.like', 'Like')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[currentStyles.cheerBtn, { backgroundColor: isPerfect ? theme.colors.success : theme.colors.primary }]} 
            onPress={onComment}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#fff" />
            <Text style={currentStyles.cheerBtnText}>{t('social_screen.comment', 'Comment')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any, common: any, spacing: any, borderRadius: any, typography: any, fontWeight: any, primaryColor: string, primaryBg: string, primaryBorder: string) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.mode === 'light' ? theme.colors.surface : theme.colors.card,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
      overflow: 'hidden',
    },
    perfectCardContainer: {
      borderWidth: 2,
      borderColor: `${theme.colors.success}30`,
      overflow: 'visible',
      zIndex: 1,
    },
    sparklesIcon: {
      position: 'absolute',
      top: 8,
      right: 8,
      opacity: 0.15,
    },
    headerRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
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
      borderWidth: 1,
    },
    avatarText: {
      ...typography('body'),
      ...fontWeight('bold'),
    },
    userInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    userName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    userSubtitle: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    progressContainer: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    confettiWrapper: {
      position: 'absolute',
      width: 1,
      height: 1,
      top: '50%',
      left: '50%',
      overflow: 'visible',
      zIndex: 10,
      elevation: 10,
    },
    starBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#F59E0B',
      padding: 2,
      borderRadius: 12,
      ...layout.shadow,
    },
    contentArea: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    perfectTitle: {
      ...typography('body'),
      ...fontWeight('900'),
      color: theme.colors.text,
      marginBottom: 8,
    },
    perfectInnerCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
      backgroundColor: `${theme.colors.success}10`,
      borderWidth: 1,
      borderColor: `${theme.colors.success}20`,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    perfectIcon: {
      opacity: 0.9,
    },
    perfectInnerContent: {
      flex: 1,
      alignItems: common.alignStart,
    },
    perfectInnerTitle: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.success,
      textAlign: common.textAlign,
    },
    perfectInnerSubtitle: {
      ...typography('caption'),
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    regularText: {
      ...typography('bodySmall'),
      color: theme.colors.text,
      lineHeight: 20,
    },
    highlightText: {
      ...fontWeight('bold'),
    },
    footerActions: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
    },
    statItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    actionButtons: {
      flexDirection: common.rowDirection,
      gap: 8,
    },
    likeBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    likeBtnText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    cheerBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      ...layout.shadow,
    },
    cheerBtnText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#fff',
    },
  });

const styles = StyleSheet.create({
  confettiPiece: { position: 'absolute', width: 8, height: 8, borderRadius: 2 },
});

export default React.memo(QuizCompletionCard);

