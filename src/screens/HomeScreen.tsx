import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
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
import Svg, { Circle } from 'react-native-svg';
import UnifiedHeader from '../components/UnifiedHeader';

import { getSubjectConfig } from '../utils/subjectTheme';
import SubjectIcon from '../components/SubjectIcon';
import { CardListSkeleton } from '../components/SkeletonLoader';
import ProfileCompletionPrompt from '../components/ProfileCompletionPrompt';
import NotificationBell from '../components/NotificationBell';
import { analytics } from '../lib/analytics';

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
  streak: number;
  activities: any[];
  weekly_performance: WeeklyPerformance[];
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  language?: string;
  chapters: { id: string }[];
  study_progress: number;
  quiz_progress: number;
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

interface TodayScheduleEntry {
  id: string;
  subject: { name: string };
  lessonGoal: number;
  quizGoal: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface TodayScheduleData {
  date: string;
  dayName: string;
  isDayOff?: boolean;
  schedule: TodayScheduleEntry[];
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

  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      // Fetch all data in parallel
      const [activitiesResult, subjectsResult, leaderboardResult, socialResult, todayResult] =
        await Promise.all([
          tryFetchWithFallback(
            `query HomeData {
              activities {
                total_quizzes avg_score performance_status performance_trend streak
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
              subjectsForUserGrade { 
                id name description language study_progress quiz_progress 
                chapters { id } 
              }
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
                connectedUser { id name grade { id name } }
                rankData { previousRank newRank subject { id name } isOverall }
                likes comments
              }
            }`,
            undefined,
            token,
          ),
          tryFetchWithFallback(
            `query TodaySchedule {
              todaySchedule {
                date dayName dayOfWeek
                schedule {
                  id subject { name } lessonGoal quizGoal lessonsCompleted quizzesCompleted completionPercentage isComplete
                }
              }
            }`,
            undefined,
            token,
          ),
        ]);

      if (activitiesResult.data?.activities) {
        setActivitiesData(activitiesResult.data.activities);
      }
      if (activitiesResult.data?.wheelOfSuccess) {
        setWheelData(activitiesResult.data.wheelOfSuccess);
      }
      if (subjectsResult.data?.subjectsForUserGrade) {
        setSubjects(subjectsResult.data.subjectsForUserGrade);
      }
      if (leaderboardResult.data?.leaderboard) {
        setLeaderboardEntries(leaderboardResult.data.leaderboard.entries || []);
        setLeaderboardUser(leaderboardResult.data.leaderboard.userEntry || null);
      }
      if (socialResult.data?.socialTimeline) {
        setSocialFeed(socialResult.data.socialTimeline.slice(0, 2));
      }
      if (todayResult.data?.todaySchedule) {
        setTodaySchedule(todayResult.data.todaySchedule);
      }
    } catch (err: any) {
      console.error('Fetch home data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const lastFetchRef = React.useRef<number>(0);
  const STALE_MS = 30_000; // 30 seconds

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current < STALE_MS && activitiesData) return;
      lastFetchRef.current = now;
      fetchHomeData();
    }, [fetchHomeData, activitiesData]),
  );

  // continueSubject memo removed since "Where You Left Off" was removed

  const s = useMemo(
    () => getStyles(theme, common, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight),
    [theme, common, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight],
  );

  if (loading && !activitiesData) {
    return (
      <View style={common.container}>
        <UnifiedHeader
          centerAlign={true}
          style={{
            backgroundColor: theme.colors.headerBackground,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 74, 154, 0.06)',
          }}
          title={
            <View style={{ alignItems: 'center' }}>
              <Text style={s.headerHiText}>
                {t('home_screen.hi') || 'Hi'}, {user?.name?.split(' ')[0] || 'Student'}
              </Text>
              <Text style={s.headerWelcomeText}>
                {t('home_screen.welcome_back', 'Welcome back 👋')}
              </Text>
            </View>
          }
          leftContent={
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={s.headerLogo}
              resizeMode="contain"
            />
          }
          rightContent={
            <View style={s.headerRight}>
              <NotificationBell />
            </View>
          }
        />
        <View style={{ flex: 1, paddingTop: 16 }}>
          <CardListSkeleton numItems={4} />
        </View>
      </View>
    );
  }

  const headerHeight = common.insets.top + (Platform.OS === 'ios' ? 54 : 57);

  return (
    <View style={common.container}>
      <UnifiedHeader
        centerAlign={true}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: theme.colors.headerBackground,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0, 74, 154, 0.06)',
        }}
        title={
          <View style={{ alignItems: 'center' }}>
            <Text style={s.headerHiText}>
              {t('home_screen.hi') || 'Hi'}, {user?.name?.split(' ')[0] || 'Student'}
            </Text>
            <Text style={s.headerWelcomeText}>
              {t('home_screen.welcome_back', 'Welcome back 👋')}
            </Text>
          </View>
        }
        leftContent={
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={s.headerLogo}
            resizeMode="contain"
          />
        }
        rightContent={
          <View style={s.headerRight}>
            <NotificationBell />
          </View>
        }
      />

      <ScrollView
        style={s.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(common.insets.bottom, spacing.xl),
          paddingHorizontal: layout.screenPadding,
          paddingTop: headerHeight + spacing.sm,
        }}
      >
        {/* ─── 1. Welcome Banner Card ──────────────────────────────── */}
        {activitiesData && (
          <LinearGradient
            colors={['#003B7A', '#004A9A', '#1E54B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.welcomeBanner}
          >
            {/* Background book decoration icon */}
            <View style={s.bannerBookDecoration}>
              <Ionicons name="book-sharp" size={110} color="rgba(255, 255, 255, 0.08)" />
            </View>

            <View style={s.bannerContent}>
              <Text style={s.bannerGradeText}>
                {user?.grade?.name?.toUpperCase() || t('more_screen.grade').toUpperCase()}
              </Text>
              <Text style={s.bannerStreakText}>
                {isRTL
                  ? `${activitiesData.streak || 0} ${t('home_screen.streak_title')} 🔥`
                  : `${activitiesData.streak || 0} day streak 🔥`}
              </Text>

              {/* Inline Stats Row */}
              <View style={s.bannerStatsRow}>
                <View style={s.bannerStatItem}>
                  <Text style={s.bannerStatLabel}>{t('home_screen.quizzes_done', 'Quizzes')}</Text>
                  <Text style={s.bannerStatValue}>{activitiesData.total_quizzes ?? 0}</Text>
                </View>
                <View style={s.bannerStatDivider} />
                <View style={s.bannerStatItem}>
                  <Text style={s.bannerStatLabel}>{t('home_screen.avg_score_label', 'Avg')}</Text>
                  <Text style={s.bannerStatValue}>{activitiesData.avg_score ?? 0}%</Text>
                </View>
                <View style={s.bannerStatDivider} />
                <View style={s.bannerStatItem}>
                  <Text style={s.bannerStatLabel}>{t('home_screen.rank', 'Rank')}</Text>
                  <Text style={s.bannerStatValue}>{leaderboardUser?.rank ? `#${leaderboardUser.rank}` : '-'}</Text>
                </View>
              </View>

              {/* Take a Quiz Button (Full Width) */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  navigation.navigate('MainTabs', { screen: 'Quiz' });
                  navigation.navigate('QuizFlowSubjects');
                }}
                style={s.bannerButton}
              >
                <Ionicons name="play-circle-sharp" size={18} color="#004A9A" />
                <Text style={s.bannerButtonText}>{t('home_screen.take_quiz', 'Take a Quiz')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* ─── 3. My Subjects Grid ────────────────────────────────── */}
        {subjects.length > 0 && (
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('home_screen.my_subjects')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Study')}>
                <Text style={s.viewAllLink}>{t('home_screen.view_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.subjectsGrid}>
              {subjects.slice(0, 4).map((subject) => {
                const subConfig = getSubjectConfig(subject.name, theme);
                return (
                  <TouchableOpacity
                    key={subject.id}
                    style={s.gridSubjectCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      analytics.trackSubjectStarted(subject.id, subject.name);
                      navigation.navigate('StudyChapters', { subject });
                    }}
                  >
                    <SubjectIcon
                      subjectName={subject.name}
                      size={44}
                      style={{ backgroundColor: subConfig.bg, marginBottom: spacing.sm }}
                    />
                    <Text style={s.gridSubjectName} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    <View style={s.gridSubjectProgressRow}>
                      <Text style={s.gridSubjectProgressLabel}>
                        {t('study_screen.study_label', 'Study')}
                      </Text>
                      <Text style={[s.gridSubjectProgressPercent, { color: subConfig.color }]}>
                        {Math.round(subject.study_progress || 0)}%
                      </Text>
                    </View>
                    <View style={s.gridSubjectProgressBar}>
                      <View
                        style={[
                          s.gridSubjectProgressFill,
                          {
                            width: `${Math.min(100, subject.study_progress || 0)}%`,
                            backgroundColor: subConfig.color,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── 4. Recent Quizzes (Quiz History) ───────────────────── */}
        {activitiesData && activitiesData.activities?.length > 0 && (
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {t('home_screen.recent_activity', 'Recent Quizzes')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Quiz')}>
                <Text style={s.viewAllLink}>{t('home_screen.view_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.recentQuizzesCard}>
              {activitiesData.activities.slice(0, 3).map((activity: any, index: number) => {
                const subConfig = getSubjectConfig(activity.subject?.name || '', theme);
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={[s.recentQuizRow, index < 2 && s.recentQuizBorder]}
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate('QuizResults', { quizId: activity.id });
                    }}
                  >
                    <SubjectIcon
                      subjectName={activity.subject?.name || ''}
                      size={32}
                      style={{ backgroundColor: subConfig.bg, ...common.marginEnd(spacing.sm) }}
                    />
                    <View style={s.recentQuizInfo}>
                      <Text style={s.recentQuizTitle} numberOfLines={1}>
                        {activity.name}
                      </Text>
                      <Text style={s.recentQuizTime}>
                        {activity.completedAt
                          ? new Date(activity.completedAt).toLocaleDateString()
                          : 'Recent'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        s.recentQuizScore,
                        {
                          color: activity.isPassed ? theme.colors.success : theme.colors.error,
                        },
                      ]}
                    >
                      {activity.score}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── 5. Weekly Leaderboard ──────────────────────────────── */}
        {leaderboardEntries.length > 0 && (
          <View style={s.leaderboardCard}>
            <View style={s.leaderboardHeader}>
              <Text style={s.leaderboardHeaderTitle}>
                {t('home_screen.weekly_leaderboard', 'Weekly Leaderboard')}
              </Text>
              <Ionicons name="ribbon-sharp" size={20} color="#d97706" />
            </View>
            <View style={s.leaderboardRowsContainer}>
              {leaderboardEntries.slice(0, 3).map((entry, index) => (
                <View
                  key={entry.id}
                  style={[s.leaderboardRankRow, index === 0 && { backgroundColor: '#fff7ed' }]}
                >
                  <Text
                    style={[
                      s.leaderboardRankText,
                      index === 0 && { color: '#d97706' },
                      index === 1 && { color: '#94a3b8' },
                      index === 2 && { color: '#b45309' },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <View
                    style={[
                      s.leaderboardRankAvatar,
                      { borderColor: index === 0 ? '#fdba74' : '#e2e8f0' },
                    ]}
                  >
                    <Text style={s.leaderboardRankAvatarText}>
                      {entry.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.leaderboardRankInfo}>
                    <Text style={s.leaderboardRankName} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    <Text style={s.leaderboardRankXp}>{entry.xp} XP</Text>
                  </View>
                </View>
              ))}

              {/* Current User Highlighted */}
              {leaderboardUser && (
                <View style={s.leaderboardUserRow}>
                  <Text style={s.leaderboardUserRankText}>{leaderboardUser.rank}</Text>
                  <View style={s.leaderboardUserAvatar}>
                    <Text style={s.leaderboardUserAvatarText}>{getInitials(user?.name || '')}</Text>
                  </View>
                  <View style={s.leaderboardRankInfo}>
                    <Text style={s.leaderboardUserName} numberOfLines={1}>
                      {user?.name
                        ? `${user.name.split(' ')[0]} (${t('leaderboard_screen.your_rank', 'You')})`
                        : t('leaderboard_screen.your_rank', 'You')}
                    </Text>
                    <Text style={s.leaderboardUserXp}>{leaderboardUser.xp} XP</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── 6. Today's Plan Card (Study Schedule) ─────────────── */}
        {todaySchedule && todaySchedule.schedule.length > 0 && (
          <TouchableOpacity
            style={s.planCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudyCalendar')}
          >
            <View style={s.planHeader}>
              <View>
                <Text style={s.planTitle}>{t('study_calendar.header_title')}</Text>
                <Text style={s.planSubtitle}>
                  {todaySchedule.dayName}, {todaySchedule.date}
                </Text>
              </View>
              <View style={s.planBadge}>
                <Text style={s.planBadgeText}>
                  {todaySchedule.schedule.filter((e) => e.isComplete).length}/
                  {todaySchedule.schedule.length}
                </Text>
              </View>
            </View>

            <View style={s.planItemsOverview}>
              {todaySchedule.schedule.map((entry, idx) => (
                <View key={entry.id} style={[s.planItem, idx > 0 && s.planItemBorder]}>
                  <View style={s.planItemInfo}>
                    <Text style={s.planItemName} numberOfLines={1}>
                      {entry.subject.name}
                    </Text>
                    <View style={s.planProgressRow}>
                      <View style={s.planMiniBar}>
                        <View
                          style={[
                            s.planMiniFill,
                            {
                              width: `${entry.completionPercentage}%`,
                              backgroundColor: entry.isComplete
                                ? theme.colors.success
                                : theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.planPercent}>{Math.round(entry.completionPercentage)}%</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={entry.isComplete ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={entry.isComplete ? theme.colors.success : theme.colors.border}
                  />
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
      <ProfileCompletionPrompt context="study" />
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
) => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  return StyleSheet.create({
    // Header Left
    headerLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
    },
    headerLogo: {
      width: 36,
      height: 36,
    },
    headerGreeting: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerHiText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#94a3b8',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      textAlign: 'center',
    },
    headerWelcomeText: {
      fontSize: 15,
      ...fontWeight('900'),
      color: '#0f172a',
      textAlign: 'center',
      marginTop: 1,
    },
    headerRight: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerAvatarText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#fff',
    },

    // Welcome Banner Card
    welcomeBanner: {
      borderRadius: borderRadius.xl,
      padding: spacing.mdd,
      marginBottom: spacing.md,
      position: 'relative',
      overflow: 'hidden',
      ...layout.shadow,
    },
    bannerBookDecoration: {
      position: 'absolute',
      right: isRTL ? undefined : -10,
      left: isRTL ? -10 : undefined,
      bottom: -20,
      opacity: 0.8,
    },
    bannerContent: {
      zIndex: 2,
    },
    bannerGradeText: {
      ...typography('label'),
      color: 'rgba(255, 255, 255, 0.6)',
      letterSpacing: 1.2,
      ...fontWeight('bold'),
      textAlign: common.textAlign,
    },
    bannerStreakText: {
      fontSize: 16,
      color: '#fff',
      marginTop: 2,
      marginBottom: spacing.sm,
      ...fontWeight('bold'),
      textAlign: common.textAlign,
    },
    bannerStatsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 16,
      marginTop: 4,
      marginBottom: spacing.sm,
    },
    bannerStatItem: {
      alignItems: 'flex-start',
    },
    bannerStatLabel: {
      ...typography('caption'),
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 10,
      ...fontWeight('bold'),
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    bannerStatValue: {
      ...typography('h3'),
      color: '#fff',
      ...fontWeight('900'),
      marginTop: 1,
    },
    bannerStatDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    bannerButton: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      paddingVertical: 10,
      borderRadius: borderRadius.lg,
      width: '100%',
      gap: 6,
      ...layout.shadow,
    },
    bannerButtonText: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },

    // Subject Grid (2 Columns)
    sectionContainer: {
      marginBottom: spacing.sectionGap,
    },
    sectionSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    subjectsGrid: {
      flexDirection: common.rowDirection,
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    gridSubjectCard: {
      width: (SCREEN_WIDTH - layout.screenPadding * 2 - spacing.md) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: common.alignStart,
      ...layout.shadow,
    },
    gridSubjectIconBox: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    gridSubjectName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    gridSubjectProgressRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 6,
    },
    gridSubjectProgressLabel: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      fontSize: 10,
    },
    gridSubjectProgressPercent: {
      ...typography('caption'),
      ...fontWeight('bold'),
      fontSize: 11,
    },
    gridSubjectProgressBar: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    gridSubjectProgressFill: {
      height: '100%',
      borderRadius: 2,
    },

    // Recent Quizzes
    recentQuizzesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...layout.shadow,
    },
    recentQuizRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    recentQuizBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
    },
    recentQuizIconBox: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    recentQuizInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    recentQuizTitle: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    recentQuizTime: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    recentQuizScore: {
      ...typography('bodySmall'),
      ...fontWeight('black'),
      fontSize: 13,
      ...common.marginStart(spacing.sm),
    },

    // Leaderboard Redesign
    leaderboardHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.mdd,
      paddingTop: spacing.md,
      paddingBottom: spacing.ssm,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 74, 154, 0.06)',
    },
    leaderboardHeaderTitle: {
      ...typography('caption', '800'),
      fontSize: 14,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    leaderboardRowsContainer: {
      gap: spacing.sm,
      padding: spacing.md,
    },
    leaderboardRankRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border + '40',
    },
    leaderboardRankText: {
      ...typography('caption', '800'),
      fontSize: 11,
      width: 20,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      ...common.marginEnd(spacing.xs),
    },
    leaderboardRankAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.border + '50',
      borderWidth: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    leaderboardRankAvatarText: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    leaderboardRankInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    leaderboardRankName: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    leaderboardRankXp: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginTop: 1,
    },
    leaderboardUserRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: 10,
      borderRadius: borderRadius.lg,
      backgroundColor: '#004A9A', // Solid blue
      marginTop: spacing.xs,
    },
    leaderboardUserRankText: {
      ...typography('caption', '800'),
      fontSize: 11,
      color: '#ffffff',
      width: 20,
      textAlign: 'center',
      ...common.marginEnd(spacing.xs),
    },
    leaderboardUserAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    leaderboardUserAvatarText: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: '#ffffff',
    },
    leaderboardUserName: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: '#ffffff',
    },
    leaderboardUserXp: {
      ...typography('caption'),
      color: 'rgba(255, 255, 255, 0.65)',
      ...fontWeight('600'),
      marginTop: 1,
    },
    leaderboardCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.sectionGap,
      overflow: 'hidden',
      ...layout.shadow,
    },

    // Retention of Plan Card Styles
    planCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    planHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    planTitle: {
      ...typography('caption', '800'),
      fontSize: 14,
      textAlign: 'left',
      color: theme.colors.text,
    },
    planSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    planBadge: {
      backgroundColor: theme.colors.primary + '1A',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    planBadgeText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    planItemsOverview: {
      gap: spacing.sm,
    },
    planItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    planItemBorder: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '33',
      paddingTop: spacing.sm,
    },
    planItemInfo: {
      flex: 1,
      ...common.marginEnd(spacing.md),
    },
    planItemName: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: 'left',
    },
    planProgressRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 8,
    },
    planMiniBar: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    planMiniFill: {
      height: '100%',
      borderRadius: 2,
    },
    planPercent: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      paddingHorizontal: 4,
      textAlign: 'right',
      marginBottom: 4,
    },

    // Layout Helpers & Generic Elements
    sectionHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography('bodySmall', '800'),
      fontSize: 15,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    viewAllLink: {
      ...typography('caption'),
      fontSize: 13,
      color: theme.colors.primary,
      ...fontWeight('700'),
    },
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
  });
};

export default HomeScreen;
