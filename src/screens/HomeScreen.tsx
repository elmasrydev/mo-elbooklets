import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface QuizActivity {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
}

interface WeeklyPerformance {
  week: string;
  score: number;
}

interface ActivitiesData {
  total_quizzes: number;
  avg_score: number;
  performance_status: string;
  performance_trend: string;
  activities: QuizActivity[];
  weekly_performance: WeeklyPerformance[];
}

// Helper to get initials from name
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Simple Custom Line Chart Component with Smooth Curve
const WeeklyPerformanceChart: React.FC<{ theme: any, isRTL: boolean, data: WeeklyPerformance[] }> = ({ theme, isRTL, data }) => {
  if (!data || data.length === 0) return null;
  
  const chartHeight = 80;
  const chartWidth = width - 80;
  const maxValue = 100;
  
  // Calculate points
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - (item.score / maxValue) * chartHeight;
    return { x, y };
  });

  // Generate SVG path for smooth curve (Cubic Bezier)
  const generateSmoothPath = (pts: {x: number, y: number}[]) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i+1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const pathData = generateSmoothPath(points);
  
  return (
    <View style={styles(theme, isRTL, {}, {}, {}).chartContainer}>
      <View style={styles(theme, isRTL, {}, {}, {}).chartWrapper}>
        <Svg height={chartHeight} width={chartWidth}>
          <Path
            d={pathData}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View style={currentChartStyles(isRTL).chartLabels}>
        {data.map((item, index) => (
          <Text 
            key={`${item.week}-${index}`} 
            style={[
              styles(theme, isRTL, {}, {}, {}).chartLabel, 
              index === data.length - 1 ? { color: theme.colors.primary, fontWeight: 'bold' } : {}
            ]}
          >
            {item.week}
          </Text>
        ))}
      </View>
    </View>
  );
};

