import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LessonPoint {
  id: string;
  title: string;
  explanation?: string;
  order: number;
}

interface Lesson {
  id: string;
  name: string;
  summary?: string;
  points?: string[]; // Legacy field
  lessonPoints?: LessonPoint[]; // New structured points
  chapter: {
    id: string;
    name: string;
    order: number;
  };
}

interface StudyLessonScreenProps {
  lesson: Lesson;
  allLessons: Lesson[];
  onBack: () => void;
  onNavigateLesson: (lesson: Lesson) => void;
}

const StudyLessonScreen: React.FC<StudyLessonScreenProps> = ({
  lesson,
  allLessons,
  onBack,
  onNavigateLesson,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const currentStyles = styles(theme, isRTL);

  const togglePoint = (pointId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      return next;
    });
  };

  // Prefer new lessonPoints over legacy points
  const hasNewPoints = lesson.lessonPoints && lesson.lessonPoints.length > 0;
  const hasLegacyPoints = !hasNewPoints && lesson.points && lesson.points.length > 0;

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={currentStyles.chapterBadge}>{lesson.chapter.name}</Text>
        <Text style={currentStyles.headerTitle}>{lesson.name}</Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Section */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View style={currentStyles.sectionIcon}>
              <Text style={currentStyles.sectionIconText}>📄</Text>
            </View>
            <Text style={currentStyles.sectionTitle}>{t('study_lesson.summary')}</Text>
          </View>
          {lesson.summary ? (
            <Text style={currentStyles.summaryText}>{lesson.summary}</Text>
          ) : (
            <Text style={currentStyles.noContentText}>{t('study_lesson.no_summary')}</Text>
          )}
        </View>

        {/* Key Points Section */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View style={[currentStyles.sectionIcon, currentStyles.pointsIcon]}>
              <Text style={currentStyles.sectionIconText}>✓</Text>
            </View>
            <Text style={currentStyles.sectionTitle}>{t('study_lesson.key_points')}</Text>
          </View>

          {hasNewPoints ? (
            <View style={currentStyles.pointsList}>
              {lesson.lessonPoints!.map((point) => {
                const isExpanded = expandedPoints.has(point.id);
                return (
                  <TouchableOpacity
                    key={point.id}
                    style={currentStyles.pointItem}
                    onPress={() => point.explanation && togglePoint(point.id)}
                    activeOpacity={point.explanation ? 0.7 : 1}
                  >
                    <View style={currentStyles.pointHeader}>
                      <View style={currentStyles.pointBullet}>
                        <Text style={currentStyles.pointBulletText}>✓</Text>
                      </View>
                      <Text style={currentStyles.pointText}>{point.title}</Text>
                      {point.explanation && (
                        <Text style={currentStyles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                      )}
                    </View>
                    {isExpanded && point.explanation && (
                      <View style={currentStyles.explanationContainer}>
                        <Text style={currentStyles.explanationText}>{point.explanation}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : hasLegacyPoints ? (
            <View style={currentStyles.pointsList}>
              {lesson.points!.map((point, index) => (
                <View key={index} style={currentStyles.pointItem}>
                  <View style={currentStyles.pointHeader}>
                    <View style={currentStyles.pointBullet}>
                      <Text style={currentStyles.pointBulletText}>✓</Text>
                    </View>
                    <Text style={currentStyles.pointText}>{point}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={currentStyles.noContentText}>{t('study_lesson.no_key_points')}</Text>
          )}
        </View>

        {/* Spacer for navigation buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={currentStyles.navigationContainer}>
        {previousLesson ? (
          <TouchableOpacity
            style={currentStyles.navButtonPrev}
            onPress={() => onNavigateLesson(previousLesson)}
          >
            <Text style={currentStyles.navButtonPrevText}>
              {isRTL ? '→' : '←'} {t('study_lesson.previous')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={currentStyles.navButtonPlaceholder} />
        )}

        {nextLesson ? (
          <TouchableOpacity
            style={currentStyles.navButtonNext}
            onPress={() => onNavigateLesson(nextLesson)}
          >
            <Text style={currentStyles.navButtonNextText}>
              {t('study_lesson.next')} {isRTL ? '←' : '→'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={currentStyles.navButtonNext} onPress={onBack}>
            <Text style={currentStyles.navButtonNextText}>{t('study_lesson.back_to_chapters')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.headerText,
  },
  chapterBadge: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: theme.colors.headerText,
    marginBottom: 8,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}20`,
  },
  pointsIcon: {
    backgroundColor: '#10b98120',
  },
  sectionIconText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    color: theme.colors.text,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  noContentText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    textAlign: isRTL ? 'right' : 'left',
  },
  pointsList: {
    gap: 12,
  },
  pointItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border || '#e5e7eb',
  },
  pointHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  pointBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10b981',
    flexShrink: 0,
  },
  pointBulletText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: isRTL ? 8 : 0,
    marginRight: isRTL ? 0 : 8,
  },
  explanationContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#e5e7eb',
    marginLeft: isRTL ? 0 : 36,
    marginRight: isRTL ? 36 : 0,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: isRTL ? 'right' : 'left',
  },
  navigationContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  navButtonPrev: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
  },
  navButtonPrevText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  navButtonNext: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  navButtonNextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  navButtonPlaceholder: {
    width: 100,
  },
});

export default StudyLessonScreen;
