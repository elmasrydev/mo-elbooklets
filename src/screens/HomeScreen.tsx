import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import RecentActivityCard from '../components/RecentActivityCard';
import UnifiedHeader from '../components/UnifiedHeader';
import { getSubjectConfig } from '../utils/subjectTheme';
import SubjectIcon from '../components/SubjectIcon';

const { width } = Dimensions.get('window');

// ─── Type Definitions ────────────────────────────────────────────────────────
interface WeeklyPerformance {
  week: string;
  score: number;
}

interface WheelOfSuccessArm {
  id: string;
  name: string;
  progress: number;
  color: string;
  type: string;
}

interface WheelOfSuccessData {
  arms: WheelOfSuccessArm[];
  overallProgress: number;
}

interface ActivitiesData {
  total_quizzes: number;
  avg_score: number;
  performance_status: string;
  performance_trend: string;
  activities: any[];
  weekly_performance: WeeklyPerformance[];
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  chapters: { id: string }[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  rank: number;
}

interface SocialFeedItem {
  id: string;
  type: string;
  user: { id: string; name: string; grade: { id: string; name: string } };
  createdAt: string;
  quizData?: {
    quiz: { name: string; subject: { name: string } };
    score: number;
    totalQuestions: number;
    isPassed: boolean;
  };
  likes: number;
  comments: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const round = (val: number) => Math.round(val || 0);

// ─── Wheel of Success Component ──────────────────────────────────────────────
const WheelOfSuccessSimple: React.FC<{
  theme: any;
  data: WheelOfSuccessData | null;
  t: any;
  typography: any;
  fontWeight: any;
  common: any;
  spacing: any;
  borderRadius: any;
  wheelStyles: any;
}> = ({ theme, data, t, typography, fontWeight, common, spacing, borderRadius, wheelStyles }) => {
  if (!data || !data.arms || data.arms.length === 0) return null;

  const ringSize = 184;
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const outerR = 75;
  const innerR = 55;
  const outerCircumference = 2 * Math.PI * outerR;
  const innerCircumference = 2 * Math.PI * innerR;
  const overallOffset = outerCircumference - (data.overallProgress / 100) * outerCircumference;
  const avgArmProgress = data.arms.reduce((sum, a) => sum + a.progress, 0) / data.arms.length;
  const innerOffset = innerCircumference - (avgArmProgress / 100) * innerCircumference;

  return (
    <View style={wheelStyles.wheelCard}>
      <Text style={wheelStyles.wheelTitle}>{t('home_screen.wheel_of_success')}</Text>

      <View style={wheelStyles.ringContainer}>
        <Svg width={ringSize} height={ringSize} style={wheelStyles.svgRotate}>
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={theme.colors.border}
            strokeWidth={12}
            fill="transparent"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={theme.colors.primary}
            strokeWidth={12}
            fill="transparent"
            strokeDasharray={`${outerCircumference}`}
            strokeDashoffset={overallOffset}
            strokeLinecap="round"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            stroke={theme.colors.border}
            strokeWidth={12}
            fill="transparent"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            stroke={theme.colors.orange || '#F59E0B'}
            strokeWidth={12}
            fill="transparent"
            strokeDasharray={`${innerCircumference}`}
            strokeDashoffset={innerOffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={wheelStyles.ringCenterOverlay}>
          <Text style={wheelStyles.ringPercentText}>{round(data.overallProgress)}%</Text>
          <Text style={wheelStyles.ringProgressLabel}>{t('common.progress')}</Text>
        </View>
      </View>

      <Text style={wheelStyles.wheelFooterText}>{t('home_screen.keep_completing')}</Text>
    </View>
  );
};

// ─── Home Screen ─────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const [activitiesData, setActivitiesData] = useState<ActivitiesData | null>(null);
  const [wheelData, setWheelData] = useState<WheelOfSuccessData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardUser, setLeaderboardUser] = useState<LeaderboardEntry | null>(null);
  const [socialFeed, setSocialFeed] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      // Fetch all data in parallel
      const [activitiesResult, subjectsResult, leaderboardResult, socialResult] = await Promise.all(
        [
          tryFetchWithFallback(
            `query HomeData {
              activities {
                total_quizzes avg_score performance_status performance_trend
                activities { id name subject { id name } score totalQuestions completedAt isPassed }
                weekly_performance { week score }
              }
              wheelOfSuccess {
                arms { id name progress color type }
                overallProgress
              }
            }`,
            undefined,
            token,
          ),
          tryFetchWithFallback(
            `query SubjectsForUserGrade {
              subjectsForUserGrade { id name description chapters { id } }
            }`,
            undefined,
            token,
          ),
          tryFetchWithFallback(
            `query Leaderboard($limit: Int) {
              leaderboard(limit: $limit) {
                entries { id name xp rank }
                userEntry { id name xp rank }
              }
            }`,
            { limit: 4 },
            token,
          ),
          tryFetchWithFallback(
            `query SocialTimeline {
              socialTimeline {
                id type
                user { id name grade { id name } }
                createdAt
                quizData {
                  quiz { name subject { name } }
                  score totalQuestions isPassed
                }
                likes comments
              }
            }`,
            undefined,
            token,
          ),
        ],
      );

