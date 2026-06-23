import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import Avatar from './Avatar';
import AppButton from './AppButton';

const AVATAR_SIZE = 52;

export interface UserListRowStudent {
  id: string;
  name: string;
  grade?: { id?: string; name?: string } | null;
  totalQuizzes?: number;
  avgScore?: number;
  isFollowing?: boolean;
  selectedAvatar?: { url?: string } | null;
}

interface UserListRowProps {
  student: UserListRowStudent;
  /** Tap on the card — usually opens the student profile. */
  onPress?: () => void;
  /** Tap on the follow / unfollow button. */
  onFollowToggle?: () => void;
  followLoading?: boolean;
  containerStyle?: ViewStyle | ViewStyle[];
}

/**
 * Unified user/student row used across every list in the app (Followers /
 * Following, Community search, ...). Single source of truth for this row.
 *
 * Layout (matches the agreed design): avatar vertically centered on the start
 * side, then a content column holding a header row (name/grade + follow button)
 * and, below it, a stats row with the quizzes & avg-score badges always sitting
 * beside each other. The badges live inside the content column (not squeezed
 * between avatar and button), so they never stack/wrap.
 */
const UserListRow: React.FC<UserListRowProps> = ({
  student,
  onPress,
  onFollowToggle,
  followLoading = false,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();

  const s = useMemo(
    () => styles(theme, common, typography, fontWeight),
    [theme, common, typography, fontWeight],
  );

  return (
    <TouchableOpacity
      style={[common.card, containerStyle]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={s.row}>
        <Avatar uri={student.selectedAvatar?.url} name={student.name} size={AVATAR_SIZE} />

        <View style={s.content}>
          <View style={s.header}>
            <View style={s.textCol}>
              <Text style={s.name} numberOfLines={1}>
                {student.name}
              </Text>
              {!!student.grade?.name && (
                <Text style={s.grade} numberOfLines={1}>
                  {student.grade.name}
                </Text>
              )}
            </View>

            {onFollowToggle && (
              <AppButton
                title={student.isFollowing ? t('common.following') : t('common.follow')}
                onPress={onFollowToggle}
                loading={followLoading}
                variant={student.isFollowing ? 'outline' : 'primary'}
                size="sm"
                fullWidth={false}
                style={s.followButton}
                textStyle={{ fontSize: 12.5 }}
                accessibilityLabel={`${
                  student.isFollowing ? t('common.following') : t('common.follow')
                } ${student.name}`}
              />
            )}
          </View>

          <View style={s.stats}>
            <View style={[s.badge, { backgroundColor: `${theme.colors.primary}10` }]}>
              <Ionicons name="book-outline" size={12} color={theme.colors.primary} />
              <Text style={[s.stat, { color: theme.colors.primary }]} numberOfLines={1}>
                {student.totalQuizzes ?? 0} {t('common.quizzes')}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: `${theme.colors.success}10` }]}>
              <Ionicons name="star-outline" size={12} color={theme.colors.success} />
              <Text style={[s.stat, { color: theme.colors.success }]} numberOfLines={1}>
                {student.avgScore ?? 0}% {t('common.avg')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: any, common: any, typography: any, fontWeight: any) =>
  StyleSheet.create({
    row: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
    },
    textCol: {
      flex: 1,
      alignItems: common.alignStart,
    },
    name: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    grade: {
      // SemiBold so the Arabic grade reads consistently next to the bold name
      // instead of looking thin/under-weighted. (BKLT-256)
      ...typography('caption', '600'),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    // Badges row — always side by side, beneath the name.
    stats: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    badge: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    stat: {
      ...typography('label'),
      ...fontWeight('bold'),
    },
    followButton: {
      height: 40,
      paddingHorizontal: 14,
      minWidth: 92,
      flexShrink: 0,
    },
  });

export default React.memo(UserListRow);
