import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
import { GenericListSkeleton } from '../components/SkeletonLoader';
import RetryView from '../components/RetryView';
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
  const { typography, fontWeight } = useTypography();
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

  const lastFetchRef = React.useRef<number>(0);
  const STALE_MS = 30_000;

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current < STALE_MS && allLeaderboard.entries.length > 0) return;
      lastFetchRef.current = now;
      if (selectedTab && subjects.length > 0) fetchLeaderboard(selectedTab);
    }, [selectedTab, subjects.length, allLeaderboard]),
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

  const currentStyles = useMemo(
    () => styles(theme, common, fontSizes, spacing, borderRadius, typography, fontWeight),
    [theme, common, fontSizes, spacing, borderRadius, typography, fontWeight],
  );

  const Podium = ({ top3 }: { top3: Student[] }) => {
    const first = top3.find((s) => s.rank === 1);
    const second = top3.find((s) => s.rank === 2);
    const third = top3.find((s) => s.rank === 3);

    const renderPodiumStudent = (student: Student | undefined, rank: 1 | 2 | 3) => {
      const name = student
        ? student.name
        : t('leaderboard_screen.no_student_yet', { defaultValue: 'No Student' });
      const points = student ? `${student.xp.toLocaleString()} XP` : `- XP`;
      const avatarUri = student
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=200`
        : `https://ui-avatars.com/api/?name=%3F&background=E2E8F0&color=475569&size=200`;

      const isFirst = rank === 1;
      const isSecond = rank === 2;

      const avatarSizeStyle = isFirst
        ? currentStyles.podiumAvatarLarge
        : currentStyles.podiumAvatarNormal;
      const borderStyle = isFirst
        ? currentStyles.borderGold
        : isSecond
          ? currentStyles.borderSilver
          : currentStyles.borderBronze;
      const badgeBgStyle = isFirst
        ? currentStyles.bgGold
        : isSecond
          ? currentStyles.bgSilver
          : currentStyles.bgBronze;
      const badgeTextStyle = isFirst
        ? currentStyles.textWhite
        : isSecond
          ? currentStyles.textSlate800
          : currentStyles.textAmber900;
      const rankLabel = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
      const blockStyle = isFirst
        ? currentStyles.blockFirst
        : isSecond
          ? currentStyles.blockSecond
          : currentStyles.blockThird;

      return (
        <View style={currentStyles.podiumColumn} key={rank}>
          <View style={currentStyles.podiumAvatarContainer}>
            {isFirst && (
              <View style={currentStyles.crownIconContainer}>
                <MaterialIcons name="workspace-premium" size={32} color="#EAB308" />
              </View>
            )}
            <View style={[currentStyles.podiumAvatar, avatarSizeStyle, borderStyle]}>
              <Image source={{ uri: avatarUri }} style={currentStyles.avatarImage} />
            </View>
            <View style={[currentStyles.podiumBadge, badgeBgStyle]}>
              <Text style={[currentStyles.podiumBadgeText, badgeTextStyle]}>{rankLabel}</Text>
            </View>
          </View>
          <Text style={currentStyles.podiumNameText} numberOfLines={1}>
            {name}
          </Text>
          <Text style={currentStyles.podiumPointsText}>{points}</Text>
          <View style={[currentStyles.podiumBlock, blockStyle]}>
            <MaterialIcons
              name={isFirst ? 'military-tech' : 'bar-chart'}
              size={isFirst ? 48 : 24}
              color={isFirst ? theme.colors.primary + '99' : theme.colors.primary + '66'}
              style={isFirst ? { transform: [{ scale: 1.1 }] } : {}}
            />
          </View>
        </View>
      );
    };

    return (
      <View style={currentStyles.podiumWrapper}>
        {renderPodiumStudent(second, 2)}
        {renderPodiumStudent(first, 1)}
        {renderPodiumStudent(third, 3)}
      </View>
    );
  };

  const renderLeaderboardContent = () => {
    if (leaderboardLoading)
      return (
        <View style={{ paddingTop: 16 }}>
          <GenericListSkeleton numItems={6} />
        </View>
      );

    if (leaderboardError)
      return (
        <RetryView
          message={leaderboardError}
          onRetry={() => fetchLeaderboard(selectedTab)}
        />
      );

    const leaderboard =
      selectedTab === 'all'
        ? allLeaderboard
        : subjectLeaderboards[selectedTab] || { entries: [], userEntry: null };

    if (leaderboard.entries.length === 0)
      return (
        <View style={currentStyles.stateContainer}>
          <Ionicons
            name="trophy-outline"
            size={spacing.icon.xl}
            color={theme.colors.textTertiary}
            style={{ opacity: 0.5 }}
          />
          <Text style={currentStyles.stateTitle}>
            {t('leaderboard_screen.no_rankings_yet', { defaultValue: 'No rankings yet.' })}
          </Text>
        </View>
      );

    const top3 = leaderboard.entries.filter((s) => s.rank <= 3);
    const rest = leaderboard.entries.filter((s) => s.rank > 3);

    // Ensure userEntry is in the list if they are ranked but not returned in the limit
    const isUserInList = leaderboard.entries.some((s) => s.id === leaderboard.userEntry?.id);
    if (!isUserInList && leaderboard.userEntry && leaderboard.userEntry.rank > 3) {
      rest.push(leaderboard.userEntry);
      rest.sort((a, b) => a.rank - b.rank);
    }

    return (
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={currentStyles.leaderboardContentContainer}
        ListHeaderComponent={
          <View style={{ paddingTop: 30 }}>
            <Podium top3={top3} />
          </View>
        }
        renderItem={({ item }) => {
          const isCurrentUser = leaderboard.userEntry?.id === item.id;
          const avatarUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=E2E8F0&color=475569&size=100`;

          if (isCurrentUser) {
            return (
              <View style={currentStyles.currentUserCard}>
                <View style={currentStyles.currentUserLeft}>
                  <Text style={currentStyles.currentUserRankBadge}>{item.rank}</Text>
                  <View style={currentStyles.currentUserAvatarContainer}>
                    <Image source={{ uri: avatarUri }} style={currentStyles.avatarImage} />
                  </View>
                  <View style={currentStyles.currentUserInfo}>
                    <Text style={currentStyles.currentUserName} numberOfLines={1}>
                      {t('leaderboard_screen.you', { defaultValue: 'You' })} ({item.name})
                    </Text>
                    <Text style={currentStyles.currentUserSub}>
                      {t('leaderboard_screen.current_rank', {
                        defaultValue: 'Current Rank',
                      }).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={currentStyles.currentUserPoints}>{item.xp.toLocaleString()} XP</Text>
              </View>
            );
          }

          return (
            <View style={currentStyles.listItemCard}>
              <View style={currentStyles.listItemLeft}>
                <Text style={currentStyles.listItemRankText}>{item.rank}</Text>
                <View style={currentStyles.listItemAvatar}>
                  <Image source={{ uri: avatarUri }} style={currentStyles.avatarImage} />
                </View>
                <Text style={currentStyles.listItemNameText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <Text style={currentStyles.listItemPointsText}>{item.xp.toLocaleString()} XP</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          rest.length === 0 ? (
            <View style={[currentStyles.stateContainer, { marginTop: spacing.xl }]}>
              <Text style={{ ...typography('caption'), color: theme.colors.textSecondary }}>
                {t('leaderboard_screen.no_more_students', { defaultValue: 'No more students' })}
              </Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <View style={common.container}>
      <UnifiedHeader
        title={t('leaderboard_screen.header_title', { defaultValue: 'Leaderboard' })}
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
        <View style={currentStyles.tabBarWrapper}>
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
                  selectedTab === 'all'
                    ? currentStyles.tabTextActive
                    : currentStyles.tabTextInactive,
                ]}
              >
                {t('leaderboard_screen.all_time', { defaultValue: 'All Time' })}
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
      </View>

      <View style={currentStyles.content}>{renderLeaderboardContent()}</View>
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
    unifiedHeaderExtended: {
      borderBottomLeftRadius: borderRadius.xl,
      borderBottomRightRadius: borderRadius.xl,
      ...layout.shadow,
    },
    tabBarContainer: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    tabBarWrapper: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      padding: 4,
      ...layout.shadow,
    },
    tabBarContent: { flexGrow: 1, flexDirection: common.rowDirection },
    tab: {
      flex: 1,
      minWidth: 80,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
    },
    tabActive: { backgroundColor: theme.colors.primary, ...layout.shadow },
    tabText: { ...typography('label'), ...fontWeight('600') },
    tabTextActive: { color: theme.colors.textOnDark },
    tabTextInactive: { color: theme.colors.textSecondary },
    content: { flex: 1 },
    leaderboardContentContainer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(common.insets.bottom, spacing.xl),
    },

    // Podium Styles
    podiumWrapper: {
      flexDirection: common.rowDirection,
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingBottom: spacing.lg,
      marginTop: spacing.xxl,
    },
    podiumColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    podiumAvatarContainer: {
      position: 'relative',
      marginBottom: spacing.sm,
      alignItems: 'center',
    },
    crownIconContainer: {
      position: 'absolute',
      top: -24,
      alignSelf: 'center',
      zIndex: 10,
    },
    podiumAvatar: {
      borderRadius: 999,
      borderWidth: 4,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      ...layout.shadow,
    },
    podiumAvatarNormal: { width: 64, height: 64 },
    podiumAvatarLarge: { width: 96, height: 96 },
    avatarImage: { width: '100%', height: '100%' },
    borderGold: { borderColor: '#FBBF24' },
    borderSilver: { borderColor: '#CBD5E1' },
    borderBronze: { borderColor: 'rgba(217, 119, 6, 0.4)' },
    podiumBadge: {
      position: 'absolute',
      bottom: -10,
      alignSelf: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      minWidth: 36,
      alignItems: 'center',
      justifyContent: 'center',
      ...layout.shadow,
    },
    bgGold: { backgroundColor: '#FBBF24' },
    bgSilver: { backgroundColor: '#CBD5E1' },
    bgBronze: { backgroundColor: 'rgba(217, 119, 6, 0.4)' },
    textWhite: { color: '#FFFFFF' },
    textSlate800: { color: '#1E293B' },
    textAmber900: { color: '#78350F' },
    podiumBadgeText: { fontSize: 10, ...fontWeight('bold') },
    podiumNameText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'center',
      width: '100%',
    },
    podiumPointsText: {
      fontSize: 10,
      ...fontWeight('bold'),
      color: theme.colors.primary,
      textAlign: 'center',
    },
    podiumBlock: {
      width: '100%',
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      marginTop: spacing.sm,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: spacing.sm,
    },
    blockFirst: { height: 128, backgroundColor: theme.colors.primary + '4D' },
    blockSecond: { height: 80, backgroundColor: theme.colors.primary + '26' },
    blockThird: { height: 64, backgroundColor: theme.colors.primary + '0D' },

    // List Styles
    listItemCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      ...layout.shadow,
    },
    listItemLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      flex: 1,
    },
    listItemRankText: {
      width: 28,
      textAlign: 'center',
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
    },
    listItemAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      marginHorizontal: spacing.md,
      ...layout.shadow,
    },
    listItemNameText: {
      flex: 1,
      ...typography('caption'),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    listItemPointsText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },

    // Current User Card
    currentUserCard: {
      backgroundColor: theme.colors.primary + '1A',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      ...layout.shadow,
    },
    currentUserLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      flex: 1,
    },
    currentUserRankBadge: {
      width: 28,
      textAlign: 'center',
      ...typography('body'),
      ...fontWeight('black'),
      color: theme.colors.primary,
    },
    currentUserAvatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      marginHorizontal: spacing.md,
    },
    currentUserInfo: {
      flex: 1,
    },
    currentUserName: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
      textAlign: common.textAlign,
    },
    currentUserSub: {
      fontSize: 10,
      ...fontWeight('bold'),
      color: theme.colors.primary + 'B3',
      letterSpacing: 0.5,
      textAlign: common.textAlign,
    },
    currentUserPoints: {
      ...typography('body'),
      ...fontWeight('black'),
      color: theme.colors.primary,
    },

    // Global States
    stateContainer: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xxl,
    },
    stateText: {
      marginTop: spacing.md,
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    stateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      color: theme.colors.text,
      textAlign: 'center',
    },
  });

export default LeaderboardScreen;
