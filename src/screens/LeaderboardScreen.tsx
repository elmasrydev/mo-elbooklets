import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';

import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import RetryView from '../components/RetryView';
import Confetti from '../components/Confetti';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { analytics } from '../lib/analytics';

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

// Medal colours (intentionally literal — podium semantics, not theme surfaces).
const GOLD = '#f59e0b';
const GOLD_2 = '#fbbf24';
const SILVER = '#94a3b8';
const BRONZE = '#c28045';
// Dark gradient for the "Your Ranking" banner (matches the badge hero card).
const BANNER_GRADIENT = ['#003B7A', '#004A9A', '#1E54B8'] as const;
const ON_DARK = '#ffffff';
const ON_DARK_DIM = 'rgba(255,255,255,0.72)';
// On-brand avatar palette (no purple / pink / neon).
const AVATAR_PALETTE = [
  '#004A9A',
  '#1E54B8',
  '#2563eb',
  '#0d9488',
  '#16a34a',
  '#d97706',
  '#0e7490',
];
const colorFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};
const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

// Score progress bar — width grows on the UI thread (cheap), instant under reduce-motion.
const AnimatedBar = ({ pct, color, styles: s }: { pct: number; color: string; styles: any }) => {
  const reduceMotion = useReducedMotion();
  const w = useSharedValue(reduceMotion ? pct : 0);
  useEffect(() => {
    w.value = reduceMotion
      ? pct
      : withDelay(120, withTiming(pct, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [pct, reduceMotion, w]);
  const animatedStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={s.track}>
      <Animated.View style={[s.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
};

const Pill = ({
  label,
  active,
  onPress,
  styles: s,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: any;
}) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[s.pill, active && s.pillActive]}>
    <Text style={[s.pillText, active && s.pillTextActive]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const LeaderboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [allLeaderboard, setAllLeaderboard] = useState<{
    entries: Student[];
    userEntry: Student | null;
  }>({ entries: [], userEntry: null });
  const [subjectLeaderboards, setSubjectLeaderboards] = useState<{
    [key: string]: { entries: Student[]; userEntry: Student | null };
  }>({});

  // Confetti plays once per screen visit, the first time a podium is shown.
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiPlayed = useRef(false);

  useEffect(() => {
    fetchSubjects();
    analytics.trackLeaderboardViewed();
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
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `query SubjectsForUserGrade { subjectsForUserGrade { id name description } }`,
        undefined,
        token,
      );
      if (result.data?.subjectsForUserGrade) setSubjects(result.data.subjectsForUserGrade);
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
    }
  };

  const fetchLeaderboard = async (tabId: string) => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      const token = await SecureStore.getItemAsync('auth_token');
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
        const processedEntries = entries.map((st: any) => ({
          ...st,
          xp: st.xp || 0,
          isFollowing: !!st.isFollowing,
        }));
        const processedUserEntry = userEntry
          ? { ...userEntry, xp: userEntry.xp || 0, isFollowing: !!userEntry.isFollowing }
          : null;

        const resultData = { entries: processedEntries, userEntry: processedUserEntry };

        if (tabId === 'all') setAllLeaderboard(resultData);
        else setSubjectLeaderboards((prev) => ({ ...prev, [tabId]: resultData }));

        if (!confettiPlayed.current && processedEntries.length > 0) {
          confettiPlayed.current = true;
          setShowConfetti(true);
        }
      } else {
        setLeaderboardError(t('leaderboard_screen.error_loading_leaderboard'));
      }
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const { toggleFollow } = useFollowToggle();

  const handleFollowToggle = async (studentId: string) => {
    const result = await toggleFollow(studentId);
    if (!result?.success) return;
    const updateList = (lb: { entries: Student[]; userEntry: Student | null }) => ({
      ...lb,
      entries: lb.entries.map((st) =>
        st.id === studentId ? { ...st, isFollowing: result.isFollowing } : st,
      ),
    });
    setAllLeaderboard(updateList);
    setSubjectLeaderboards((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((tabId) => {
        next[tabId] = updateList(next[tabId]);
      });
      return next;
    });
  };

  const s = useMemo(
    () => styles(theme, common, spacing, borderRadius, typography, fontWeight),
    [theme, common, spacing, borderRadius, typography, fontWeight],
  );

  const leaderboard =
    selectedTab === 'all'
      ? allLeaderboard
      : subjectLeaderboards[selectedTab] || { entries: [], userEntry: null };

  const subjectLabel =
    selectedTab === 'all'
      ? t('leaderboard_screen.all_subjects', 'All Subjects')
      : subjects.find((x) => x.id === selectedTab)?.name || '';
  const gradeLabel = user?.grade?.name || '';
  const contextLine = [gradeLabel, subjectLabel].filter(Boolean).join(' · ');

  // ---- Avatar ----
  const Avatar = ({
    name,
    size,
    ring,
    fontScale = 0.4,
  }: {
    name: string;
    size: number;
    ring?: string;
    fontScale?: number;
  }) => (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorFor(name),
          alignItems: 'center',
          justifyContent: 'center',
        },
        ring ? { borderWidth: 3, borderColor: ring } : null,
      ]}
    >
      <Text
        style={{ color: '#fff', fontSize: Math.round(size * fontScale), ...fontWeight('bold') }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );

  // ---- Podium spot ----
  const renderSpot = (student: Student | undefined, place: 1 | 2 | 3) => {
    const cfg = {
      1: { av: 66, h: 80, plat: GOLD, platText: '#78350f', ring: GOLD_2, sc: 20 },
      2: { av: 54, h: 60, plat: SILVER, platText: '#334155', ring: SILVER, sc: 16 },
      3: { av: 54, h: 48, plat: BRONZE, platText: '#431407', ring: BRONZE, sc: 16 },
    }[place];
    const entering = FadeInUp.delay(place === 1 ? 60 : 180)
      .duration(450)
      .springify()
      .damping(14);

    if (!student) {
      return (
        <Animated.View entering={entering} style={s.spotCol} key={place}>
          <View style={[s.spotAvatarEmpty, { width: cfg.av, height: cfg.av }]}>
            <Ionicons name="person" size={22} color={theme.colors.textTertiary} />
          </View>
          <View style={[s.platform, { height: cfg.h, backgroundColor: cfg.plat + '55' }]}>
            <Text style={[s.platformNum, { color: cfg.platText }]}>{place}</Text>
          </View>
        </Animated.View>
      );
    }

    const isYou = leaderboard.userEntry?.id === student.id;
    return (
      <Animated.View entering={entering} style={s.spotCol} key={place}>
        {place === 1 ? (
          <Ionicons name="trophy" size={22} color={GOLD} style={{ marginBottom: 2 }} />
        ) : (
          <View style={{ height: 22, marginBottom: 2 }} />
        )}
        <Avatar name={student.name} size={cfg.av} ring={cfg.ring} fontScale={0.36} />
        <Text style={s.spotName} numberOfLines={1}>
          {student.name}
        </Text>
        {isYou ? (
          <View style={s.youPill}>
            <Text style={s.youPillText}>{t('leaderboard_screen.you', 'You').toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={[s.spotScore, { fontSize: cfg.sc, color: cfg.platText }]}>
          {student.avgScore}%
        </Text>
        <Text style={s.spotXp}>{student.xp.toLocaleString()} XP</Text>
        <View style={[s.platform, { height: cfg.h, backgroundColor: cfg.plat }]}>
          <Text style={[s.platformNum, { color: cfg.platText, fontSize: place === 1 ? 28 : 22 }]}>
            {place}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // ---- List row ----
  const renderRow = (e: Student, index: number) => {
    const isYou = leaderboard.userEntry?.id === e.id;
    const barColor = colorFor(e.name);
    return (
      <Animated.View
        key={e.id}
        entering={FadeInDown.delay(index * 40).duration(280)}
        style={[s.row, isYou && s.rowYou]}
      >
        <Text style={s.rowRank}>{e.rank}</Text>
        <Avatar name={e.name} size={40} fontScale={0.4} />
        <View style={s.rowMain}>
          <View style={s.rowNameLine}>
            <Text style={s.rowName} numberOfLines={1}>
              {e.name}
            </Text>
            {isYou ? (
              <View style={s.youPill}>
                <Text style={s.youPillText}>
                  {t('leaderboard_screen.you', 'You').toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={s.rowBarLine}>
            <AnimatedBar pct={Math.min(100, e.avgScore)} color={barColor} styles={s} />
            <Text style={s.rowPct}>{e.avgScore}%</Text>
          </View>
        </View>
        <View style={s.rowXpCol}>
          <Text style={s.rowXp}>{e.xp.toLocaleString()}</Text>
          <Text style={s.rowXpLabel}>XP</Text>
        </View>
        {!isYou ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleFollowToggle(e.id)}
            style={s.followBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel={`${e.isFollowing ? t('common.following') : t('common.follow')} ${e.name}`}
          >
            <View style={[s.followInner, e.isFollowing && s.followInnerActive]}>
              <Ionicons
                name={e.isFollowing ? 'checkmark' : 'person-add'}
                size={16}
                color={e.isFollowing ? theme.colors.primary : '#fff'}
              />
            </View>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    );
  };

  const renderBody = () => {
    if (leaderboardLoading)
      return (
        <View style={{ paddingTop: spacing.md }}>
          <GenericListSkeleton numItems={6} />
        </View>
      );

    if (leaderboardError)
      return <RetryView message={leaderboardError} onRetry={() => fetchLeaderboard(selectedTab)} />;

    if (leaderboard.entries.length === 0)
      return (
        <View style={s.emptyCard}>
          <Ionicons name="trophy-outline" size={46} color={theme.colors.textTertiary} />
          <Text style={s.emptyTitle}>
            {t('leaderboard_screen.no_rankings_yet', { defaultValue: 'No rankings yet' })}
          </Text>
          <Text style={s.emptySub}>
            {t('leaderboard_screen.be_first_hint', {
              defaultValue: 'Be the first to complete quizzes and appear here!',
            })}
          </Text>
        </View>
      );

    const top3 = [1, 2, 3].map((r) => leaderboard.entries.find((e) => e.rank === r));
    const rest = leaderboard.entries.filter((e) => e.rank > 3);
    const you = leaderboard.userEntry;
    if (you && you.rank > 3 && !rest.some((e) => e.id === you.id)) {
      rest.push(you);
      rest.sort((a, b) => a.rank - b.rank);
    }

    return (
      <>
        {you ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <LinearGradient
              colors={BANNER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.banner}
            >
              <Avatar name={you.name} size={46} ring="rgba(255,255,255,0.35)" fontScale={0.4} />
              <View style={s.bannerMid}>
                <Text style={s.bannerTitle}>
                  {t('leaderboard_screen.your_ranking', 'Your Ranking')}
                </Text>
                <Text style={s.bannerSub} numberOfLines={1}>
                  {t('leaderboard_screen.rank_of', {
                    count: leaderboard.entries.length,
                    defaultValue: 'of {{count}} students',
                  })}{' '}
                  · {contextLine}
                </Text>
              </View>
              <View style={s.bannerRight}>
                <Text style={s.bannerRankNum}>#{you.rank}</Text>
                <Text style={s.bannerRankLabel}>
                  {t('leaderboard_screen.your_rank', 'Your Rank')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}

        {/* Podium */}
        <LinearGradient
          colors={[theme.colors.primary100, theme.colors.surface] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.podiumCard}
        >
          {showConfetti ? <Confetti onDone={() => setShowConfetti(false)} /> : null}
          <View style={s.podiumHead}>
            <Ionicons name="trophy" size={18} color={GOLD} />
            <Text style={s.podiumTitle}>
              {t('leaderboard_screen.top_performers', 'Top Performers')}
            </Text>
          </View>
          <Text style={s.podiumSub}>{contextLine}</Text>
          <View style={s.podiumRow}>
            {renderSpot(top3[1], 2)}
            {renderSpot(top3[0], 1)}
            {renderSpot(top3[2], 3)}
          </View>
        </LinearGradient>

        {/* List 4th+ */}
        {rest.length > 0 ? <View style={s.list}>{rest.map(renderRow)}</View> : null}
      </>
    );
  };

  return (
    <View style={common.container}>
      <UnifiedHeader
        title={t('leaderboard_screen.header_title', { defaultValue: 'Leaderboard' })}
        showBackButton={true}
        rightContent={
          <TouchableOpacity style={s.refreshButton} onPress={() => fetchLeaderboard(selectedTab)}>
            <Ionicons
              name="refresh-outline"
              size={spacing.icon.md}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(common.insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject filter — pills only (grade is fixed to the user's grade; API has no grade filter) */}
        <View style={s.filterCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillsRow}
          >
            <Pill
              label={t('common.all', 'All')}
              active={selectedTab === 'all'}
              onPress={() => setSelectedTab('all')}
              styles={s}
            />
            {subjects.map((subj) => (
              <Pill
                key={subj.id}
                label={subj.name}
                active={selectedTab === subj.id}
                onPress={() => setSelectedTab(subj.id)}
                styles={s}
              />
            ))}
          </ScrollView>
        </View>

        {renderBody()}
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  common: any,
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
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      gap: spacing.md,
    },

    // Filter card
    filterCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.ssm,
      paddingHorizontal: spacing.ssm,
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    pillsRow: {
      flexDirection: common.rowDirection,
      gap: spacing.sm,
      alignItems: 'center',
      paddingEnd: spacing.xs,
    },
    pill: {
      borderRadius: borderRadius.full,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    pillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    pillText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    pillTextActive: { color: '#fff' },

    // Your-rank banner
    banner: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 14,
      borderRadius: borderRadius.xl,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    bannerMid: { flex: 1 },
    bannerTitle: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: ON_DARK,
      textAlign: common.textAlign,
    },
    bannerSub: {
      ...typography('label'),
      color: ON_DARK_DIM,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    bannerRight: { alignItems: 'center' },
    bannerRankNum: {
      fontSize: 26,
      ...fontWeight('bold'),
      color: ON_DARK,
      lineHeight: 28,
    },
    bannerRankLabel: {
      fontSize: 9,
      ...fontWeight('bold'),
      color: ON_DARK_DIM,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },

    // Podium
    podiumCard: {
      borderRadius: borderRadius['2xl'],
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
      ...layout.shadow,
    },
    podiumHead: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 6,
    },
    podiumTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.navy,
    },
    podiumSub: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    podiumRow: {
      flexDirection: common.rowDirection,
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 10,
      marginTop: spacing.md,
    },
    spotCol: {
      flex: 1,
      maxWidth: 118,
      alignItems: 'center',
    },
    spotAvatarEmpty: {
      borderRadius: 999,
      backgroundColor: theme.colors.border + '55',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    spotName: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: '100%',
    },
    spotScore: {
      ...fontWeight('bold'),
      marginTop: 3,
    },
    spotXp: {
      fontSize: 10,
      ...fontWeight('600'),
      color: theme.colors.textTertiary,
      marginBottom: 7,
    },
    platform: {
      width: '100%',
      borderTopLeftRadius: borderRadius.md,
      borderTopRightRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    platformNum: {
      ...fontWeight('bold'),
    },
    youPill: {
      backgroundColor: theme.colors.navy,
      borderRadius: borderRadius.full,
      paddingHorizontal: 7,
      paddingVertical: 1,
      marginTop: 3,
    },
    youPillText: {
      fontSize: 8,
      ...fontWeight('bold'),
      color: '#fff',
      letterSpacing: 0.5,
    },

    // List
    list: { gap: spacing.sm },
    row: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg,
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    rowYou: {
      backgroundColor: theme.colors.primary100,
      borderColor: theme.colors.primary + '40',
    },
    rowRank: {
      width: 20,
      textAlign: 'center',
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
    },
    rowMain: { flex: 1, minWidth: 0 },
    rowNameLine: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 8,
      marginBottom: 5,
    },
    rowName: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      flexShrink: 1,
      textAlign: common.textAlign,
    },
    rowBarLine: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 8,
    },
    track: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
      flexDirection: common.rowDirection,
    },
    fill: {
      height: '100%',
      borderRadius: 999,
    },
    rowPct: {
      width: 34,
      textAlign: 'right',
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.navy,
    },
    rowXpCol: { alignItems: 'center', minWidth: 34 },
    rowXp: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    rowXpLabel: {
      fontSize: 9,
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
    },
    // Ringed "add friend" button (light halo ring + solid inner circle).
    followBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '24',
      alignItems: 'center',
      justifyContent: 'center',
    },
    followInner: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    followInnerActive: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },

    // Empty
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius['2xl'],
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.xl,
      alignItems: 'center',
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    emptyTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    emptySub: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginTop: 4,
      textAlign: 'center',
    },
  });

export default LeaderboardScreen;
