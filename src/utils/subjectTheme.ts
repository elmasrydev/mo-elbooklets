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
      color: '#EF4444',
      bg: '#EF4444',
    };
  }
  // Science: Green theme
  if (name.includes('science') || name.includes('علوم')) {
    return {
      localIcon: require('../../assets/images/scienceIcon.png'),
      localIconGrey: require('../../assets/images/scienceIconGrey.png'),
      icon: 'flask-outline',
      color: '#10B981',
      bg: '#10B981',
    };
  }
  // History
  if (name.includes('history') || name.includes('تاريخ')) {
    return {
      localIcon: require('../../assets/images/historyIcon.png'),
      localIconGrey: require('../../assets/images/historyIcon.png'),
      icon: 'earth-outline',
      color: '#64748B',
      bg: '#64748B',
    };
  }
  // Geography
  if (name.includes('geography') || name.includes('جغرافيا') || name.includes('دراسات')) {
    return {
      localIcon: require('../../assets/images/GeoIcon.png'),
      localIconGrey: require('../../assets/images/GeoIconGrey.png'),
      icon: 'earth-outline',
      color: '#F59E0B',
      bg: '#F59E0B',
    };
  }
  // Arabic: Indigo/Purple
  if (name.includes('arabic') || name.includes('عرب')) {
    return {
      localIcon: require('../../assets/images/ArIcon.png'),
      localIconGrey: require('../../assets/images/arIconGrey.png'),
      icon: 'globe-outline',
      color: '#3B82F6',
      bg: '#3B82F6',
    };
  }
  // English: Blue
  if (name.includes('english') || name.includes('انجليزي')) {
    return {
      localIcon: require('../../assets/images/EnIcon.png'),
      localIconGrey: require('../../assets/images/EnIconGrey.png'),
      icon: 'text-outline',
      color: '#1E3A8A',
      bg: '#1E3A8A',
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
