import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { PARENT_HERO_GRADIENT, HAIRLINE_BLUE } from '../config/colors';
import UnifiedHeader from '../components/UnifiedHeader';
import CircularProgress from '../components/CircularProgress';
import {
  useChildDashboard,
  ChildSubjectPerformance,
  ChildRecentActivity,
} from '../hooks/useChildDashboard';
import { subjectStatus, quizPercent, SubjectStatus } from '../utils/childProgress';
import { getSubjectConfig } from '../utils/subjectTheme';
import { getScoreColor } from '../lib/scoreUtils';
import { getTimeAgo } from '../lib/dateUtils';

type ChildDetailsParams = {
  ChildDetailsScreen: { childId: string; childName?: string; gradeName?: string };
};

const ChildDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<ChildDetailsParams, 'ChildDetailsScreen'>>();
  const { theme, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { typography, fontWeight } = useTypography();

  const { childId, childName, gradeName } = route.params ?? { childId: '' };
  const { data, loading, refreshing, error, refetch } = useChildDashboard(childId);

  const styles = useMemo(
    () => createStyles({ theme, spacing, borderRadius, typography, fontWeight }),
    [theme, spacing, borderRadius, typography, fontWeight],
  );

  const displayName = data?.child?.name || childName || '';
  const initial = displayName.trim().charAt(0).toUpperCase();

  const statusMeta = (key: SubjectStatus): { color: string; label: string } => {
    if (key === 'on_track') {
      return { color: theme.colors.success, label: t('child_details.status_on_track') };
    }
    if (key === 'needs_attention') {
      return { color: theme.colors.warning, label: t('child_details.status_needs_attention') };
    }
    return { color: theme.colors.error, label: t('child_details.status_critical') };
  };

  const renderStat = (value: string, label: string, color?: string, last?: boolean) => (
    <View style={[styles.statCell, !last && styles.statCellDivider]}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // Subject = elevated card with a status ring + accent stripe (performance overview).
  const renderSubject = (subject: ChildSubjectPerformance) => {
    const score = Math.round(subject.avg_score ?? 0);
    // Ring / icon / accent follow the app-wide subject palette (like the home screen);
    // performance is conveyed by the status badge + bar fill amount.
    const cfg = getSubjectConfig(subject.subject_name, theme);
    const subjColor = cfg.color;
    const subjIcon = (cfg.icon || 'library-outline') as keyof typeof Ionicons.glyphMap;
    const meta = statusMeta(subjectStatus(score));
    return (
      <View key={subject.subject_name} style={[styles.subjCard, { borderStartColor: subjColor }]}>
        <View style={styles.subjTop}>
          <CircularProgress
            size={40}
            strokeWidth={4}
            percentage={score}
            color={subjColor}
            showText={false}
          >
            <Ionicons name={subjIcon} size={16} color={subjColor} />
          </CircularProgress>
          <View style={styles.subjInfo}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {subject.subject_name}
              </Text>
              <Text style={[styles.scoreBig, { color: subjColor }]}>{score}%</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: meta.color + '1A' }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: subjColor }]} />
        </View>
        <Text style={[styles.metaText, { marginTop: 7 }]}>
          {t('child_details.quizzes_completed', { count: subject.quiz_count })}
        </Text>
      </View>
    );
  };

  // Quiz history = flat bordered log row (deliberately lighter than the subject cards).
  const renderQuizRow = (quiz: ChildRecentActivity, index: number) => {
    // `score` is the correct-answer count; percentage = correct / total.
    const correct = Math.round(quiz.score ?? 0);
    const total = quiz.total_questions ?? 0;
    const pct = quizPercent(correct, total);
    const scoreColor = getScoreColor(pct);
    const cfg = getSubjectConfig(quiz.subject_name, theme);
    const subjColor = cfg.color;
    const subjIcon = (cfg.icon || 'library-outline') as keyof typeof Ionicons.glyphMap;
    const passColor = quiz.is_passed ? theme.colors.success : theme.colors.error;
    return (
      <View key={`${quiz.subject_name}-${index}`} style={styles.quizCard}>
        <View style={[styles.quizIconBox, { backgroundColor: subjColor + '1A' }]}>
          <Ionicons name={subjIcon} size={18} color={subjColor} />
        </View>
        <View style={styles.flex1}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {quiz.subject_name}
            </Text>
            <Text style={[styles.scoreMid, { color: scoreColor }]}>{pct}%</Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 3 }]}>
            <Text style={styles.metaText} numberOfLines={1}>
              {quiz.completed_at ? getTimeAgo(quiz.completed_at, t, language) : ''}
            </Text>
            <View style={[styles.pill, { backgroundColor: passColor + '1A' }]}>
              <Text style={[styles.pillText, { color: passColor }]}>
                {quiz.is_passed ? t('child_details.passed') : t('child_details.failed')}
              </Text>
            </View>
          </View>
          {/* Score bar — width + colour both reflect the score */}
          <View style={styles.quizBottom}>
            <View style={styles.progressTrackSm}>
              <View
                style={[styles.progressFill, { width: `${pct}%`, backgroundColor: scoreColor }]}
              />
            </View>
            <Text style={styles.quizMeta}>
              {t('child_details.correct_count', { correct, total })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const subjects = data?.subject_performance ?? [];
  const activity = data?.recent_activity ?? [];
  const hasActivity = (data?.quizzes_solved ?? 0) > 0 || subjects.length > 0 || activity.length > 0;

  const renderBody = () => {
    if (loading && !data) {
      return <ActivityIndicator style={{ marginTop: 48 }} color={theme.colors.primary} />;
    }
    if (error && !data) {
      return (
        <View testID="child-details-error" style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.textTertiary} />
          <Text style={styles.stateText}>{t('child_details.error_loading')}</Text>
        </View>
      );
    }

    return (
      <>
        {/* Hero: gradient identity + white stat strip */}
        <View style={styles.heroCard} testID="child-details-hero">
          <LinearGradient
            colors={PARENT_HERO_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.avatar}>
              <Text style={styles.heroInitial}>{initial}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.heroName} numberOfLines={1}>
                {displayName}
              </Text>
              {!!gradeName && <Text style={styles.heroSub}>{gradeName}</Text>}
            </View>
          </LinearGradient>
          <View style={styles.statStrip}>
            {renderStat(String(data?.quizzes_solved ?? 0), t('child_details.stat_quizzes'))}
            {renderStat(
              `${Math.round(data?.average_score ?? 0)}%`,
              t('child_details.stat_avg_score'),
              getScoreColor(Math.round(data?.average_score ?? 0)),
            )}
            {renderStat(
              String(data?.started_subjects_count ?? 0),
              t('child_details.stat_subjects'),
              undefined,
              true,
            )}
          </View>
        </View>

        {!hasActivity ? (
          <>
            <View testID="child-details-empty" style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="school-outline" size={36} color={theme.colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>{t('child_details.no_activity_title')}</Text>
              <Text style={styles.stateText}>
                {t('child_details.no_activity_subtitle', { name: displayName })}
              </Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipIconBox}>
                <Ionicons name="bulb" size={18} color={theme.colors.warning} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.tipTitle}>{t('child_details.tip_title')}</Text>
                <Text style={[styles.metaText, { marginTop: 2 }]}>
                  {t('child_details.tip_body', { name: displayName })}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {subjects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('child_details.subjects')}</Text>
                {subjects.map(renderSubject)}
              </View>
            )}

            {activity.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('child_details.quiz_history')}</Text>
                {activity.map(renderQuizRow)}
              </View>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <UnifiedHeader title={displayName || t('parent_dashboard.my_children')} showBackButton />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderBody()}
      </ScrollView>
    </View>
  );
};

