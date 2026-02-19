import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import ScreenHeader from '../components/ScreenHeader';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  grade: { id: string; name: string };
  totalQuizzes: number;
  avgScore: number;
  xp: number;
  isFollowing: boolean;
  rank: number;
}

const LeaderboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [allLeaderboard, setAllLeaderboard] = useState<Student[]>([]);
  const [subjectLeaderboards, setSubjectLeaderboards] = useState<{ [key: string]: Student[] }>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjects.length > 0) fetchLeaderboard('all');
  }, [subjects]);

  useEffect(() => {
    if (selectedTab && subjects.length > 0) fetchLeaderboard(selectedTab);
  }, [selectedTab]);

  useFocusEffect(
    useCallback(() => {
      if (selectedTab && subjects.length > 0) fetchLeaderboard(selectedTab);
    }, [selectedTab, subjects.length]),
  );

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `query SubjectsForUserGrade { subjectsForUserGrade { id name description } }`,
        undefined,
        token,
      );
      if (result.data?.subjectsForUserGrade) setSubjects(result.data.subjectsForUserGrade);
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (tabId: string) => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const subjectId = tabId === 'all' ? null : tabId;
      const result = await tryFetchWithFallback(
        `
        query Leaderboard($subjectId: ID, $limit: Int) {
          leaderboard(subjectId: $subjectId, limit: $limit) {
            id name grade { id name } totalQuizzes avgScore xp isFollowing rank
          }
        }
      `,
        { subjectId, limit: 10 },
        token,
      );

      if (result.data?.leaderboard) {
        const processed = result.data.leaderboard.map((s: any) => ({
          ...s,
          xp: s.xp || 0,
          isFollowing: !!s.isFollowing,
        }));
        if (tabId === 'all') setAllLeaderboard(processed);
        else setSubjectLeaderboards((prev) => ({ ...prev, [tabId]: processed }));
      } else {
        setLeaderboardError(t('leaderboard_screen.error_loading_leaderboard'));
      }
    } catch (err: any) {
      setLeaderboardError(t('leaderboard_screen.error_loading_leaderboard'));
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleFollowToggle = async (student: Student) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `mutation FollowUser($userId: ID!) { followUser(userId: $userId) { success isFollowing } }`,
        { userId: student.id },
        token,
      );
      if (result.data?.followUser?.success) {
        const newIsFollowing = result.data.followUser.isFollowing;
        const updater = (list: Student[]) =>
          list.map((s) => (s.id === student.id ? { ...s, isFollowing: newIsFollowing } : s));
        setAllLeaderboard((prev) => updater(prev));
        setSubjectLeaderboards((prev) => {
          const updated: any = {};
          Object.keys(prev).forEach((k) => (updated[k] = updater(prev[k])));
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Follow error:', err);
    }
  };

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  const Podium = ({ top3 }: { top3: Student[] }) => {
    // Expected order in top3 array: [Rank 1, Rank 2, Rank 3]
    // Desired visual order: Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)
    const first = top3.find((s) => s.rank === 1);
    const second = top3.find((s) => s.rank === 2);
    const third = top3.find((s) => s.rank === 3);

    return (
      <View style={currentStyles.podiumContainer}>
        {/* Second Place */}
        <View style={[currentStyles.podiumColumn, { marginTop: 40 }]}>
          {second && (
            <>
              <View style={currentStyles.podiumAvatarContainer}>
                <Text style={currentStyles.podiumAvatarText}>
                  {' '}
                  {second.name.charAt(0).toUpperCase()}{' '}
                </Text>
                <View style={[currentStyles.podiumBadge, { backgroundColor: '#C0C0C0' }]}>
                  <Text style={currentStyles.podiumBadgeText}> 2 </Text>
                </View>
              </View>
              <Text style={currentStyles.podiumName} numberOfLines={1}>
                {' '}
                {second.name}{' '}
              </Text>
              <Text style={currentStyles.podiumXP}> {second.xp} XP </Text>
            </>
          )}
          {!second && <View style={{ height: 100 }} />}
        </View>

        {/* First Place */}
        <View style={currentStyles.podiumColumn}>
          {first && (
            <>
              <View style={currentStyles.podiumCrown}>
                <Ionicons name="trophy" size={32} color="#F59E0B" />
              </View>
              <View style={[currentStyles.podiumAvatarContainer, currentStyles.podiumAvatarFirst]}>
                <Text style={currentStyles.podiumAvatarTextLarge}>
                  {' '}
                  {first.name.charAt(0).toUpperCase()}{' '}
                </Text>
                <View style={[currentStyles.podiumBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={currentStyles.podiumBadgeText}> 1 </Text>
                </View>
              </View>
              <Text style={[currentStyles.podiumName, { fontWeight: 'bold' }]} numberOfLines={1}>
                {' '}
                {first.name}{' '}
              </Text>
              <Text style={currentStyles.podiumXP}> {first.xp} XP </Text>
            </>
          )}
          {!first && <View style={{ height: 120 }} />}
        </View>

        {/* Third Place */}
        <View style={[currentStyles.podiumColumn, { marginTop: 60 }]}>
          {third && (
            <>
              <View style={currentStyles.podiumAvatarContainer}>
                <Text style={currentStyles.podiumAvatarText}>
                  {' '}
                  {third.name.charAt(0).toUpperCase()}{' '}
                </Text>
                <View style={[currentStyles.podiumBadge, { backgroundColor: '#CD7F32' }]}>
                  <Text style={currentStyles.podiumBadgeText}> 3 </Text>
                </View>
              </View>
              <Text style={currentStyles.podiumName} numberOfLines={1}>
                {' '}
                {third.name}{' '}
              </Text>
              <Text style={currentStyles.podiumXP}> {third.xp} XP </Text>
            </>
          )}
          {!third && <View style={{ height: 80 }} />}
        </View>
      </View>
    );
  };

  const renderLeaderboardContent = () => {
    if (leaderboardLoading)
      return (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>
            {t('leaderboard_screen.loading_leaderboard')}
          </Text>
        </View>
      );

    if (leaderboardError)
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={currentStyles.emptyStateTitle}>
            {t('leaderboard_screen.error_loading_leaderboard')}
          </Text>
          <TouchableOpacity
            style={currentStyles.retryButton}
            onPress={() => fetchLeaderboard(selectedTab)}
          >
            <Text style={currentStyles.retryButtonText}> {t('home_screen.try_again')} </Text>
          </TouchableOpacity>
        </View>
      );

    const leaderboard =
      selectedTab === 'all' ? allLeaderboard : subjectLeaderboards[selectedTab] || [];

    if (leaderboard.length === 0)
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="trophy-outline" size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
          <Text style={currentStyles.emptyStateTitle}>
            {t('leaderboard_screen.no_rankings_yet')}
          </Text>
        </View>
      );

    const top3 = leaderboard.filter((s) => s.rank <= 3);
    const rest = leaderboard.filter((s) => s.rank > 3);

    return (
      <>
        {top3.length > 0 && <Podium top3={top3} />}

        <View style={currentStyles.listContainer}>
          {rest.map((student) => (
            <View key={student.id} style={currentStyles.rankCard}>
              <View style={currentStyles.studentCardContent}>
                <View style={currentStyles.studentLeft}>
                  <Text style={currentStyles.rankNumber}> {student.rank} </Text>
                  <View style={currentStyles.avatarPlaceholderSmall}>
                    <Text style={currentStyles.avatarTextSmall}>
                      {' '}
                      {student.name.charAt(0).toUpperCase()}{' '}
                    </Text>
                  </View>
                  <View style={currentStyles.studentDetails}>
                    <Text style={currentStyles.studentName}> {student.name} </Text>
                    <Text style={currentStyles.studentStatXP}> {student.xp} XP </Text>
                  </View>
                </View>
                {student.id !== user?.id && (
                  <TouchableOpacity
                    style={[
                      currentStyles.followButton,
                      student.isFollowing && currentStyles.followButtonFollowing,
                    ]}
                    onPress={() => handleFollowToggle(student)}
                  >
                    <Text
                      style={[
                        currentStyles.followButtonText,
                        student.isFollowing && currentStyles.followButtonTextFollowing,
                      ]}
                    >
                      {student.isFollowing ? t('common.following') : t('common.follow')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <View style={common.container}>
      <ScreenHeader
        title={t('leaderboard_screen.header_title')}
        subtitle={t('leaderboard_screen.header_subtitle')}
        rightAction={
          <TouchableOpacity
            style={currentStyles.refreshButton}
            onPress={() => fetchLeaderboard(selectedTab)}
          >
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={currentStyles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={currentStyles.tabBarContent}
        >
          <TouchableOpacity
            style={[currentStyles.tab, selectedTab === 'all' && currentStyles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text
              style={[
                currentStyles.tabText,
                selectedTab === 'all' ? currentStyles.tabTextActive : currentStyles.tabTextInactive,
              ]}
            >
              {t('common.all')}
            </Text>
          </TouchableOpacity>
          {subjects.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[currentStyles.tab, selectedTab === s.id && currentStyles.tabActive]}
              onPress={() => setSelectedTab(s.id)}
            >
              <Text
                style={[
                  currentStyles.tabText,
                  selectedTab === s.id
                    ? currentStyles.tabTextActive
                    : currentStyles.tabTextInactive,
                ]}
              >
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={currentStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={currentStyles.contentContainer}
      >
        <View style={currentStyles.leaderboardContainer}>{renderLeaderboardContent()}</View>
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabBarContainer: { paddingVertical: spacing.md, backgroundColor: theme.colors.background },
    tabBarContent: { paddingHorizontal: layout.screenPadding, flexDirection: common.rowDirection },
    tab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      ...common.marginEnd(10),
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { fontSize: fontSizes.sm, fontWeight: '700' },
    tabTextActive: { color: '#fff' },
    tabTextInactive: { color: theme.colors.textSecondary },
    content: { flex: 1 },
    contentContainer: { paddingBottom: 100 },
    leaderboardContainer: { paddingBottom: spacing.xl * 2 },

    // Podium Styles
    podiumContainer: {
      flexDirection: common.rowDirection,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingVertical: 30,
      marginBottom: 20,
    },
    podiumColumn: {
      alignItems: 'center',
      width: '30%',
    },
    podiumCrown: {
      marginBottom: -10,
      zIndex: 10,
    },
    podiumAvatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.card,
      borderWidth: 3,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    podiumAvatarFirst: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderColor: '#F59E0B',
      borderWidth: 4,
    },
    podiumAvatarText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    podiumAvatarTextLarge: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    podiumBadge: {
      position: 'absolute',
      bottom: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    podiumBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    podiumName: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    podiumXP: {
      fontSize: fontSizes.xs,
      color: theme.colors.primary,
      fontWeight: '700',
    },

    // List Styles
    listContainer: {
      paddingHorizontal: layout.screenPadding,
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingTop: 24,
      marginTop: -10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 5,
    },
    rankCard: {
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 16,
    },
    studentCardContent: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    studentLeft: { flexDirection: common.rowDirection, alignItems: 'center', flex: 1 },
    rankNumber: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      width: 30,
      textAlign: 'center',
      ...common.marginEnd(12),
    },
    avatarPlaceholderSmall: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(12),
    },
    avatarTextSmall: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    studentDetails: { flex: 1, alignItems: common.alignStart },
    studentName: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    studentStatXP: { fontSize: fontSizes.xs, fontWeight: 'bold', color: theme.colors.primary },

    // Follow Button
    followButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
      ...common.marginStart(8),
    },
    followButtonFollowing: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    followButtonText: { fontSize: fontSizes.xs, fontWeight: 'bold', color: '#fff' },
    followButtonTextFollowing: { color: theme.colors.textSecondary },

    // States
    loadingText: {
      marginTop: spacing.lg,
      fontSize: fontSizes.sm,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyState: {
      padding: 60,
      alignItems: 'center',
    },
    emptyStateTitle: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      marginBottom: spacing.sm,
      color: theme.colors.text,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: { color: '#fff', fontSize: fontSizes.sm, fontWeight: 'bold' },
  });

export default LeaderboardScreen;
