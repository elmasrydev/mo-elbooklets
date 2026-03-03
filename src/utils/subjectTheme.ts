import { ImageSourcePropType } from 'react-native';

export interface SubjectThemeConfig {
  icon?: string; // Ionicons name fallback
  localIcon?: ImageSourcePropType;
  localIconGrey?: ImageSourcePropType;
  color: string;
  bg: string;
}

export const getSubjectConfig = (subjectName: string, theme: any): SubjectThemeConfig => {
  const name = (subjectName || '').toLowerCase();

  // Mathematics: Orange theme
  if (name.includes('math') || name.includes('رياضيات')) {
    return {
      localIcon: require('../../assets/images/MathIcon.png'),
      localIconGrey: require('../../assets/images/MathIconGrey.png'),
      icon: 'calculator-outline',
      color: '#EA580C',
      bg: '#FFEDD5',
    };
  }
  // Science: Green theme
  if (name.includes('science') || name.includes('علوم')) {
    return {
      localIcon: require('../../assets/images/scienceIcon.png'),
      localIconGrey: require('../../assets/images/scienceIconGrey.png'),
      icon: 'flask-outline',
      color: '#10B981',
      bg: '#D1FAE5',
    };
  }
  // History
  if (name.includes('history') || name.includes('تاريخ')) {
    return {
      localIcon: require('../../assets/images/historyIcon.png'),
      localIconGrey: require('../../assets/images/historyIconGrey.png'),
      icon: 'time-outline',
      color: '#D97706',
      bg: '#FEF3C7',
    };
  }
  // Geography
  if (name.includes('geography') || name.includes('جغرافيا') || name.includes('دراسات')) {
    return {
      localIcon: require('../../assets/images/GeoIcon.png'),
      localIconGrey: require('../../assets/images/GeoIconGrey.png'),
      icon: 'earth-outline',
      color: '#06B6D4',
      bg: '#CFFAFE',
    };
  }
  // Arabic: Indigo/Purple
  if (name.includes('arabic') || name.includes('عرب')) {
    return {
      localIcon: require('../../assets/images/ArIcon.png'),
      localIconGrey: require('../../assets/images/arIconGrey.png'),
      icon: 'globe-outline',
      color: '#4F46E5',
      bg: '#E0E7FF',
    };
  }
  // English: Blue
  if (name.includes('english') || name.includes('انجليزي')) {
    return {
      localIcon: require('../../assets/images/EnIcon.png'),
      localIconGrey: require('../../assets/images/EnIconGrey.png'),
      icon: 'text-outline',
      color: '#2563EB',
      bg: '#DBEAFE',
    };
  }

  // Default: Primary Theme Color
  const primary = theme?.colors?.primary || '#3B82F6'; // Default Blue
  const primaryLight = theme?.colors?.primaryLight || `${primary}20`;

  return {
    icon: 'library-outline',
    color: primary,
    bg: primaryLight,
  };
};
