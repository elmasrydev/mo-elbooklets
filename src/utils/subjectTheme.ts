import { ColorValue } from 'react-native';

export interface SubjectThemeConfig {
  icon: any; // Ionicons name
  color: string;
  bg: string;
}

export const getSubjectConfig = (subjectName: string, theme: any): SubjectThemeConfig => {
  const name = (subjectName || '').toLowerCase();

  // Mathematics: Blue/Greyish theme
  if (name.includes('math') || name.includes('رياضيات')) {
    return { icon: 'calculator-outline', color: '#3B82F6', bg: '#EFF6FF' };
  }
  // Science: Green theme
  if (name.includes('science') || name.includes('علوم')) {
    return { icon: 'flask-outline', color: '#10B981', bg: '#ECFDF5' };
  }
  // Physics: Violet/Indigo
  if (name.includes('physics') || name.includes('فيزياء')) {
    return { icon: 'magnet-outline', color: '#8B5CF6', bg: '#F5F3FF' };
  }
  // Chemistry: Pink/Rose
  if (name.includes('chemistry') || name.includes('كيمياء')) {
    return { icon: 'beaker-outline', color: '#EC4899', bg: '#FDF2F8' };
  }
  // Biology: Emerald
  if (name.includes('biology') || name.includes('أحياء')) {
    return { icon: 'leaf-outline', color: '#059669', bg: '#D1FAE5' };
  }
  // Social Studies / Geography: Yellow/Amber
  if (
    name.includes('social') ||
    name.includes('دراسات') ||
    name.includes('history') ||
    name.includes('تاريخ') ||
    name.includes('geography') ||
    name.includes('جغرافيا')
  ) {
    return { icon: 'earth-outline', color: '#F59E0B', bg: '#FFFBEB' };
  }
  // Arabic: Purple/Deep
  if (name.includes('arabic') || name.includes('عربي')) {
    return { icon: 'book-outline', color: '#7C3AED', bg: '#F5F3FF' };
  }
  // English: Red/Orange
  if (name.includes('english') || name.includes('انجليزي')) {
    return { icon: 'text-outline', color: '#EF4444', bg: '#FEF2F2' };
  }

  // Default: Primary Theme Color
  // Ensure we fallback gracefully if theme is undefined (though it shouldn't be)
  const primary = theme?.colors?.primary || '#3B82F6'; // Default Blue
  const primaryLight = theme?.colors?.primaryLight || `${primary}20`;

  return {
    icon: 'library-outline',
    color: primary,
    bg: primaryLight,
  };
};
