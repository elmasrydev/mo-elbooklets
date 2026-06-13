import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { AppNotification } from '../types/notification';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const { theme, spacing } = useTheme();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const ROUTABLE_SLUGS = [
    'link_request_received',
    'link_request_accepted',
    'link_request_declined',
    'new_follower',
    'post_liked',
  ];

  const hasRoute = !!notification.event_slug && ROUTABLE_SLUGS.includes(notification.event_slug);

  const getIcon = () => {
    switch (notification.event_slug) {
      case 'new_follower':
        return { name: 'person-add', color: theme.colors.primary };
      case 'post_liked':
        return { name: 'heart', color: '#FF4B55' };
      case 'link_request_received':
        return { name: 'link', color: theme.colors.success };
      case 'link_request_accepted':
        return { name: 'checkmark-circle', color: theme.colors.success };
      case 'link_request_declined':
        return { name: 'close-circle', color: theme.colors.error };
      default:
        return { name: 'notifications', color: theme.colors.primary };
    }
  };

  const icon = getIcon();
  const dateLocale = language === 'ar' ? ar : enUS;

  const getTimeLabel = () => {
    try {
      const date = parseISO(notification.created_at);
      return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
    } catch (e) {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: notification.is_read
            ? theme.colors.background
            : `${theme.colors.primary}05`,
          borderBottomColor: theme.colors.border,
        },
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={hasRoute ? 0.6 : 0.9}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              typography('bodySmall'),
              fontWeight(notification.is_read ? '500' : '700'),
              { color: theme.colors.text, flex: 1 },
            ]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <View style={styles.trailingRow}>
            {!notification.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
            )}
            {hasRoute && (
              <Ionicons
                name="chevron-forward"
                size={14}
                color={theme.colors.textTertiary}
                style={styles.chevron}
              />
            )}
          </View>
        </View>

        {notification.body && (
          <Text
            style={[typography('caption'), { color: theme.colors.textSecondary, marginTop: 2 }]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        )}

        <Text style={[typography('caption'), { color: theme.colors.textTertiary, marginTop: 6 }]}>
          {getTimeLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginStart: 8,
  },
  trailingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginStart: 6,
  },
  chevron: {
    marginStart: 4,
    opacity: 0.6,
  },
});

export default NotificationItem;
