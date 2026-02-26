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
import { textAlign } from '../lib/rtl';

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

const round = (val: number) => Math.round(val || 0);

const WheelOfSuccess: React.FC<{
  theme: any;
  data: WheelOfSuccessData | null;
  t: any;
  typography: any;
  common: any;
  spacing: any;
  borderRadius: any;
}> = ({ theme, data, t, typography, common, spacing, borderRadius }) => {
  if (!data || !data.arms || data.arms.length === 0) return null;

  const size = width - layout.screenPadding * 2;
  const centerX = size / 2;
  const centerY = size / 2;

  const outerArcThickness = 12;
  const labelCircleRadius = 14;
  const centerRadius = 25;
  const mainRadius = (size / 2) * 0.7 - outerArcThickness;

  const arms = data.arms;
  const segmentCount = arms.length;
  const anglePerSegment = (2 * Math.PI) / segmentCount;

  const currentWheelStyles = wheelStyles(typography, common, theme, spacing, borderRadius, layout);

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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
            const r = centerRadius + ((mainRadius - centerRadius) / 10) * i;
            return (
              <Circle
                key={`grid-${i}`}
                cx={centerX}
                cy={centerY}
                r={r}
                stroke={theme.colors.border}
                strokeWidth="1"
                fill="none"
                strokeDasharray="4, 4"
                opacity={0.3}
              />
            );
          })}

          {arms.map((arm, index) => {
            const startAngle = index * anglePerSegment - Math.PI / 2;
            const endAngle = startAngle + anglePerSegment;
            const midAngle = startAngle + anglePerSegment / 2;

            const progressRadius =
              centerRadius + ((mainRadius - centerRadius) / 100) * arm.progress;
            const pathData = `
              M ${centerX} ${centerY}
              L ${centerX + progressRadius * Math.cos(startAngle)} ${centerY + progressRadius * Math.sin(startAngle)}
              A ${progressRadius} ${progressRadius} 0 0 1 ${centerX + progressRadius * Math.cos(endAngle)} ${centerY + progressRadius * Math.sin(endAngle)}
              Z
            `;

            const spokeX = centerX + (mainRadius + outerArcThickness) * Math.cos(startAngle);
            const spokeY = centerY + (mainRadius + outerArcThickness) * Math.sin(startAngle);

            const labelArcRadius = mainRadius + outerArcThickness / 2;
            const labelX = centerX + labelArcRadius * Math.cos(midAngle);
            const labelY = centerY + labelArcRadius * Math.sin(midAngle);

            return (
              <G key={`arm-${arm.id}`}>
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
                <Path
                  d={`M ${centerX} ${centerY} L ${spokeX} ${spokeY}`}
                  stroke={theme.colors.border}
                  strokeWidth="1"
                  opacity={0.5}
                />
                {arm.progress > 0 && <Path d={pathData} fill={arm.color} opacity="0.5" />}
                <Circle
                  cx={labelX}
                  cy={labelY}
                  r={labelCircleRadius}
                  fill={theme.colors.surface}
                  stroke={arm.color}
                  strokeWidth="2"
                />
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

          <Circle
            cx={centerX}
            cy={centerY}
            r={centerRadius}
            fill={theme.colors.primary}
            stroke={theme.colors.surface}
            strokeWidth="2"
          />
          <SvgText
            x={centerX}
            y={centerY}
            fontSize="14"
            fontWeight="bold"
            fill={theme.colors.textOnDark}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {round(data.overallProgress)} %
          </SvgText>
        </Svg>
      </View>

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
              {' '}
              {round(arm.progress)} %{' '}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const WeeklyPerformanceChart: React.FC<{
  theme: any;
  common: any;
  data: WeeklyPerformance[];
  typography: any;
}> = ({ theme, common, data, typography }) => {
  if (!data || data.length === 0) return null;
  const chartHeight = 84;
  const chartWidth = width - layout.screenPadding * 4;
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

  const currentChartStyles = chartStyles(typography, theme);

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
              index === data.length - 1 ? { color: theme.colors.primary } : {},
            ]}
          >
            {item.week}
          </Text>
        ))}
      </View>
    </View>
  );
};

