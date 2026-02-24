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
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import RecentActivityCard from '../components/RecentActivityCard';
import TodaysPlanWidget from '../components/TodaysPlanWidget';
import UnifiedHeader from '../components/UnifiedHeader';
import { marginStart } from '../lib/rtl';

const { width } = Dimensions.get('window');

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

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const WheelOfSuccess: React.FC<{
  theme: any;
  data: WheelOfSuccessData | null;
  t: any;
  typography: any;
  common: any;
}> = ({ theme, data, t, typography, common }) => {
  if (!data || !data.arms || data.arms.length === 0) return null;

  const size = width - 40; // Full width card
  const centerX = size / 2;
  const centerY = size / 2;

  // Configuration matching webfront proportions
  const outerArcThickness = 12;
  const labelCircleRadius = 14;
  const centerRadius = 25;
  const mainRadius = (size / 2) * 0.7 - outerArcThickness;

  const arms = data.arms;
  const segmentCount = arms.length;
  const anglePerSegment = (2 * Math.PI) / segmentCount;

  const currentWheelStyles = wheelStyles(typography, common);

  return (
    <View style={currentWheelStyles.container}>
      <View style={currentWheelStyles.headerRow}>
        <View style={currentWheelStyles.headerInfo}>
          <Text style={currentWheelStyles.wheelTitle}> {t('home_screen.wheel_of_success')} </Text>
          <Text style={currentWheelStyles.wheelSubtitle}> {t('home_screen.overall_success')} </Text>
        </View>
        <View style={currentWheelStyles.masteryBadge}>
          <Text style={currentWheelStyles.masteryValue}> {round(data.overallProgress)} % </Text>
          <Text style={currentWheelStyles.masteryLabel}> {t('home_screen.mastery_target')} </Text>
        </View>
      </View>

      <View style={currentWheelStyles.wheelMainContainer}>
        <Svg width={size} height={size}>
          {/* Grid Lines (Concentric Circles) */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
            const r = centerRadius + ((mainRadius - centerRadius) / 10) * i;
            return (
              <Circle
                key={`grid-${i}`}
                cx={centerX}
                cy={centerY}
                r={r}
                stroke="rgba(160, 210, 219, 0.2)"
                strokeWidth="1"
                fill="none"
                strokeDasharray="4, 4"
              />
            );
          })}

          {arms.map((arm, index) => {
            const startAngle = index * anglePerSegment - Math.PI / 2;
            const endAngle = startAngle + anglePerSegment;
            const midAngle = startAngle + anglePerSegment / 2;

            // Progress Segment Path
            const progressRadius =
              centerRadius + ((mainRadius - centerRadius) / 100) * arm.progress;

            const pathData = `
              M ${centerX} ${centerY}
              L ${centerX + progressRadius * Math.cos(startAngle)} ${centerY + progressRadius * Math.sin(startAngle)}
              A ${progressRadius} ${progressRadius} 0 0 1 ${centerX + progressRadius * Math.cos(endAngle)} ${centerY + progressRadius * Math.sin(endAngle)}
              Z
            `;

            // Spoke Line
            const spokeX = centerX + (mainRadius + outerArcThickness) * Math.cos(startAngle);
            const spokeY = centerY + (mainRadius + outerArcThickness) * Math.sin(startAngle);

            // Label Position
            const labelArcRadius = mainRadius + outerArcThickness / 2;
            const labelX = centerX + labelArcRadius * Math.cos(midAngle);
            const labelY = centerY + labelArcRadius * Math.sin(midAngle);

            return (
              <G key={`arm-${arm.id}`}>
                {/* Outer Arc Band */}
                <Path
                  d={`
                    M ${centerX + (mainRadius + outerArcThickness / 2) * Math.cos(startAngle)} 
                      ${centerY + (mainRadius + outerArcThickness / 2) * Math.sin(startAngle)}
                    A ${mainRadius + outerArcThickness / 2} ${mainRadius + outerArcThickness / 2} 0 0 1 
                      ${centerX + (mainRadius + outerArcThickness / 2) * Math.cos(endAngle)} 
                      ${centerY + (mainRadius + outerArcThickness / 2) * Math.sin(endAngle)}
                  `}
                  fill="none"
                  stroke={arm.color}
                  strokeWidth={outerArcThickness}
                />

                {/* Spoke Line */}
                <Path
                  d={`M ${centerX} ${centerY} L ${spokeX} ${spokeY}`}
                  stroke="rgba(203, 213, 225, 0.3)"
                  strokeWidth="1"
                />

                {/* Filled Progress Segment */}
                {arm.progress > 0 && <Path d={pathData} fill={arm.color} opacity="0.5" />}

                {/* Label Circle */}
                <Circle
                  cx={labelX}
                  cy={labelY}
                  r={labelCircleRadius}
                  fill="#fff"
                  stroke={arm.color}
                  strokeWidth="2"
                />

                {/* Subject Initial */}
                <SvgText
                  x={labelX}
                  y={labelY + 4}
                  fontSize="10"
                  fontWeight="900"
                  fill={arm.color}
                  textAnchor="middle"
                >
                  {arm.name.charAt(0).toUpperCase()}
                </SvgText>
              </G>
            );
          })}

          {/* Center Hub */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={centerRadius}
            fill={theme.colors.primary}
            stroke="#fff"
            strokeWidth="2"
          />
          <SvgText
            x={centerX}
            y={centerY}
            fontSize="14"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {round(data.overallProgress)} %
          </SvgText>
        </Svg>
      </View>

      {/* Subjects List Summary (Horizontal Scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={currentWheelStyles.legendContainer}
      >
        {arms.map((arm) => (
          <View key={`legend-${arm.id}`} style={currentWheelStyles.legendItem}>
            <View style={[currentWheelStyles.legendDot, { backgroundColor: arm.color }]} />
            <Text style={currentWheelStyles.legendText}> {arm.name} </Text>
            <Text style={[currentWheelStyles.legendValue, { color: arm.color }]}>
              {round(arm.progress)} %
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const round = (val: number) => Math.round(val || 0);

const WeeklyPerformanceChart: React.FC<{
  theme: any;
  common: any;
  data: WeeklyPerformance[];
  typography: any;
}> = ({ theme, common, data, typography }) => {
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

  const currentChartStyles = chartStyles(typography);

  return (
    <View style={currentChartStyles.chartContainer}>
      <View style={currentChartStyles.chartWrapper}>
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
      <View style={[currentChartStyles.chartLabels, { flexDirection: common.rowDirection }]}>
        {data.map((item, index) => (
          <Text
            key={`${item.week}-${index}`}
            style={[
              currentChartStyles.chartLabel,
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

const chartStyles = (typography: any) =>
  StyleSheet.create({
    chartContainer: { height: 120, justifyContent: 'center', paddingTop: 10 },
    chartWrapper: { height: 80, alignItems: 'center' },
    chartLabel: { ...typography('caption'), fontSize: 12, fontWeight: '700' },
    chartLabels: { justifyContent: 'space-between', marginTop: 15 },
  });

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();
  const [activitiesData, setActivitiesData] = useState<ActivitiesData | null>(null);
  const [wheelData, setWheelData] = useState<WheelOfSuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `
        query HomeData {
          activities {
            total_quizzes avg_score performance_status performance_trend
            activities { id name subject { id name } score totalQuestions completedAt isPassed }
            weekly_performance { week score }
          }
          wheelOfSuccess {
            arms { id name progress color type }
            overallProgress
          }
        }
      `,
        undefined,
        token,
      );
      if (result.data?.activities) setActivitiesData(result.data.activities);
      if (result.data?.wheelOfSuccess) setWheelData(result.data.wheelOfSuccess);
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

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, isRTL, typography);

  return (
    <View style={common.container}>
      <UnifiedHeader
        leftContent={
          <View style={currentStyles.avatarContainer}>
            <View style={currentStyles.initialsAvatar}>
              <Text style={currentStyles.initialsText}> {getInitials(user?.name || '')} </Text>
            </View>
            <View style={currentStyles.onlineDot} />
          </View>
        }
        title={
          <Text style={common.headerTitle}>
            {t('home_screen.hi')}, {user?.name?.split(' ')[0] || 'Alex'}! 👋
          </Text>
        }
        subtitle={
          <Text style={common.headerSubtitle}>
            {user?.grade?.name || 'Grade'} • {user?.educational_system?.name || 'System'}
          </Text>
        }
        rightContent={
          <TouchableOpacity style={currentStyles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={currentStyles.scrollContent}
      >
        <View style={currentStyles.topStatsRow}>
          <View style={currentStyles.topStatCard}>
            <View
              style={[
                currentStyles.statIconContainer,
                { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
              ]}
            >
              <Ionicons name="briefcase" size={20} color="#f59e0b" />
            </View>
            <Text style={currentStyles.statLabel}> {t('home_screen.quizzes')} </Text>
            <Text style={[currentStyles.statValue, { color: '#0f172a' }]}>
              {activitiesData?.total_quizzes ?? 0}
            </Text>
          </View>
          <View style={currentStyles.topStatCard}>
            <View
              style={[
                currentStyles.statIconContainer,
                { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
              ]}
            >
              <Ionicons name="trending-up" size={20} color="#f59e0b" />
            </View>
            <Text style={currentStyles.statLabel}> {t('home_screen.completed')} </Text>
            <Text style={[currentStyles.statValue, { color: '#0f172a' }]}>
              {activitiesData?.avg_score ?? 0}%
            </Text>
          </View>
        </View>

        <WheelOfSuccess
          theme={theme}
          data={wheelData}
          t={t}
          typography={typography}
          common={common}
        />

        <View style={common.card}>
          <View style={currentStyles.performanceHeader}>
            <View>
              <Text style={currentStyles.performanceTitle}> {t('home_screen.performance')} </Text>
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
            typography={typography}
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
              <Text style={currentStyles.quickActionTitleWhite}>
                {' '}
                {t('home_screen.start_quiz')}{' '}
              </Text>
              <Text style={currentStyles.quickActionSubtitle}> jump to quiz </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('Study')}
            >
              <View style={[currentStyles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="book" size={20} color="#3B82F6" />
              </View>
              <Text style={currentStyles.quickActionTitle}>
                {' '}
                {t('home_screen.browse_booklets')}{' '}
              </Text>
              <Text style={currentStyles.quickActionSubtitleDark}> Booklets </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <View style={[currentStyles.quickActionIcon, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="stats-chart" size={20} color="#EC4899" />
              </View>
              <Text style={currentStyles.quickActionTitle}> {t('home_screen.my_progress')} </Text>
              <Text style={currentStyles.quickActionSubtitleDark}> Progress </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('More')}
            >
              <View style={[currentStyles.quickActionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="settings" size={20} color="#F97316" />
              </View>
              <Text style={currentStyles.quickActionTitle}> {t('common.settings')} </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeaderRow}>
            <Text style={common.sectionTitle}> {t('home_screen.recent_activity')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={currentStyles.viewAllText}> {t('home_screen.view_all')} </Text>
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
          <Text style={currentStyles.quoteAuthor}> - CHINESE PROVERB </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const wheelStyles = (typography: any, common: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 24,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    headerRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    wheelTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
      color: '#1e293b',
      textAlign: common.textAlign,
    },
    wheelSubtitle: {
      ...typography('caption'),
      color: '#64748b',
      marginTop: 2,
      textAlign: common.textAlign,
    },
    masteryBadge: {
      backgroundColor: '#fff',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      minWidth: 80,
    },
    masteryValue: {
      ...typography('h3'),
      fontWeight: '800',
      color: '#284196',
      lineHeight: 24,
    },
    masteryLabel: {
      ...typography('caption'),
      fontSize: 9,
      fontWeight: '700',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    wheelMainContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendContainer: {
      marginTop: 20,
      flexDirection: common.rowDirection,
    },
    legendItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      ...common.marginEnd(16),
      backgroundColor: '#f8fafc',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      ...common.marginEnd(6),
    },
    legendText: {
      ...typography('caption'),
      color: '#1e293b',
      fontWeight: '600',
    },
    legendValue: {
      ...typography('caption'),
      fontWeight: 'bold',
      ...common.marginStart(4),
    },
  });

const styles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
  typography: any,
) =>
  StyleSheet.create({
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
    initialsText: { ...typography('h3'), fontWeight: 'bold', color: '#fff' },
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
      paddingBottom: common.insets.bottom + 50,
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
      aspectRatio: 1,
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      borderRadius: layout.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
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
      ...typography('caption'),
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 2,
      textAlign: 'center',
    },
    statValue: {
      ...typography('h3'),
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
      ...typography('caption'),
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },
    performanceStatus: {
      ...typography('h2'),
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
      ...typography('label'),
      fontWeight: 'bold',
      color: '#10B981',
      ...common.marginStart(4),
    },
    section: { marginBottom: spacing.xl * 1.5 },
    sectionHeaderRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'baseline', // Align text baselines
      marginBottom: spacing.md,
      paddingHorizontal: 4,
    },
    viewAllText: { ...typography('label'), color: theme.colors.primary, fontWeight: '700' },
    quickActionsScroll: {
      paddingRight: spacing.md,
      gap: 12,
    },
    quickActionButton: {
      width: 100, // Revert to 100
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
      ...typography('label'),
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    quickActionTitleWhite: {
      ...typography('label'),
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    quickActionSubtitle: {
      ...typography('caption'),
      fontSize: 10,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginTop: 2,
    },
    quickActionSubtitleDark: {
      ...typography('caption'),
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
      ...typography('h3'),
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: 26,
      fontStyle: 'italic',
    },
    quoteAuthor: {
      ...typography('caption'),
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '700',
      marginTop: 12,
    },
    sectionHeader: {
      marginBottom: spacing.md,
    },
  });

export default HomeScreen;
