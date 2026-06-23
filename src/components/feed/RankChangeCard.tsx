import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { getTimeAgo } from '../../lib/dateUtils';
import Avatar from '../Avatar';

interface RankChangeCardProps {
  item: {
    id: string;
    user: {
      id: string;
      name: string;
      grade: { id: string; name: string };
      selectedAvatar?: { url?: string } | null;
    };
    createdAt: string;
    rankData: {
      previousRank?: number;
      newRank: number;
      subject?: { id: string; name: string };
      isOverall: boolean;
    };
    likes?: number;
    comments?: number;
    isLiked?: boolean;
  };
  onLike?: () => void;
  onComment?: () => void;
}

// Dark "badge earned" gradient + accents (intentionally literal — this is a hero card
// with its own palette, not theme surfaces).
const GRADIENT = ['#003B7A', '#004A9A', '#1E54B8'] as const;
const MEDAL_BG = '#fbbf24';
const MEDAL_ICON = '#1E3063';
const ON_DARK = '#ffffff';
const ON_DARK_DIM = 'rgba(255,255,255,0.7)';
const ON_DARK_FAINT = 'rgba(255,255,255,0.12)';

const RankChangeCard: React.FC<RankChangeCardProps> = ({ item, onLike }) => {
  const { spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  if (!item.rankData) return null;

  const scopeLabel = item.rankData.isOverall
    ? t('social_screen.overall_ranking', 'Overall')
    : item.rankData.subject?.name || '';

  const s = createStyles(common, spacing, borderRadius, typography, fontWeight);

  return (
    <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
      {/* Header: avatar + name + grade · time */}
      <View style={s.headerRow}>
        <Avatar
          uri={item.user.selectedAvatar?.url}
          name={item.user.name}
          size={42}
          ring="rgba(255,255,255,0.25)"
          fontScale={0.36}
        />
        <View style={s.userInfo}>
          <Text numberOfLines={1} style={s.userName}>
            {item.user.name}
          </Text>
          <Text numberOfLines={1} style={s.userSubtitle}>
            {item.user.grade.name} · {getTimeAgo(item.createdAt, t, language)}
          </Text>
        </View>
      </View>

      {/* Badge banner */}
      <View style={s.badgeRow}>
        <View style={s.medal}>
          <MaterialIcons name="military-tech" size={26} color={MEDAL_ICON} />
        </View>
        <View style={s.badgeContent}>
          <Text numberOfLines={1} style={s.badgeTitle}>
            {t('social_screen.new_rank_achieved', 'New Badge Earned')}
          </Text>
          <Text numberOfLines={1} style={s.badgeSubtitle}>
            {scopeLabel ? `${scopeLabel} · ` : ''}
            {t('social_screen.ranked', {
              rank: item.rankData.newRank,
              defaultValue: 'Ranked #{{rank}}',
            })}
          </Text>
        </View>
      </View>

      {/* Footer: likes + congrats */}
      <View style={s.footerRow}>
        {item.likes && item.likes > 0 ? (
          <View style={s.likesCount}>
            <Ionicons name="thumbs-up" size={16} color={ON_DARK} />
            <Text style={s.likesCountText}>{item.likes}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={s.congratsBtn} onPress={onLike} activeOpacity={0.8}>
          <Ionicons name={item.isLiked ? 'heart' : 'sparkles-outline'} size={16} color={ON_DARK} />
          <Text style={s.congratsText}>{t('social_screen.congrats', 'Congrats')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const createStyles = (
  common: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
      borderRadius: borderRadius['2xl'],
      marginBottom: spacing.ssm,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
      marginBottom: spacing.md,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ON_DARK_FAINT,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    avatarText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: ON_DARK,
    },
    userInfo: {
      flex: 1,
      alignItems: common.alignStart,
      gap: 2,
    },
    userName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: ON_DARK,
      textAlign: common.textAlign,
    },
    userSubtitle: {
      ...typography('label'),
      color: ON_DARK_DIM,
      textAlign: common.textAlign,
    },
    badgeRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 14,
      backgroundColor: ON_DARK_FAINT,
      borderRadius: borderRadius.lg,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    medal: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: MEDAL_BG,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeContent: {
      flex: 1,
      alignItems: common.alignStart,
      gap: 3,
    },
    badgeTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: ON_DARK,
      textAlign: common.textAlign,
    },
    badgeSubtitle: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: ON_DARK_DIM,
      textAlign: common.textAlign,
    },
    footerRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: spacing.md,
      paddingTop: spacing.ssm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.14)',
    },
    likesCount: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 5,
      marginEnd: 'auto',
    },
    likesCountText: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: ON_DARK_DIM,
    },
    congratsBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    congratsText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: ON_DARK,
    },
  });

export default React.memo(RankChangeCard);
