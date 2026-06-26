import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { AppNotification } from '../types/notification';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

/**
 * Icon + accent colour per notification type. Mapped only to the event_slugs the
 * backend actually sends (verified). Anything else falls back to a neutral bell.
 */
const iconFor = (
  slug: string | null | undefined,
  theme: any,
): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (slug) {
    case 'post_liked':
      return { name: 'heart', color: '#E11D48' };
    case 'new_follower':
      return { name: 'person-add', color: '#16A34A' };
    case 'link_request_received':
      return { name: 'link', color: theme.colors.primary };
    case 'link_request_accepted':
      return { name: 'people', color: '#0D9488' };
    case 'link_request_declined':
      return { name: 'close-circle', color: theme.colors.error };
    default:
      return { name: 'notifications', color: theme.colors.primary };
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const { theme } = useTheme();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();
  const { language } = useLanguage();

  const icon = iconFor(notification.event_slug, theme);
  const dateLocale = language === 'ar' ? ar : enUS;
  const timeLabel = (() => {
    try {
      return formatDistanceToNow(parseISO(notification.created_at), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch {
      return '';
    }
  })();

  const s = useMemo(
    () => styles(theme, common, typography, fontWeight),
    [theme, common, typography, fontWeight],
  );

  return (
    <TouchableOpacity
      style={[s.row, !notification.is_read && s.rowUnread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={[s.lead, { backgroundColor: `${icon.color}1A` }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>

      <View style={s.text}>
        <Text style={s.title} numberOfLines={2}>
          {notification.title}
        </Text>
        {!!notification.body && (
          <Text style={s.desc} numberOfLines={3}>
            {notification.body}
          </Text>
        )}
        <Text style={s.time}>{timeLabel}</Text>
      </View>

      {!notification.is_read && <View style={s.dot} />}
    </TouchableOpacity>
  );
};

const styles = (theme: any, common: any, typography: any, fontWeight: any) =>
  StyleSheet.create({
    row: {
      flexDirection: common.rowDirection,
      alignItems: 'flex-start',
      gap: 13,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowUnread: {
      backgroundColor: `${theme.colors.primary}0F`,
    },
    lead: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    text: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    desc: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    time: {
      ...typography('label'),
      color: theme.colors.textTertiary,
      marginTop: 5,
      textAlign: common.textAlign,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: theme.colors.primary,
      marginTop: 6,
      flexShrink: 0,
    },
  });

export default NotificationItem;