const createStyles = (config: any) => {
  const { theme, borderRadius, typography, fontWeight } = config;
  const muted = theme.colors.textTertiary;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 32 },

    // Shared text
    cardTitle: {
      ...typography('caption'),
      ...fontWeight('700'),
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      textAlign: 'left',
    },
    scoreBig: { ...typography('caption'), ...fontWeight('bold'), fontSize: 16 },
    scoreMid: { ...typography('caption'), ...fontWeight('bold'), fontSize: 14 },
    badgeText: { ...typography('label'), ...fontWeight('700'), fontSize: 10.5 },
    pillText: { ...typography('label'), ...fontWeight('700'), fontSize: 10 },
    metaText: { ...typography('label'), fontSize: 11, color: muted, textAlign: 'left' },

    // Hero
    heroCard: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      marginBottom: 20,
      ...layout.shadow,
    },
    heroGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: 12,
    },
    heroInitial: { ...typography('body'), ...fontWeight('bold'), fontSize: 18, color: '#FFFFFF' },
    heroName: {
      ...typography('caption'),
      ...fontWeight('bold'),
      fontSize: 16,
      color: '#FFFFFF',
      textAlign: 'left',
    },
    heroSub: {
      ...typography('label'),
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'left',
      marginTop: 1,
    },

    statStrip: { flexDirection: 'row', backgroundColor: theme.colors.card },
    statCell: { flex: 1, alignItems: 'center', paddingVertical: 11 },
    statCellDivider: { borderEndWidth: 1, borderEndColor: HAIRLINE_BLUE },
    statValue: {
      ...typography('caption'),
      ...fontWeight('bold'),
      fontSize: 17,
      color: theme.colors.text,
    },
    statLabel: {
      ...typography('label'),
      fontSize: 9.5,
      color: muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 2,
    },

    // Sections
    section: { marginBottom: 18 },
    sectionTitle: {
      ...typography('label'),
      ...fontWeight('bold'),
      fontSize: 11,
      color: muted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 8,
      textAlign: 'left',
    },

    // Subject card (elevated + ring + accent stripe)
    // Accent stripe is a start-side border so it follows the rounded corners (RTL-safe).
    subjCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      borderStartWidth: 4,
      paddingVertical: 12,
      paddingEnd: 12,
      paddingStart: 12,
      marginBottom: 10,
      ...layout.shadow,
      shadowOpacity: 0.06,
    },
    subjTop: { flexDirection: 'row', alignItems: 'center' },
    subjInfo: { flex: 1, marginStart: 11 },

    // Quiz history card (flat + bordered, no stripe/ring — distinct from subjects)
    quizCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: HAIRLINE_BLUE,
      padding: 11,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    quizIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: 11,
    },
    quizBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
    quizMeta: { ...typography('label'), fontSize: 10.5, color: muted, marginStart: 8 },

    // Shared bits
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flex1: { flex: 1 },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: borderRadius.sm,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginTop: 5,
    },
    pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    progressTrack: {
      height: 5,
      borderRadius: 99,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
      marginTop: 10,
    },
    progressTrackSm: {
      flex: 1,
      height: 6,
      borderRadius: 99,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 99 },

    // Empty + tip
    emptyCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 20,
      ...layout.shadow,
      shadowOpacity: 0.06,
    },
    emptyIconBox: {
      width: 68,
      height: 68,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      ...typography('caption'),
      ...fontWeight('700'),
      fontSize: 15,
      color: theme.colors.text,
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      padding: 13,
      marginTop: 12,
      ...layout.shadow,
      shadowOpacity: 0.06,
    },
    tipIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.colors.warning + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: 11,
    },
    tipTitle: {
      ...typography('label'),
      ...fontWeight('700'),
      fontSize: 12.5,
      color: theme.colors.text,
      textAlign: 'left',
    },
    centerState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 16 },
    stateText: {
      ...typography('label'),
      fontSize: 11.5,
      color: muted,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18,
    },
  });
};

export default ChildDetailsScreen;
