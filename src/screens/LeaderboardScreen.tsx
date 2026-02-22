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
import { useTypography } from '../hooks/useTypography';
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

const podiumBg = require('../../assets/leaderboard-bg.png');

const LeaderboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [allLeaderboard, setAllLeaderboard] = useState<{
    entries: Student[];
    userEntry: Student | null;
  }>({ entries: [], userEntry: null });
  const [subjectLeaderboards, setSubjectLeaderboards] = useState<{
    [key: string]: { entries: Student[]; userEntry: Student | null };
  }>({});

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
            entries {
              id name grade { id name } totalQuizzes avgScore xp isFollowing rank
            }
            userEntry {
              id name grade { id name } totalQuizzes avgScore xp isFollowing rank
            }
          }
        }
      `,
        { subjectId, limit: 10 },
        token,
      );

      if (result.data?.leaderboard) {
        const { entries, userEntry } = result.data.leaderboard;
        const processedEntries = entries.map((s: any) => ({
          ...s,
          xp: s.xp || 0,
          isFollowing: !!s.isFollowing,
        }));
        const processedUserEntry = userEntry
          ? {
              ...userEntry,
              xp: userEntry.xp || 0,
              isFollowing: !!userEntry.isFollowing,
            }
          : null;

        const resultData = { entries: processedEntries, userEntry: processedUserEntry };

        if (tabId === 'all') setAllLeaderboard(resultData);
        else setSubjectLeaderboards((prev) => ({ ...prev, [tabId]: resultData }));
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
        const updater = (data: { entries: Student[]; userEntry: Student | null }) => ({
          entries: data.entries.map((s) =>
            s.id === student.id ? { ...s, isFollowing: newIsFollowing } : s,
          ),
          userEntry:
            data.userEntry?.id === student.id
              ? { ...data.userEntry, isFollowing: newIsFollowing }
              : data.userEntry,
        });

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

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, typography);

  const renderCurrentUserCard = (userEntry: Student | null) => {
    if (!userEntry) return null;
    return (
      <View style={currentStyles.userStatusCard}>
        <View style={currentStyles.userStatusHeader}>
          <View style={currentStyles.userStatusRankBadge}>
            <Text style={currentStyles.userStatusRankText}>#{userEntry.rank} </Text>
          </View>
          <View style={currentStyles.userStatusAvatarContainer}>
            <Text style={currentStyles.userStatusAvatarText}>
              {userEntry.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={currentStyles.userStatusInfo}>
            <Text style={currentStyles.userStatusName}> {userEntry.name} </Text>
            <Text style={currentStyles.userStatusPoints}>
              {userEntry.xp.toLocaleString()} {t('common.points', 'points')}
            </Text>
          </View>
        </View>
        <View style={currentStyles.userStatusSeparator} />
        <Text style={currentStyles.userStatusFooter}>
          {t('leaderboard.your_rank', 'Your Rank')}: #{userEntry.rank}
        </Text>
      </View>
    );
  };

  const Podium = ({ top3 }: { top3: Student[] }) => {
    const first = top3.find((s) => s.rank === 1);
    const second = top3.find((s) => s.rank === 2);
    const third = top3.find((s) => s.rank === 3);

    const PodiumStudent = ({ student, rank, style }: any) => {
      const name = student ? student.name : t('leaderboard_screen.no_student_yet');
      const points = student ? `${student.xp.toLocaleString()} pts` : '- pts';
      const avatarUri = student
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=128`
        : `https://ui-avatars.com/api/?name=%3F&background=E2E8F0&color=475569&size=128`;

      return (
        <View style={[currentStyles.podiumStudentOverlay, style]}>
          <View style={[currentStyles.podiumAvatar, rank === 1 && currentStyles.podiumAvatarLarge]}>
            <Image source={{ uri: avatarUri }} style={currentStyles.avatarImage} />
          </View>
          <Text style={currentStyles.podiumNameText} numberOfLines={1}>
            {' '}
            {name}{' '}
          </Text>
          <Text style={currentStyles.podiumPointsText}> {points} </Text>
        </View>
      );
    };

    return (
      <View style={currentStyles.podiumWrapper}>
        <Image source={podiumBg} style={currentStyles.podiumBackgroundImage} resizeMode="contain" />
        <PodiumStudent student={second} rank={2} style={currentStyles.podiumPosSecond} />
        <PodiumStudent student={first} rank={1} style={currentStyles.podiumPosFirst} />
        <PodiumStudent student={third} rank={3} style={currentStyles.podiumPosThird} />
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
      selectedTab === 'all'
        ? allLeaderboard
        : subjectLeaderboards[selectedTab] || { entries: [], userEntry: null };

    if (leaderboard.entries.length === 0)
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="trophy-outline" size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
          <Text style={currentStyles.emptyStateTitle}>
            {t('leaderboard_screen.no_rankings_yet')}
          </Text>
        </View>
      );

    const top3 = leaderboard.entries.filter((s) => s.rank <= 3);
    const rest = leaderboard.entries.filter((s) => s.rank > 3);

    return (
      <>
        {renderCurrentUserCard(leaderboard.userEntry)}
        <Podium top3={top3} />

        {rest.length > 0 ? (
          <View style={currentStyles.listCard}>
            {rest.map((student, index) => (
              <View
                key={student.id}
                style={[
                  currentStyles.listItem,
                  index === rest.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={currentStyles.listItemLeft}>
                  <Text style={currentStyles.listItemRank}>#{student.rank} </Text>
                  <View style={currentStyles.listItemAvatar}>
                    <Image
                      source={{
                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=E2E8F0&color=475569&size=64`,
                      }}
                      style={currentStyles.avatarImageSmall}
                    />
                  </View>
                  <Text style={currentStyles.listItemName} numberOfLines={1}>
                    {' '}
                    {student.name}{' '}
                  </Text>
                </View>
                <Text style={currentStyles.listItemPoints}> {student.xp.toLocaleString()} pts</Text>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[currentStyles.listCard, { alignItems: 'center', paddingVertical: spacing.xl }]}
          >
            <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>
              {t('leaderboard_screen.no_more_students')}
            </Text>
          </View>
        )}
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
        <View style={currentStyles.leaderboardContainer}> {renderLeaderboardContent()} </View>
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
  typography: any,
) =>
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
    tabText: { ...typography('label'), fontWeight: '700' },
    tabTextActive: { color: '#fff' },
    tabTextInactive: { color: theme.colors.textSecondary },
    content: { flex: 1 },
    contentContainer: { paddingBottom: 100 },
    leaderboardContainer: { padding: spacing.md },

    // User Status Card
    userStatusCard: {
      backgroundColor: theme.colors.primary100,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    userStatusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userStatusRankBadge: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      marginRight: spacing.md,
    },
    userStatusRankText: {
      color: '#fff',
      fontWeight: 'bold',
      ...typography('h3'),
    },
    userStatusAvatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.orange,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    userStatusAvatarText: {
      color: '#fff',
      ...typography('h2'),
      fontWeight: '600',
    },
    userStatusInfo: {
      flex: 1,
    },
    userStatusName: {
      ...typography('h3'),
      fontWeight: 'bold',
      color: theme.colors.navy,
    },
    userStatusPoints: {
      ...typography('caption'),
      color: theme.colors.mediumGray,
    },
    userStatusSeparator: {
      height: 1,
      backgroundColor: theme.colors.lightGray,
      marginVertical: spacing.md,
    },
    userStatusFooter: {
      textAlign: 'center',
      fontWeight: 'bold',
      color: theme.colors.navy,
      ...typography('label'),
    },

    // Podium Styles
    podiumWrapper: {
      position: 'relative',
      width: '100%',
      height: 300,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    podiumBackgroundImage: {
      width: '100%',
      height: '75%',
      position: 'absolute',
      bottom: 0,
    },
    podiumStudentOverlay: {
      position: 'absolute',
      alignItems: 'center',
      width: 100,
    },
    podiumPosFirst: {
      top: 0,
      zIndex: 10,
    },
    podiumPosSecond: {
      top: 45,
      left: 15,
    },
    podiumPosThird: {
      top: 65,
      right: 15,
    },
    podiumAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: theme.colors.secondary,
      overflow: 'hidden',
      marginBottom: spacing.xs,
      backgroundColor: '#fff',
    },
    podiumAvatarLarge: {
      width: 76,
      height: 76,
      borderRadius: 38,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    podiumNameText: {
      fontWeight: 'bold',
      ...typography('caption'),
      color: theme.colors.navy,
      textAlign: 'center',
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    podiumPointsText: {
      ...typography('caption'),
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.mediumGray,
      paddingHorizontal: 4,
      borderRadius: 4,
    },

    // List Styles
    listCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    listItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    listItemRank: {
      width: 40,
      ...typography('body'),
      fontWeight: '600',
      color: theme.colors.mediumGray,
    },
    listItemAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      marginRight: spacing.md,
    },
    avatarImageSmall: {
      width: '100%',
      height: '100%',
    },
    listItemName: {
      ...typography('body'),
      fontWeight: '600',
      color: theme.colors.navy,
      flex: 1,
    },
    listItemPoints: {
      ...typography('body'),
      fontWeight: '600',
      color: theme.colors.navy,
    },

    // States
    loadingText: {
      marginTop: spacing.lg,
      ...typography('caption'),
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
      ...typography('h3'),
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
    retryButtonText: { color: '#fff', ...typography('button'), fontWeight: 'bold' },
  });

export default LeaderboardScreen;