const currentChartStyles = (isRTL: boolean) => StyleSheet.create({
  chartLabels: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 0,
  }
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [activitiesData, setActivitiesData] = useState<ActivitiesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const result = await tryFetchWithFallback(`
        query Activities {
          activities {
            total_quizzes
            avg_score
            performance_status
            performance_trend
            activities {
              id
              name
              subject {
                id
                name
              }
              score
              totalQuestions
              completedAt
              isPassed
            }
            weekly_performance {
              week
              score
            }
          }
        }
      `, undefined, token);

      if (result.data?.activities) {
        setActivitiesData(result.data.activities);
      }
    } catch (err: any) {
      console.error('Fetch activities error:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const currentStyles = styles(theme, isRTL, fontSizes, spacing, borderRadius);

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerLeft}>
          <View style={currentStyles.avatarContainer}>
            <View style={currentStyles.initialsAvatar}>
              <Text style={currentStyles.initialsText}>{getInitials(user?.name || '')}</Text>
            </View>
            <View style={currentStyles.onlineDot} />
          </View>
          <View style={currentStyles.headerGreeting}>
            <Text style={currentStyles.greetingText}>
              {t('home_screen.hi')}, {user?.name?.split(' ')[0] || 'Alex'}! 👋
            </Text>
            <Text style={currentStyles.subGreetingText}>
              {user?.grade?.name || 'Grade'} • {user?.educational_system?.name || 'System'}
            </Text>
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
        bounces={true}
      >
        {/* Top Stats Cards */}
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

        {/* Weekly Performance */}
        <View style={currentStyles.performanceCard}>
          <View style={currentStyles.performanceHeader}>
            <View>
              <Text style={currentStyles.performanceTitle}>{t('home_screen.performance')}</Text>
              <Text style={currentStyles.performanceStatus}>{activitiesData?.performance_status || t('home_screen.excellent')}</Text>
            </View>
            <View style={currentStyles.trendBadge}>
              <Ionicons 
                name={Number.parseFloat(activitiesData?.performance_trend || '0') >= 0 ? "trending-up" : "trending-down"} 
                size={14} 
                color={Number.parseFloat(activitiesData?.performance_trend || '0') >= 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[
                currentStyles.trendText,
                { color: Number.parseFloat(activitiesData?.performance_trend || '0') >= 0 ? "#10B981" : "#EF4444" }
              ]}>
                {activitiesData?.performance_trend || '+0%'}
              </Text>
            </View>
          </View>
          <WeeklyPerformanceChart theme={theme} isRTL={isRTL} data={activitiesData?.weekly_performance || []} />
        </View>

        {/* Quick Actions */}
        <View style={currentStyles.section}>
          <Text style={currentStyles.sectionTitle}>{t('home_screen.quick_actions')}</Text>
          <View style={currentStyles.squaresGrid}>
             <TouchableOpacity 
              style={[currentStyles.squareActionCard, { backgroundColor: '#6366F1' }]}
              onPress={() => navigation.navigate('Quiz')}
            >
              <View style={currentStyles.squarePlayIcon}>
                <Ionicons name="play" size={24} color="#fff" />
              </View>
              <Text style={currentStyles.squareActionTitle}>{t('home_screen.start_quiz')}</Text>
              <Text style={currentStyles.squareActionSubtitle}>{t('home_screen.subject_waiting', { subject: 'Math' })}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={currentStyles.squareActionCard}
              onPress={() => navigation.navigate('Study')}
            >
              <View style={[currentStyles.squareIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="book" size={24} color="#3B82F6" />
              </View>
              <Text style={currentStyles.squareActionTitleBlack}>{t('home_screen.browse_booklets')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={currentStyles.squareActionCard}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <View style={[currentStyles.squareIconContainer, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="stats-chart" size={24} color="#EC4899" />
              </View>
              <Text style={currentStyles.squareActionTitleBlack}>{t('home_screen.my_progress')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={currentStyles.squareActionCard}
              onPress={() => navigation.navigate('More')}
            >
              <View style={[currentStyles.squareIconContainer, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="settings" size={24} color="#F97316" />
              </View>
              <Text style={currentStyles.squareActionTitleBlack}>{t('common.settings')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeaderRow}>
            <Text style={currentStyles.sectionTitle}>{t('home_screen.recent_activity')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={currentStyles.viewAllText}>{t('home_screen.view_all')}</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
             <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : activitiesData?.activities.slice(0, 3).map((activity) => (
            <TouchableOpacity key={activity.id} style={currentStyles.refinedActivityCard}>
              <View style={[currentStyles.activityIconContainer, { backgroundColor: theme.colors.primary100 }]}>
                <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
              </View>
              <View style={currentStyles.refinedActivityInfo}>
                <Text style={currentStyles.refinedActivityName}>{activity.subject.name}</Text>
                <Text style={currentStyles.refinedActivityMeta}>
                  {activity.subject.name} • 2 hrs ago
                </Text>
              </View>
              <View style={currentStyles.refinedActivityRight}>
                <Text style={currentStyles.refinedActivityScore}>{Math.round((activity.score / activity.totalQuestions) * 100)}%</Text>
                <View style={[
                  currentStyles.statusLabel,
                  { backgroundColor: activity.isPassed ? '#ECFDF5' : '#FEF3C7' }
                ]}>
                  <Text style={[
                    currentStyles.statusLabelText,
                    { color: activity.isPassed ? '#10B981' : '#F59E0B' }
                  ]}>
                    {activity.isPassed ? t('home_screen.passed') : t('home_screen.review')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quote Box */}
        <View style={currentStyles.quoteCard}>
          <Text style={currentStyles.quoteText}>
            "Learning is a treasure that will follow its owner everywhere."
          </Text>
          <Text style={currentStyles.quoteAuthor}>- CHINESE PROVERB</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, isRTL: boolean, fontSizes: any, spacing: any, borderRadius: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: theme.colors.primary,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
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
  initialsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  headerGreeting: {
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreetingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: theme.colors.background,
  },
  topStatsRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 15,
  },
  topStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  performanceHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  performanceStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  trendText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 4,
  },
  chartContainer: {
    height: 120,
    justifyContent: 'center',
    paddingTop: 10,
  },
  chartWrapper: {
    height: 80,
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  squaresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  squareActionCard: {
    width: (width - 52) / 2,
    height: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  squareIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squarePlayIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  squareActionTitleBlack: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  squareActionSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  refinedActivityCard: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refinedActivityInfo: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  refinedActivityName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  refinedActivityMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  refinedActivityRight: {
    alignItems: isRTL ? 'flex-start' : 'flex-end',
  },
  refinedActivityScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statusLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quoteCard: {
    backgroundColor: '#9333EA',
    borderRadius: 24,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  quoteText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 1,
  },
});

export default HomeScreen;
