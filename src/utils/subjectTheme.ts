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

  // Mathematics: Purple theme
  if (name.includes('math') || name.includes('رياضيات')) {
    return {
      localIcon: require('../../assets/images/MathIcon.png'),
      localIconGrey: require('../../assets/images/MathIconGrey.png'),
      icon: 'calculator-outline',
      color: '#EF4444',
      bg: '#f5f3ff',
    };
  }
  // Science: Orange/Gold theme
  if (name.includes('science') || name.includes('علوم')) {
    return {
      localIcon: require('../../assets/images/scienceIcon.png'),
      localIconGrey: require('../../assets/images/scienceIconGrey.png'),
      icon: 'flask-outline',
      color: '#12B981',
      bg: '#fff7ed',
    };
  }
  // History
  if (name.includes('history') || name.includes('تاريخ')) {
    return {
      localIcon: require('../../assets/images/historyIcon.png'),
      localIconGrey: require('../../assets/images/historyIcon.png'),
      icon: 'earth-outline',
      color: '#64748B',
      bg: '#f8fafc',
    };
  }
  // Geography
  if (name.includes('geography') || name.includes('جغرافيا') || name.includes('دراسات')) {
    return {
      localIcon: require('../../assets/images/GeoIcon.png'),
      localIconGrey: require('../../assets/images/GeoIconGrey.png'),
      icon: 'earth-outline',
      color: '#d97706',
      bg: '#fff7ed',
    };
  }
  // Arabic: Green theme
  if (name.includes('arabic') || name.includes('عرب')) {
    return {
      localIcon: require('../../assets/images/ArIcon.png'),
      localIconGrey: require('../../assets/images/arIconGrey.png'),
      icon: 'globe-outline',
      color: '#3C82F6',
      bg: '#f0fdf4',
    };
  }
  // English: Blue theme
  if (name.includes('english') || name.includes('انجليزي')) {
    return {
      localIcon: require('../../assets/images/EnIcon.png'),
      localIconGrey: require('../../assets/images/EnIconGrey.png'),
      icon: 'text-outline',
      color: '#004A9A',
      bg: '#eff6ff',
    };
  }

  // Default: Primary Theme Color
  const primary = theme?.colors?.primary || '#005ab4'; // Default Blue
  const primaryLight = theme?.colors?.primaryLight || `${primary}20`;

  return {
    icon: 'library-outline',
    color: primary,
    bg: primaryLight,
  };
};