const chartStyles = (typography: any, theme: any) =>
  StyleSheet.create({
    chartContainer: { height: 120, justifyContent: 'center', paddingTop: 10 },
    chartWrapper: { height: 84, alignItems: 'center' },
    chartLabel: {
      ...typography('label'),
      color: theme.colors.textSecondary,
    },
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

  const currentStyles = styles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    isRTL,
    typography,
    layout,
  );

  return (
    <View style={common.container}>
      <UnifiedHeader title={isRTL ? 'البوكلتس' : 'EL-Booklets'} />

      <ScrollView
        style={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={currentStyles.scrollContent}
      >
        <View style={currentStyles.userInfoContainer}>
          <View style={currentStyles.avatarContainer}>
            <View style={currentStyles.initialsAvatar}>
              <Text style={currentStyles.initialsText}> {getInitials(user?.name || '')}</Text>
            </View>
            <View style={currentStyles.onlineDot} />
          </View>
          <View style={currentStyles.userInfoText}>
            <Text style={currentStyles.welcomeText}>
              {t('home_screen.hi')}, {user?.name?.split(' ')[0] || 'Alex'}! 👋
            </Text>
            <Text style={currentStyles.gradeText}>
              {user?.grade?.name || t('more_screen.grade')} •{' '}
              {user?.educational_system?.name || t('auth.educational_system')}
            </Text>
          </View>
        </View>

        <View style={currentStyles.topStatsRow}>
          <View style={currentStyles.topStatCard}>
            <View
              style={[
                currentStyles.statIconContainer,
                { backgroundColor: theme.colors.orange + '1A' },
              ]}
            >
              <Ionicons name="briefcase" size={20} color={theme.colors.orange} />
            </View>
            <View style={currentStyles.statTextContainer}>
              <Text style={currentStyles.statValue}> {activitiesData?.total_quizzes ?? 0}</Text>
              <Text style={currentStyles.statLabel}> {t('home_screen.quizzes')} </Text>
            </View>
          </View>
          <View style={currentStyles.topStatCard}>
            <View
              style={[
                currentStyles.statIconContainer,
                { backgroundColor: theme.colors.orange + '1A' },
              ]}
            >
              <Ionicons name="trending-up" size={20} color={theme.colors.orange} />
            </View>
            <View style={currentStyles.statTextContainer}>
              <Text style={currentStyles.statValue}> {activitiesData?.avg_score ?? 0}% </Text>
              <Text style={currentStyles.statLabel}> {t('home_screen.completed')} </Text>
            </View>
          </View>
        </View>

        <View style={currentStyles.featureRow}>
          <TouchableOpacity
            style={currentStyles.featureCard}
            onPress={() => navigation.navigate('Social')}
          >
            <View
              style={[
                currentStyles.featureIconContainer,
                { backgroundColor: theme.colors.primary + '1A' },
              ]}
            >
              <Ionicons name="people" size={24} color={theme.colors.primary} />
            </View>
            <View style={currentStyles.featureTextContainer}>
              <Text style={currentStyles.featureTitle}> {t('common.social')} </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={currentStyles.featureCard}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <View
              style={[
                currentStyles.featureIconContainer,
                { backgroundColor: theme.colors.orange + '1A' },
              ]}
            >
              <Ionicons name="stats-chart" size={24} color={theme.colors.orange} />
            </View>
            <View style={currentStyles.featureTextContainer}>
              <Text style={currentStyles.featureTitle}> {t('common.leaderboard')} </Text>
            </View>
          </TouchableOpacity>
        </View>

        <WheelOfSuccess
          theme={theme}
          data={wheelData}
          t={t}
          typography={typography}
          common={common}
          spacing={spacing}
          borderRadius={borderRadius}
        />

        <View style={[common.card, { marginBottom: spacing.sectionGap }]}>
          <View style={currentStyles.performanceHeader}>
            <View>
              <Text style={currentStyles.performanceTitle}> {t('home_screen.performance')} </Text>
              <Text style={currentStyles.performanceStatus}>
                {activitiesData?.performance_status || t('home_screen.excellent')}
              </Text>
            </View>
            <View
              style={[
                currentStyles.trendBadge,
                {
                  backgroundColor:
                    Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                      ? theme.colors.success + '1A'
                      : theme.colors.error + '1A',
                },
              ]}
            >
              <Ionicons
                name={
                  Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                    ? 'trending-up'
                    : 'trending-down'
                }
                size={14}
                color={
                  Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                    ? theme.colors.success
                    : theme.colors.error
                }
              />
              <Text
                style={[
                  currentStyles.trendText,
                  {
                    color:
                      Number.parseFloat(activitiesData?.performance_trend || '0') >= 0
                        ? theme.colors.success
                        : theme.colors.error,
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

        <TodaysPlanWidget />

        <View style={currentStyles.section}>
          <Text style={common.sectionTitle}> {t('home_screen.quick_actions')} </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={currentStyles.quickActionsScroll}
          >
            <TouchableOpacity
              style={[currentStyles.quickActionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Quiz')}
            >
              <View style={currentStyles.quickActionIconWhite}>
                <Ionicons name="play" size={20} color={theme.colors.textOnDark} />
              </View>
              <Text style={currentStyles.quickActionTitleWhite}>
                {' '}
                {t('home_screen.start_quiz')}{' '}
              </Text>
              <Text style={currentStyles.quickActionSubtitle}>
                {' '}
                {t('home_screen.jump_to_quiz')}{' '}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('Study')}
            >
              <View
                style={[
                  currentStyles.quickActionIcon,
                  { backgroundColor: theme.colors.primary + '1A' },
                ]}
              >
                <Ionicons name="book" size={20} color={theme.colors.primary} />
              </View>
              <Text style={currentStyles.quickActionTitle}>
                {' '}
                {t('home_screen.browse_booklets')}{' '}
              </Text>
              <Text style={currentStyles.quickActionSubtitleDark}>
                {' '}
                {t('home_screen.booklets')}{' '}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <View
                style={[
                  currentStyles.quickActionIcon,
                  { backgroundColor: theme.colors.orange + '1A' },
                ]}
              >
                <Ionicons name="stats-chart" size={20} color={theme.colors.orange} />
              </View>
              <Text style={currentStyles.quickActionTitle}> {t('home_screen.my_progress')} </Text>
              <Text style={currentStyles.quickActionSubtitleDark}>
                {' '}
                {t('home_screen.progress')}{' '}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={currentStyles.quickActionButton}
              onPress={() => navigation.navigate('More')}
            >
              <View
                style={[
                  currentStyles.quickActionIcon,
                  { backgroundColor: theme.colors.mediumGray + '1A' },
                ]}
              >
                <Ionicons name="settings" size={20} color={theme.colors.mediumGray} />
              </View>
              <Text style={currentStyles.quickActionTitle}> {t('common.settings')} </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeaderRow}>
            <Text style={[common.sectionTitle, { marginBottom: 0, lineHeight: undefined }]}>
              {' '}
              {t('home_screen.recent_activity')}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={[currentStyles.viewAllText, { paddingTop: 3, lineHeight: undefined }]}>
                {' '}
                {t('home_screen.view_all')}{' '}
              </Text>
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

const wheelStyles = (
  typography: any,
  common: any,
  theme: any,
  spacing: any,
  borderRadius: any,
  layout: any,
) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    headerRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    headerInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    wheelTitle: {
      ...typography('h3'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    wheelSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: spacing.xxs,
      textAlign: common.textAlign,
    },
    masteryBadge: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    masteryValue: {
      ...typography('body'),
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'center',
    },
    masteryLabel: {
      ...typography('caption'),
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xxs,
    },
    wheelMainContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendContainer: {
      marginTop: spacing.lg,
      flexDirection: common.rowDirection,
    },
    legendItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      ...common.marginEnd(spacing.xs),
    },
    legendText: {
      ...typography('caption'),
      color: theme.colors.text,
      fontWeight: '600',
    },
    legendValue: {
      ...typography('caption'),
      fontWeight: 'bold',
      ...common.marginStart(spacing.xxs),
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
  layout: any,
) =>
  StyleSheet.create({
    avatarContainer: { position: 'relative', ...common.marginStart(spacing.sm) },
    initialsAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.avatarBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    initialsText: {
      ...typography('h3'),
      color: theme.colors.avatarText,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      ...common.marginEnd(0),
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.success,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    scrollContainer: { flex: 1 },
    scrollContent: {
      paddingBottom: Math.max(common.insets.bottom, spacing.xl),
      paddingHorizontal: layout.screenPadding,
    },
    userInfoContainer: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    userInfoText: {
      flex: 1,
      ...common.marginStart(spacing.md),
    },
    welcomeText: {
      ...typography('h2'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    gradeText: {
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
      marginTop: spacing.xxs,
      textAlign: common.textAlign,
    },
    topStatsRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      marginTop: spacing.sectionGap,
      marginBottom: spacing.sectionGap,
      gap: spacing.md,
    },
    topStatCard: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 0,
      elevation: 0,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    statTextContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    statLabel: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginTop: 2,
    },
    statValue: {
      ...typography('h3'),
      fontSize: 18,
      lineHeight: 24,
      color: theme.colors.text,
      textAlign: 'left',
    },
    featureRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      marginBottom: spacing.sectionGap,
      gap: spacing.md,
    },
    featureCard: {
      flex: 1,
      backgroundColor: theme.colors.card,
      padding: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: common.rowDirection,
      ...layout.shadow,
    },
    featureIconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 'auto',
      marginLeft: 4,
    },
    featureTextContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTitle: {
      ...typography('bodySmall'),
      fontWeight: '600',
      color: theme.colors.text,
    },
    performanceHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    performanceTitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },
    performanceStatus: {
      ...typography('h2'),
      color: theme.colors.text,
      marginTop: spacing.xxs,
    },
    trendBadge: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.sm,
    },
    trendText: {
      ...typography('caption'),
      fontWeight: 'bold',
      ...common.marginStart(spacing.xxs),
    },
    section: {
      marginBottom: spacing.sectionGap,
    },
    sectionHeaderRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    viewAllText: {
      ...typography('link'),
      color: theme.colors.primary,
    },
    quickActionsScroll: {
      paddingRight: spacing.xl,
      gap: spacing.md,
    },
    quickActionButton: {
      width: 140,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      ...layout.shadow,
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    quickActionIconWhite: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    quickActionTitle: {
      ...typography('bodySmall'),
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    quickActionTitleWhite: {
      ...typography('bodySmall'),
      fontWeight: '600',
      color: theme.colors.textOnDark,
      textAlign: 'center',
    },
    quickActionSubtitle: {
      ...typography('caption'),
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
      textAlign: 'center',
    },
    quickActionSubtitleDark: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    quoteCard: {
      padding: spacing.xl,
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      marginBottom: spacing.sectionGap,
    },
    quoteText: {
      ...typography('bodyLarge'),
      color: theme.colors.textOnDark,
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 24,
    },
    quoteAuthor: {
      ...typography('label'),
      color: theme.colors.textOnDark,
      marginTop: spacing.md,
      letterSpacing: 1,
      opacity: 0.8,
    },
  });

export default HomeScreen;