      if (activitiesResult.data?.activities) setActivitiesData(activitiesResult.data.activities);
      if (activitiesResult.data?.wheelOfSuccess) setWheelData(activitiesResult.data.wheelOfSuccess);
      if (subjectsResult.data?.subjectsForUserGrade)
        setSubjects(subjectsResult.data.subjectsForUserGrade);
      if (leaderboardResult.data?.leaderboard) {
        setLeaderboardEntries(leaderboardResult.data.leaderboard.entries || []);
        setLeaderboardUser(leaderboardResult.data.leaderboard.userEntry || null);
      }
      if (socialResult.data?.socialTimeline)
        setSocialFeed(socialResult.data.socialTimeline.slice(0, 2));
    } catch (err: any) {
      console.error('Fetch home data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [fetchHomeData]),
  );

  const s = getStyles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    isRTL,
    typography,
    fontWeight,
  );

  if (loading && !activitiesData) {
    return (
      <View style={common.container}>
        <UnifiedHeader title={isRTL ? 'البوكلتس' : 'EL-Booklets'} />
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={common.container}>
      <UnifiedHeader title={isRTL ? 'البوكلتس' : 'EL-Booklets'} />

      <ScrollView
        style={s.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(common.insets.bottom, spacing.xl),
          paddingHorizontal: layout.screenPadding,
        }}
      >
        {/* ─── 1. Greeting Card ──────────────────────────────────── */}
        <View style={s.greetingCard}>
          <View style={s.flex1}>
            <Text style={s.greetingName}>
              {t('home_screen.hi')}, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </Text>
            <Text style={s.greetingSubtext}>
              {user?.grade?.name || t('more_screen.grade')} •{' '}
              {user?.educational_system?.name || t('auth.educational_system')}
            </Text>
          </View>
          <View style={s.greetingAvatar}>
            <Text style={s.greetingAvatarText}>{getInitials(user?.name || '')}</Text>
          </View>
        </View>

        {/* ─── 2. Quiz CTA Card ──────────────────────────────────── */}
        <View style={s.quizCTACard}>
          <View style={s.quizCTAContent}>
            <Text style={s.quizCTATitle}>{t('home_screen.take_quiz')}</Text>
            <Text style={s.quizCTASubtitle}>{t('home_screen.test_knowledge_subtitle')}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Quiz')}
              style={s.quizCTAButton}
            >
              <Ionicons name="play" size={14} color={theme.colors.primary} />
              <Text style={s.quizCTAButtonText}>{t('home_screen.play_now')}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.quizCTAIconBg}>
            <Image
              source={require('../../assets/images/quiz-illustration.png')}
              style={[s.quizCTAIllustration, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}
            />
          </View>
        </View>

        {/* ─── 3. Stats Row ──────────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <View
              style={[
                s.statIconBox,
                { backgroundColor: (theme.colors.success || '#10B981') + '1A' },
              ]}
            >
              <Ionicons name="document-text" size={27} color={theme.colors.success || '#10B981'} />
            </View>
            <View style={s.statContent}>
              <Text style={s.statValue}>{activitiesData?.total_quizzes ?? 0}</Text>
              <Text style={s.statLabel}>{t('home_screen.quizzes_done')}</Text>
            </View>
          </View>
          <View style={s.statCard}>
            <View
              style={[
                s.statIconBox,
                { backgroundColor: (theme.colors.orange || '#F59E0B') + '1A' },
              ]}
            >
              <Ionicons name="analytics-sharp" size={27} color={theme.colors.orange || '#F59E0B'} />
            </View>
            <View>
              <Text style={s.statValue}>{activitiesData?.avg_score ?? 0}%</Text>
              <Text style={s.statLabel}>{t('home_screen.avg_score_label')}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3b. Weekly Performance ────────────────────────────── */}
        {activitiesData?.weekly_performance && activitiesData.weekly_performance.length > 0 && (
          <View style={s.weeklyCard}>
            <Text style={s.sectionTitle}>{t('home_screen.performance')}</Text>
            <View style={s.weeklyBarsContainer}>
              {activitiesData.weekly_performance.slice(-7).map((wp, index) => {
                const barHeight = Math.max(8, (wp.score / 100) * 120);
                const dayLabel =
                  wp.week?.substring(0, 3) || ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index % 7];
                const isHighScore = wp.score >= 70;
                const isToday = index === activitiesData!.weekly_performance.slice(-7).length - 1;
                return (
                  <View key={`${wp.week}-${index}`} style={s.weeklyBarColumn}>
                    <Text
                      style={[
                        s.weeklyBarValue,
                        isToday && { color: theme.colors.primary, ...fontWeight('bold') },
                      ]}
                    >
                      {round(wp.score)}%
                    </Text>
                    <View style={s.weeklyBarTrack}>
                      <View
                        style={[
                          s.weeklyBarFill,
                          {
                            height: barHeight,
                            backgroundColor: isToday
                              ? theme.colors.primary
                              : isHighScore
                                ? theme.colors.success || '#10B981'
                                : theme.colors.border,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        s.weeklyBarLabel,
                        isToday && { color: theme.colors.primary, ...fontWeight('bold') },
                      ]}
                    >
                      {dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        {/* ─── 4. My Subjects Grid ───────────────────────────────── */}
        {subjects.length > 0 && (
          <View style={s.sectionGapWrapper}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('home_screen.my_subjects')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Study')}>
                <Text style={s.viewAllLink}>{t('home_screen.view_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.subjectsGrid}>
              {subjects.slice(0, 4).map((subject) => {
                const config = getSubjectConfig(subject.name, theme);
                const chaptersCount = subject.chapters?.length || 0;
                return (
                  <TouchableOpacity
                    key={subject.id}
                    style={s.subjectCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('StudyChapters', { subject })}
                  >
                    <View style={[s.subjectCardHeader, { flexDirection: common.rowDirection }]}>
                      <SubjectIcon subjectName={subject.name} size={32} />
                      <Text style={s.subjectChapterCount}>{chaptersCount}</Text>
                    </View>
                    <Text style={s.subjectName}>{subject.name}</Text>
                    <View style={s.subjectProgressBar}>
                      <View
                        style={[
                          s.subjectProgressFill,
                          {
                            width: `${Math.min(100, chaptersCount * 15)}%`,
                            backgroundColor: config.color,
                          },
                        ]}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        s.subjectButton,
                        chaptersCount >= 5
                          ? { backgroundColor: theme.colors.primary }
                          : {
                              backgroundColor: theme.colors.background,
                              borderWidth: 1,
                              borderColor: theme.colors.primary + '1A',
                            },
                      ]}
                      onPress={() => navigation.navigate('StudyChapters', { subject })}
                    >
                      <Text
                        style={[
                          s.subjectButtonText,
                          chaptersCount >= 5
                            ? { color: theme.colors.textOnDark }
                            : { color: theme.colors.primary },
                        ]}
                      >
                        {chaptersCount >= 5
                          ? t('home_screen.ready_for_quiz')
                          : t('home_screen.continue')}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── 5. Wheel of Success ───────────────────────────────── */}
        <WheelOfSuccessSimple
          theme={theme}
          data={wheelData}
          t={t}
          typography={typography}
          fontWeight={fontWeight}
          common={common}
          spacing={spacing}
          borderRadius={borderRadius}
          wheelStyles={s}
        />

        {/* ─── 6. Community Feed ─────────────────────────────────── */}
        {socialFeed.length > 0 && (
          <View style={s.sectionGapWrapper}>
            <Text style={[s.sectionTitle, { marginBottom: spacing.sectionGap }]}>
              {t('home_screen.community_feed')}
            </Text>
            {socialFeed.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.feedCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Social')}
              >
                <View style={[s.feedAvatarCircle, { flexDirection: common.rowDirection }]}>
                  <Text style={s.feedAvatarText}>
                    {item.user?.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={s.feedContentArea}>
                  <Text style={s.feedUserName}>{item.user?.name}</Text>
                  {item.type === 'quiz_completion' && item.quizData && (
                    <Text style={s.feedText} numberOfLines={2}>
                      {t('social_screen.aced_quiz', {
                        subject: item.quizData.quiz?.subject?.name || '',
                      })}{' '}
                      • {Math.round((item.quizData.score / item.quizData.totalQuestions) * 100)}%
                    </Text>
                  )}
                  <View style={[s.feedActions, { flexDirection: common.rowDirection }]}>
                    <View style={s.feedActionRow}>
                      <Ionicons name="heart-outline" size={14} color={theme.colors.textTertiary} />
                      <Text style={s.feedActionText}> {item.likes}</Text>
                    </View>
                    <View style={s.feedActionRow}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                      <Text style={s.feedActionText}> {item.comments}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── 7. Leaderboard Snippet ────────────────────────────── */}
        {leaderboardEntries.length > 0 && (
          <View style={s.leaderboardCard}>
            <View style={[s.leaderboardHeader, { flexDirection: common.rowDirection }]}>
              <Text style={s.leaderboardTitle}>{t('home_screen.weekly_leaderboard')}</Text>
            </View>
            <View>
              {leaderboardEntries.slice(0, 4).map((entry, index) => {
                const isCurrentUser = entry.id === user?.id?.toString();
                return (
                  <View
                    key={entry.id}
                    style={[
                      s.leaderboardRow,
                      { flexDirection: common.rowDirection },
                      isCurrentUser && s.leaderboardRowHighlight,
                      index < leaderboardEntries.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={s.leaderboardRowInner}>
                      <Text
                        style={[
                          s.leaderboardRank,
                          isCurrentUser && { color: theme.colors.primary },
                          index === 0 && { color: '#FBBF24' },
                          index === 1 && { color: '#CBD5E1' },
                          index === 2 && { color: '#FB923C' },
                        ]}
                      >
                        {entry.rank}
                      </Text>
                      <View
                        style={[
                          s.leaderboardAvatar,
                          isCurrentUser && { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Text style={[s.leaderboardAvatarText, isCurrentUser && { color: '#fff' }]}>
                          {entry.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          s.leaderboardName,
                          isCurrentUser && { color: theme.colors.primary, ...fontWeight('bold') },
                        ]}
                        numberOfLines={1}
                      >
                        {isCurrentUser
                          ? `${t('leaderboard_screen.your_rank').split(':')[0]} (${entry.name.split(' ')[0]})`
                          : entry.name}
                      </Text>
                    </View>
                    <View style={s.leaderboardPointsRow}>
                      <Text
                        style={[
                          s.leaderboardPoints,
                          isCurrentUser && { color: theme.colors.primary },
                        ]}
                      >
                        {(entry.xp || 0).toLocaleString()} {t('common.points').toLowerCase()}
                      </Text>
                      {index === 0 ? (
                        <Image
                          source={require('../../assets/images/leader1medal.png')}
                          style={s.medalIcon}
                          resizeMode="contain"
                        />
                      ) : index === 1 ? (
                        <Image
                          source={require('../../assets/images/leader2medal.png')}
                          style={s.medalIcon}
                          resizeMode="contain"
                        />
                      ) : index === 2 ? (
                        <Image
                          source={require('../../assets/images/leader3medal.png')}
                          style={s.medalIcon}
                          resizeMode="contain"
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity
              style={s.leaderboardViewAllBtn}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <Text style={s.viewAllLink}>{t('home_screen.view_all')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── 8. Recent Activity ────────────────────────────────── */}
        {activitiesData && activitiesData.activities?.length > 0 && (
          <View style={s.sectionGapWrapper}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('home_screen.recent_activity')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Quiz')}>
                <Text style={s.viewAllLink}>{t('home_screen.view_all')}</Text>
              </TouchableOpacity>
            </View>
            {activitiesData.activities.slice(0, 3).map((a: any) => (
              <RecentActivityCard
                key={a.id}
                activity={a}
                onPress={() => {
                  const isQuiz = a.name?.toLowerCase().includes('quiz') || a.totalQuestions > 0;
                  navigation.navigate(isQuiz ? 'Quiz' : 'Study');
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const getStyles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    // Greeting Card
    greetingCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    greetingName: {
      ...typography('h1'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    greetingSubtext: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: spacing.xxs,
      textAlign: common.textAlign,
      ...fontWeight('600'),
    },
    greetingAvatar: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.primary + '1A',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginStart(spacing.md),
    },
    greetingAvatarText: {
      ...typography('h3'),
      color: theme.colors.primary,
      ...fontWeight('bold'),
    },

    // Quiz CTA Card
    quizCTACard: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: common.rowDirection,
      overflow: 'hidden',
      position: 'relative',
      ...layout.shadow,
    },
    quizCTATitle: {
      ...typography('h1'),
      color: theme.colors.textOnDark,
      marginBottom: spacing.xxs,
      textAlign: 'left',
    },
    quizCTASubtitle: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: 'rgba(255,255,255,0.8)',
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    quizCTAButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      alignSelf: 'flex-start',
      gap: 6,
    },
    quizCTAButtonText: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    quizCTAIconBg: {
      position: 'absolute',
      flexDirection: common.rowDirection,
      right: -8,
      bottom: -8,
      opacity: 1,
    },

    // Stats Row
    statsRow: {
      flexDirection: common.rowDirection,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    statCard: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: spacing.sm,
      ...layout.shadow,
    },
    statIconBox: {
      width: 45,
      height: 45,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: {
      ...typography('h2'),
      ...fontWeight('bold'),
      fontSize: 22,
      lineHeight: 28,
      color: theme.colors.text,
      textAlign: 'left',
    },
    statLabel: {
      ...typography('caption'),
      fontSize: 10,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      ...fontWeight('bold'),
      textAlign: 'left',
    },

    // Weekly Performance
    weeklyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    weeklyBarsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 170,
      paddingTop: spacing.sm,
    },
    weeklyBarColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
    },
    weeklyBarValue: {
      ...typography('caption'),
      fontSize: 9,
      ...fontWeight('600'),
      color: theme.colors.textTertiary,
      marginBottom: 4,
    },
    weeklyBarTrack: {
      width: 24,
      backgroundColor: theme.colors.border + '40',
      borderRadius: 12,
      height: 120,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    weeklyBarFill: {
      width: '100%',
      borderRadius: 12,
    },
    weeklyBarLabel: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('600'),
      color: theme.colors.textTertiary,
      marginTop: 6,
    },

    // Section Headers
    sectionHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography('h3'),
      color: theme.colors.text,
      textAlign: common.textAlign,
      ...fontWeight('bold'),
    },
    viewAllLink: {
      ...typography('bodySmall'),
      color: theme.colors.primary,
      ...fontWeight('bold'),
    },

    // Subjects Grid
    subjectsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    subjectCard: {
      width: (width - layout.screenPadding * 2 - spacing.md) / 2,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    subjectCardHeader: {
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    subjectChapterCount: {
      ...typography('caption'),
      fontSize: 11,
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
    },
    subjectName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: common.textAlign,
    },
    subjectProgressBar: {
      width: '100%',
      height: 5,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    subjectProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    subjectButton: {
      width: '100%',
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    subjectButtonText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      fontSize: 11,
    },

    // Feed Cards
    feedCard: {
      flexDirection: common.rowDirection,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.sm,
      ...layout.shadow,
    },
    feedAvatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '1A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    feedAvatarText: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    feedUserName: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    feedText: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    feedActions: {
      marginTop: spacing.xs,
      gap: spacing.md,
    },
    feedActionText: {
      ...typography('caption'),
      fontSize: 11,
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
    },

    // Leaderboard
    leaderboardCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.sectionGap,
      overflow: 'hidden',
      ...layout.shadow,
    },
    leaderboardHeader: {
      padding: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    leaderboardTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    leaderboardRow: {
      padding: spacing.md,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leaderboardRowHighlight: {
      backgroundColor: theme.colors.primary + '0D',
      borderLeftWidth: isRTL ? 0 : 4,
      borderRightWidth: isRTL ? 4 : 0,
      borderLeftColor: theme.colors.primary,
      borderRightColor: theme.colors.primary,
    },
    leaderboardRank: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      width: 20,
      textAlign: 'center',
      ...common.marginEnd(spacing.md),
    },
    leaderboardAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    leaderboardAvatarText: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    leaderboardName: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      flex: 1,
      textAlign: common.textAlign,
    },
    leaderboardPoints: {
      ...typography('caption'),
      fontSize: 11,
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    leaderboardViewAll: {
      padding: spacing.md,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },

    // Wheel of Success
    wheelCard: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
      alignItems: 'center',
    },
    wheelTitle: {
      ...typography('h3'),
      color: theme.colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    ringContainer: {
      width: 184,
      height: 184,
      alignItems: 'center',
      justifyContent: 'center',
    },
    svgRotate: {
      transform: [{ rotate: '-90deg' }],
    },
    ringCenterOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringPercentText: {
      ...typography('h1'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      fontSize: 28,
    },
    ringProgressLabel: {
      ...typography('caption'),
      fontSize: 9,
      color: theme.colors.textSecondary,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      ...fontWeight('bold'),
    },
    wheelFooterText: {
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
      marginTop: spacing.lg,
      textAlign: 'center',
    },

    // Layout Helpers
    loadingCenter: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollFlex: {
      flex: 1,
    },
    flex1: {
      flex: 1,
    },
    sectionGapWrapper: {
      marginBottom: spacing.sectionGap,
    },

    // Quiz CTA Extras
    quizCTAContent: {
      zIndex: 1,
      flex: 1,
    },
    quizCTAIllustration: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
    },

    // Stat Content
    statContent: {
      flex: 1,
      justifyContent: 'center',
    },

    // Feed Extras
    feedContentArea: {
      flex: 1,
      ...common.marginStart(spacing.md),
      alignItems: common.alignStart,
    },
    feedActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    // Leaderboard Extras
    leaderboardRowInner: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      flex: 1,
    },
    leaderboardPointsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    medalIcon: {
      width: 16,
      height: 16,
      marginLeft: 6,
    },
    leaderboardViewAllBtn: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
  });

export default HomeScreen;
