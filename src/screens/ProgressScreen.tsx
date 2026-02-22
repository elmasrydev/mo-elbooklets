import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';

const ProgressScreen: React.FC = () => {
  const { theme } = useTheme();
  const { typography } = useTypography();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border },
        ]}
      >
        <Text style={[typography('h1'), styles.title, { color: theme.colors.text }]}>
          {' '}
          My Progress{' '}
        </Text>
        <Text style={[typography('body'), styles.subtitle, { color: theme.colors.textSecondary }]}>
          {' '}
          Track your learning journey{' '}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={[typography('h3'), styles.emptyStateTitle, { color: theme.colors.text }]}>
            {' '}
            No progress data{' '}
          </Text>
          <Text
            style={[
              typography('body'),
              styles.emptyStateSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Start learning to see your progress and achievements here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
  },
});

export default ProgressScreen;
