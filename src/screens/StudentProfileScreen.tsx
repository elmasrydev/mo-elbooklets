import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import Avatar from '../components/Avatar';
import RetryView from '../components/RetryView';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { tryFetchWithFallback } from '../config/api';
import { layout } from '../config/layout';

interface StudentProfileData {
  id: string;
  name: string;
  gender?: string | null;
  grade?: { id: string; name: string } | null;
  educationalSystem?: { id: string; name: string } | null;
  selectedAvatar?: { url?: string } | null;
  totalQuizzes: number;
  avgScore: number;
  xp: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollower: boolean;
  createdAt?: string;
}

const StudentProfileScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {
    userId,
    name: paramName,
    avatarUrl: paramAvatar,
    gradeName: paramGrade,
  } = route.params || {};

  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const { toggleFollow } = useFollowToggle();

  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      setRestricted(false);
      const token = await SecureStore.getItemAsync('auth_token');
      const result = await tryFetchWithFallback(
        `query StudentProfile($userId: ID!) {
          studentProfile(userId: $userId) {
            id name gender
            grade { id name }
            educationalSystem { id name }
            selectedAvatar { url }
            totalQuizzes avgScore xp
            followersCount followingCount
            isFollowing isFollower
            createdAt
          }
        }`,
        { userId },
        token || undefined,
      );
      if (result.data?.studentProfile) {
        setProfile(result.data.studentProfile);
        setFollowing(!!result.data.studentProfile.isFollowing);
      } else {
        // studentProfile is mutual-follow gated — null/error means not (yet) mutual.
        setRestricted(true);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onToggleFollow = async () => {
    if (!userId || toggling) return;
    setToggling(true);
    const res = await toggleFollow(userId);
    if (res?.success) {
      setFollowing(res.isFollowing);
      setProfile((p) => (p ? { ...p, isFollowing: res.isFollowing } : p));
      // Following may have made the relationship mutual — re-check the full profile.
      if (restricted) fetchProfile();
    }
    setToggling(false);
  };

  const s = useMemo(
    () => styles(theme, common, spacing, borderRadius, typography, fontWeight),
    [theme, common, spacing, borderRadius, typography, fontWeight],
  );

  const displayName = profile?.name || paramName || '';
  const avatarUrl = profile?.selectedAvatar?.url || paramAvatar;
  const isFollowing = profile?.isFollowing ?? following;

  const renderFollowButton = () => (
    <TouchableOpacity
      testID="student-profile-follow"
      style={[s.followBtn, isFollowing && s.followBtnOutline]}
      onPress={onToggleFollow}
      disabled={toggling}
      activeOpacity={0.85}
    >
      {toggling ? (
        <ActivityIndicator color={isFollowing ? theme.colors.primary : '#fff'} />
      ) : (
        <>
          <Ionicons
            name={isFollowing ? 'checkmark' : 'person-add'}
            size={16}
            color={isFollowing ? theme.colors.primary : '#fff'}
          />
          <Text style={[s.followBtnText, isFollowing && s.followBtnTextOutline]}>
            {isFollowing ? t('common.following') : t('common.follow')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderMetric = (
    icon: keyof typeof Ionicons.glyphMap,
    value: string | number,
    label: string,
    color: string,
  ) => (
    <View style={s.metric}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={common.container}>
      <UnifiedHeader title={displayName || t('common.profile', 'Profile')} showBackButton />

      {loading ? (
        <View style={{ padding: spacing.md }}>
          <GenericListSkeleton numItems={4} />
        </View>
      ) : error ? (
        <RetryView message={error} onRetry={fetchProfile} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            s.content,
            { paddingBottom: Math.max(common.insets.bottom, spacing.xl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header card */}
          <View style={s.card}>
            <Avatar uri={avatarUrl} name={displayName} size={84} />
            <Text style={s.name} numberOfLines={1}>
              {displayName}
            </Text>
            {profile ? (
              <Text style={s.sub} numberOfLines={1}>
                {profile.grade?.name || ''}
                {profile.educationalSystem?.name ? ` · ${profile.educationalSystem.name}` : ''}
              </Text>
            ) : paramGrade ? (
              <Text style={s.sub} numberOfLines={1}>
                {paramGrade}
              </Text>
            ) : null}

            {profile ? (
              <View style={s.statsRow}>
                <View style={s.statCol}>
                  <Text style={s.statNum}>{profile.followersCount}</Text>
                  <Text style={s.statLabel}>{t('profile_screen.followers')}</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCol}>
                  <Text style={s.statNum}>{profile.followingCount}</Text>
                  <Text style={s.statLabel}>{t('profile_screen.following')}</Text>
                </View>
              </View>
            ) : null}

            {renderFollowButton()}
          </View>

          {profile ? (
            <View style={s.metricsCard}>
              {renderMetric(
                'book-outline',
                profile.totalQuizzes,
                t('student_profile.quizzes', 'Quizzes'),
                theme.colors.primary,
              )}
              <View style={s.metricDivider} />
              {renderMetric(
                'star',
                `${Math.round(profile.avgScore)}%`,
                t('student_profile.avg_score', 'Avg Score'),
                theme.colors.success,
              )}
              <View style={s.metricDivider} />
              {renderMetric(
                'flash',
                profile.xp.toLocaleString(),
                t('student_profile.xp', 'XP'),
                theme.colors.warning,
              )}
            </View>
          ) : (
            <View style={s.noteCard}>
              <Ionicons name="lock-closed-outline" size={28} color={theme.colors.textTertiary} />
              <Text style={s.noteTitle}>
                {t('student_profile.restricted_title', 'Private profile')}
              </Text>
              <Text style={s.noteMsg}>
                {t('student_profile.restricted_msg', {
                  name: displayName,
                  defaultValue: 'You both need to follow each other to see the full profile.',
                })}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
    content: {
      padding: spacing.md,
      gap: spacing.md,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius['2xl'],
      padding: spacing.lg,
      alignItems: 'center',
      ...layout.shadow,
      shadowColor: '#004A9A',
      shadowOpacity: 0.1,
      shadowRadius: 20,
    },
    name: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginTop: spacing.ssm,
      textAlign: 'center',
    },
    sub: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      alignSelf: 'stretch',
    },
    statCol: { flex: 1, alignItems: 'center' },
    statNum: { ...typography('h3'), ...fontWeight('bold'), color: theme.colors.text },
    statLabel: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    statDivider: { width: 1, height: 34, backgroundColor: theme.colors.border },
    followBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'stretch',
      height: 46,
      marginTop: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.primary,
    },
    followBtnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    followBtnText: { ...typography('body'), ...fontWeight('bold'), color: '#fff' },
    followBtnTextOutline: { color: theme.colors.primary },
    metricsCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius['2xl'],
      paddingVertical: spacing.md,
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    metric: { flex: 1, alignItems: 'center', gap: 4 },
    metricValue: { ...typography('h3'), ...fontWeight('bold'), color: theme.colors.text },
    metricLabel: { ...typography('label'), color: theme.colors.textTertiary },
    metricDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },
    noteCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius['2xl'],
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    noteTitle: { ...typography('h3'), ...fontWeight('bold'), color: theme.colors.text },
    noteMsg: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default StudentProfileScreen;
