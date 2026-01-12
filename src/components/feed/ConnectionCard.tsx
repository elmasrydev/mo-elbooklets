import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { getTimeAgo } from '../../lib/dateUtils';

interface ConnectionCardProps {
  item: {
    id: string;
    user: {
      id: string;
      name: string;
      grade: {
        id: string;
        name: string;
      };
    };
    createdAt: string;
    connectedUser: {
      id: string;
      name: string;
      grade: {
        id: string;
        name: string;
      };
    };
  };
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ item }) => {
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const currentStyles = createStyles(theme, isRTL);

  return (
    <View style={currentStyles.card}>
      <View style={currentStyles.content}>
        <View style={[currentStyles.avatarsRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* First User Avatar */}
          <View style={currentStyles.avatar}>
            <Text style={currentStyles.avatarText}>{getInitials(item.user.name)}</Text>
          </View>

          {/* Connection Icon */}
          <View style={currentStyles.connectionIcon}>
            <Ionicons name="people" size={24} color="#10B981" />
            <Text style={currentStyles.connectedLabel}>
              {t('social_screen.connected')}
            </Text>
          </View>

          {/* Second User Avatar */}
          <View style={currentStyles.avatar}>
            <Text style={currentStyles.avatarText}>{getInitials(item.connectedUser.name)}</Text>
          </View>
        </View>

        {/* Names */}
        <Text style={currentStyles.names}>
          {item.user.name} & {item.connectedUser.name}
        </Text>

        {/* Time ago */}
        <Text style={currentStyles.timeAgo}>
          {getTimeAgo(item.createdAt, t, language)}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: '#ECFDF5',
      borderRadius: 24,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    content: {
      alignItems: 'center',
    },
    avatarsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    connectionIcon: {
      alignItems: 'center',
      gap: 4,
    },
    connectedLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#10B981',
      textTransform: 'uppercase',
    },
    names: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    timeAgo: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textTertiary,
    },
  });

export default ConnectionCard;
