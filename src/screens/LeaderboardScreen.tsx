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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
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
  const { typography, fontWeight} = useTypography();
  const navigation = useNavigation<any>();

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

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, typography, fontWeight);

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
            <Text style={currentStyles.userStatusName} numberOfLines={1}>
              {userEntry.name}
            </Text>
            <Text style={currentStyles.userStatusPoints}>
              {userEntry.xp.toLocaleString()} {t('leaderboard_screen.points')}
            </Text>
          </View>
        </View>
        <View style={currentStyles.userStatusSeparator} />
        <Text style={currentStyles.userStatusFooter}>
          {t('leaderboard_screen.your_rank')}: #{userEntry.rank}
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
      const points = student
        ? `${student.xp.toLocaleString()} ${t('leaderboard_screen.points')}`
        : `- ${t('leaderboard_screen.points')}`;
      const avatarUri = student
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=128`
        : `https://ui-avatars.com/api/?name=%3F&background=E2E8F0&color=475569&size=128`;

      return (
        <View style={[currentStyles.podiumStudentOverlay, style]}>
          <View style={[currentStyles.podiumAvatar, rank === 1 && currentStyles.podiumAvatarLarge]}>
            <Image source={{ uri: avatarUri }} style={currentStyles.avatarImage} />
          </View>
          <Text style={currentStyles.podiumNameText} numberOfLines={1}>
            {name}
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
          <Ionicons name="alert-circle-outline" size={spacing.icon.xl} color={theme.colors.error} />
          <Text style={currentStyles.emptyStateTitle}>
            {t('leaderboard_screen.error_loading_leaderboard')}
          </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={() => fetchLeaderboard(selectedTab)}
            size="sm"
            fullWidth={false}
          />
        </View>
      );

    const leaderboard =
      selectedTab === 'all'
        ? allLeaderboard
        : subjectLeaderboards[selectedTab] || { entries: [], userEntry: null };

    if (leaderboard.entries.length === 0)
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons
            name="trophy-outline"
            size={spacing.icon.xl}
            color={theme.colors.textTertiary}
            style={{ opacity: 0.5 }}
          />
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
                    {student.name}
                  </Text>
                </View>
                <Text style={currentStyles.listItemPoints}>
                  {' '}
                  {student.xp.toLocaleString()} {t('common.points')}{' '}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[currentStyles.listCard, { alignItems: 'center', paddingVertical: spacing.xl }]}
          >
            <Text style={{ ...typography('caption'), color: theme.colors.textSecondary }}>
              {t('leaderboard_screen.no_more_students')}
            </Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={common.container}>
      <UnifiedHeader
        title={t('leaderboard_screen.header_title')}
        showBackButton={true}
        rightContent={
          <TouchableOpacity
            style={currentStyles.refreshButton}
            onPress={() => fetchLeaderboard(selectedTab)}
          >
            <Ionicons
              name="refresh-outline"
              size={spacing.icon.md}
              color={theme.colors.headerText}
            />
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
  fontWeight: any,
) =>
  StyleSheet.create({
    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.headerText + '26',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabBarContainer: { paddingVertical: spacing.md, backgroundColor: theme.colors.background },
    tabBarContent: { paddingHorizontal: layout.screenPadding, flexDirection: common.rowDirection },
    tab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      ...common.marginEnd(spacing.xs),
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { ...typography('label'), ...fontWeight('700') },
    tabTextActive: { color: theme.colors.textOnDark },
    tabTextInactive: { color: theme.colors.textSecondary },
    content: { flex: 1 },
    contentContainer: { paddingBottom: Math.max(common.insets.bottom, spacing.xl) },
    leaderboardContainer: { paddingHorizontal: layout.screenPadding },

    userStatusCard: {
      backgroundColor: theme.colors.primary + '1A', // Using 10% opacity of primary
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33', // 20% opacity
      ...layout.shadow,
    },
    userStatusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userStatusRankBadge: {
      backgroundColor: theme.colors.orange,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.md,
      ...common.marginEnd(spacing.md),
    },
    userStatusRankText: {
      color: theme.colors.textOnDark,
      ...fontWeight('bold'),
      ...typography('h3'),
    },
    userStatusAvatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    userStatusAvatarText: {
      color: theme.colors.textOnDark,
      ...typography('h2'),
      ...fontWeight('600')
    },
    userStatusInfo: {
      flex: 1,
    },
    userStatusName: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    userStatusPoints: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
    },
    userStatusSeparator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: spacing.md,
    },
    userStatusFooter: {
      textAlign: 'center',
      ...fontWeight('bold'),
      color: theme.colors.text,
      ...typography('label'),
    },

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
      borderColor: theme.colors.orange,
      overflow: 'hidden',
      marginBottom: spacing.xs,
      backgroundColor: theme.colors.surface,
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
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    podiumPointsText: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    listCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
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
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
    },
    listItemAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      ...common.marginEnd(spacing.md),
    },
    avatarImageSmall: {
      width: '100%',
      height: '100%',
    },
    listItemName: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      flex: 1,
      textAlign: common.textAlign,
    },
    listItemPoints: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
    },

    loadingText: {
      marginTop: spacing.md,
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyStateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      color: theme.colors.text,
      textAlign: 'center',
    },
  });

export default LeaderboardScreen;
