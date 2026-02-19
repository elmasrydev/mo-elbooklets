import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import RecentActivityCard from '../components/RecentActivityCard';
import TodaysPlanWidget from '../components/TodaysPlanWidget';

const { width } = Dimensions.get('window');

interface WeeklyPerformance {
  week: string;
  score: number;
}

interface ActivitiesData {
  total_quizzes: number;
  avg_score: number;
  performance_status: string;
  performance_trend: string;
  activities: any[];
  weekly_performance: WeeklyPerformance[];
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const WeeklyPerformanceChart: React.FC<{ theme: any; common: any; data: WeeklyPerformance[] }> = ({
  theme,
  common,
  data,
}) => {
  if (!data || data.length === 0) return null;
  const chartHeight = 80;
  const chartWidth = width - 80;
  const maxValue = 100;
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * chartWidth,
    y: chartHeight - (item.score / maxValue) * chartHeight,
  }));

  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  return (
    <View style={chartStyles.chartContainer}>
      <View style={chartStyles.chartWrapper}>
        <Svg height={chartHeight} width={chartWidth}>
          <Path
            d={generateSmoothPath(points)}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View style={[chartStyles.chartLabels, { flexDirection: common.rowDirection }]}>
        {data.map((item, index) => (
          <Text
            key={`${item.week}-${index}`}
            style={[
              chartStyles.chartLabel,
              { color: theme.colors.textSecondary },
              index === data.length - 1 ? { color: theme.colors.primary, fontWeight: 'bold' } : {},
            ]}
          >
            {item.week}
          </Text>
        ))}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  chartContainer: { height: 120, justifyContent: 'center', paddingTop: 10 },
  chartWrapper: { height: 80, alignItems: 'center' },
  chartLabel: { fontSize: 12, fontWeight: '700' },
  chartLabels: { justifyContent: 'space-between', marginTop: 15 },
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const [activitiesData, setActivitiesData] = useState<ActivitiesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `
        query Activities {
          activities {
            total_quizzes avg_score performance_status performance_trend
            activities { id name subject { id name } score totalQuestions completedAt isPassed }
            weekly_performance { week score }
          }
        }
      `,
        undefined,
        token,
      );
      if (result.data?.activities) setActivitiesData(result.data.activities);
    } catch (err: any) {
      console.error('Fetch activities error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);
  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities]),
  );

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, isRTL);

  return (
    <View style={common.container}>
      <View style={common.header}>
        <View style={currentStyles.headerLeftContent}>
          <View style={currentStyles.avatarContainer}>
            <View style={currentStyles.initialsAvatar}>
              <Text style={currentStyles.initialsText}> {getInitials(user?.name || '')}</Text>
            </View>
            <View style={currentStyles.onlineDot} />
          </View>
          <View style={currentStyles.headerGreeting}>
            <Text style={common.headerTitle}>{t('home_screen.hi')}, {user?.name?.split(' ')[0] || 'Alex'}! 👋</Text>
            <Text style={common.headerSubtitle}>{user?.grade?.name || 'Grade'} • {user?.educational_system?.name || 'System'}</Text>
          </View>
        </View>
        <TouchableOpacity style={currentStyles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={currentStyles.scrollContent}
      >
        <View style={currentStyles.topStatsRow}>
          <View style={currentStyles.topStatCard}>
            <View style={[currentStyles.statIconContainer, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="briefcase" size={20} color="#EC4899" />
            </View>
            <Text style={currentStyles.statLabel}>{t('home_screen.quizzes')}</Text>
            <Text style={currentStyles.statValue}>{activitiesData?.total_quizzes ?? 0}</Text>
          </View>
          <View style={currentStyles.topStatCard}>
            <View style={[currentStyles.statIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
            </View>
            <Text style={currentStyles.statLabel}>{t('home_screen.completed')}</Text>
            <Text style={currentStyles.statValue}>{activitiesData?.avg_score ?? 0}%</Text>
          </View>
        </View>

        <View style={common.card}>
          <View style={currentStyles.performanceHeader}>
            <View>
              <Text style={currentStyles.performanceTitle}>{t('home_screen.performance')}</Text>
              <Text style={currentStyles.performanceStatus}>
                {activitiesData?.performance_status || t('home_screen.excellent')}
              </Text>
            </View>
            <View style={currentStyles.trendBadge}>
              <Ionicons
                name={
                  Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                    ? 'trending-up'
                    : 'trending-down'
                }
                size={14}
                color={
                  Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                    ? '#10B981'
                    : '#EF4444'
                }
              />
              <Text
                style={[
                  currentStyles.trendText,
                  {
                    color:
                      Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                        ? '#10B981'
                        : '#EF4444',
                  },
                ]}
              >
                {activitiesData?.performance_trend || '+0%'}
              </Text>
            </View>
          </View>
          <WeeklyPerformanceChart
            theme={theme}
            common={common}
            data={activitiesData?.weekly_performance || []}
          />
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <TodaysPlanWidget />
        </View>

        <View style={currentStyles.section}>
          <Text style={common.sectionTitle}> {t('home_screen.quick_actions')} </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={currentStyles.quickActionsScroll}
          >
            <TouchableOpacity
              style={[currentStyles.quickActionButton, { backgroundColor: '#6366F1' }]}
              onPress={() => navigation.navigate('Quiz')}
            >
              <View style={currentStyles.quickActionIconWhite}>
                <Ionicons name="play" size={20} color="#fff" />
              </View>
              <Text style={currentStyles.quickActionTitleWhite}>Start</Text>
              <Text style={currentStyles.quickActionSubtitle}>jump to quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('Study')}
            >
              <View style={[currentStyles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="book" size={20} color="#3B82F6" />
              </View>
              <Text style={currentStyles.quickActionTitle}> Browse </Text>
              <Text style={currentStyles.quickActionSubtitleDark}> Booklets </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <View style={[currentStyles.quickActionIcon, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="stats-chart" size={20} color="#EC4899" />
              </View>
              <Text style={currentStyles.quickActionTitle}> My </Text>
              <Text style={currentStyles.quickActionSubtitleDark}> Progress </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('More')}
            >
              <View style={[currentStyles.quickActionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="settings" size={20} color="#F97316" />
              </View>
              <Text style={currentStyles.quickActionTitle}> Settings </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeaderRow}>
            <Text style={common.sectionTitle}>{t('home_screen.recent_activity')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={currentStyles.viewAllText}>{t('home_screen.view_all')}</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            activitiesData?.activities
              .slice(0, 3)
              .map((a) => (
                <RecentActivityCard
                  key={a.id}
                  activity={a}
                  onPress={() => navigation.navigate('Leaderboard')}
                />
              ))
          )}
        </View>

        <View style={currentStyles.quoteCard}>
          <Text style={currentStyles.quoteText}>
            "Learning is a treasure that will follow its owner everywhere."
          </Text>
          <Text style={currentStyles.quoteAuthor}>- CHINESE PROVERB</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
) =>
  StyleSheet.create({
    // header: { ...common.header }, // Using common.header directly
    headerLeftContent: { flexDirection: common.rowDirection, alignItems: 'center', flex: 1 },
    avatarContainer: { position: 'relative', ...common.marginStart(spacing.sm) },
    initialsAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    initialsText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      ...common.marginEnd(0),
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#10B981',
      borderWidth: 2,
      borderColor: theme.colors.headerBackground || theme.colors.primary,
    },
    headerGreeting: { ...common.marginStart(12), alignItems: common.alignStart },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: { flex: 1 },
    scrollContent: {
      paddingBottom: 100,
      paddingHorizontal: layout.screenPadding,
    },
    topStatsRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
      marginTop: spacing.xl,
      gap: 12,
    },
    topStatCard: {
      flex: 1,
      aspectRatio: 1, // Make square
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      borderRadius: layout.borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 2,
      textAlign: 'center',
    },
    statValue: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    performanceHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    performanceTitle: {
      fontSize: fontSizes.xs,
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },
    performanceStatus: {
      fontSize: fontSizes['2xl'],
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 4,
    },
    trendBadge: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    trendText: {
      fontSize: fontSizes.sm,
      fontWeight: 'bold',
      color: '#10B981',
      ...common.marginStart(4),
    },
    section: { marginBottom: spacing.xl * 1.5 },
    sectionHeaderRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    viewAllText: { fontSize: fontSizes.sm, color: theme.colors.primary, fontWeight: '700' },
    quickActionsScroll: {
      paddingRight: spacing.md,
      gap: 12,
    },
    quickActionButton: {
      width: 100,
      backgroundColor: theme.colors.card,
      borderRadius: layout.borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    quickActionIconWhite: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    quickActionTitle: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    quickActionTitleWhite: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    quickActionSubtitle: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginTop: 2,
    },
    quickActionSubtitleDark: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    quoteCard: {
      backgroundColor: '#9333EA',
      borderRadius: layout.borderRadius.xl,
      padding: 30,
      alignItems: 'center',
      marginTop: 10,
    },
    quoteText: {
      fontSize: fontSizes.lg,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: 26,
      fontStyle: 'italic',
    },
    quoteAuthor: {
      fontSize: fontSizes.xs,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '700',
      marginTop: 16,
      letterSpacing: 1,
    },
  });

export default HomeScreen;
