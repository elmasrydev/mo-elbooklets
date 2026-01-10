import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import CircularProgress from './CircularProgress';
import { getTimeAgo } from '../lib/dateUtils';
import { getScoreColor } from '../lib/scoreUtils';

interface ActivityCardProps {
  activity: {
    id: string;
    subject: {
      name: string;
    };
    score: number;
    totalQuestions: number;
    completedAt: string;
    isPassed: boolean;
  };
  onPress?: () => void;
}

const RecentActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  
  const scorePercent = Math.round((activity.score / activity.totalQuestions) * 100);
  const scoreColor = getScoreColor(scorePercent);

  return (
    <TouchableOpacity 
      style={styles(theme, isRTL).card} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles(theme, isRTL).iconContainer, { backgroundColor: theme.colors.primary100 }]}>
        <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
      </View>
      
      <View style={styles(theme, isRTL).infoContainer}>
        <Text style={styles(theme, isRTL).subjectName}>{activity.subject.name}</Text>
        <Text style={styles(theme, isRTL).timeText}>
          {getTimeAgo(activity.completedAt, t, language)}
        </Text>
      </View>
      
      <View style={styles(theme, isRTL).rightContainer}>
        <CircularProgress 
          size={50} 
          strokeWidth={5} 
          percentage={scorePercent} 
          color={scoreColor} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  card: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  rightContainer: {
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecentActivityCard;
