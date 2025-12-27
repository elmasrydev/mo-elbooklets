import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { tryFetchWithFallback } from '../../config/api';
// import { useQuery } from '@apollo/client';
// import { SUBJECTS_FOR_USER_GRADE_QUERY, Subject } from '../../lib/graphql';

// Temporary type for testing
interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface QuizSubjectsScreenProps {
  onSubjectSelect: (subject: Subject) => void;
  onBack: () => void;
}

const QuizSubjectsScreen: React.FC<QuizSubjectsScreenProps> = ({ onSubjectSelect, onBack }) => {
  const { theme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);



  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const result = await tryFetchWithFallback(`
        query SubjectsForUserGrade {
          subjectsForUserGrade {
            id
            name
            description
          }
        }
      `, undefined, token);
      if (result.data?.subjectsForUserGrade) {
        setSubjects(result.data.subjectsForUserGrade);
      } else {
        setError(result.errors?.[0]?.message || 'Failed to load subjects');
      }
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
      setError(err.message || 'An error occurred while loading subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectPress = (subject: Subject) => {
    onSubjectSelect(subject);
  };

  if (loading) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
            <Text style={styles(theme).backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>Choose Subject</Text>
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles(theme).loadingText}>Loading subjects...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
            <Text style={styles(theme).backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>Choose Subject</Text>
        </View>
        <View style={styles(theme).errorContainer}>
          <Text style={styles(theme).errorIcon}>⚠️</Text>
          <Text style={styles(theme).errorTitle}>Error Loading Subjects</Text>
          <Text style={styles(theme).errorText}>{error}</Text>
          <TouchableOpacity style={styles(theme).retryButton} onPress={fetchSubjects}>
            <Text style={styles(theme).retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
          <Text style={styles(theme).backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>Choose Subject</Text>
        <Text style={styles(theme).headerSubtitle}>Select a subject to start your quiz</Text>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        <View style={styles(theme).subjectsGrid}>
          {subjects.map((subject: Subject) => (
            <TouchableOpacity
              key={subject.id}
              style={styles(theme).subjectCard}
              onPress={() => handleSubjectPress(subject)}
            >
              <View style={styles(theme).subjectIcon}>
                <Text style={styles(theme).subjectIconText}>
                  {getSubjectIcon(subject.name)}
                </Text>
              </View>
              <Text style={styles(theme).subjectName}>{subject.name}</Text>
              <Text style={styles(theme).subjectDescription}>
                {subject.description || 'Test your knowledge'}
              </Text>
              <View style={styles(theme).subjectStats}>
                <Text style={styles(theme).subjectStatsText}>
                  Tap to start quiz
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {subjects.length === 0 && (
          <View style={styles(theme).emptyState}>
            <Text style={styles(theme).emptyStateIcon}>📚</Text>
            <Text style={styles(theme).emptyStateTitle}>No Subjects Available</Text>
            <Text style={styles(theme).emptyStateSubtitle}>
              No subjects are available for your grade level at the moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Helper function to get subject icon
const getSubjectIcon = (subjectName: string): string => {
  const name = subjectName.toLowerCase();
  if (name.includes('math')) return '🔢';
  if (name.includes('english') || name.includes('language')) return '📝';
  if (name.includes('science')) return '🔬';
  if (name.includes('history') || name.includes('social')) return '📜';
  if (name.includes('art')) return '🎨';
  if (name.includes('music')) return '🎵';
  if (name.includes('physical') || name.includes('sport')) return '⚽';
  if (name.includes('computer') || name.includes('tech')) return '💻';
  return '📖';
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.headerText,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
    color: theme.colors.headerSubtitle,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.buttonPrimary,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  subjectCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: theme.colors.iconBackground,
  },
  subjectIconText: {
    fontSize: 28,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.text,
  },
  subjectDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    color: theme.colors.textSecondary,
  },
  subjectStats: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectStatsText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: theme.colors.card,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
});

export default QuizSubjectsScreen;
