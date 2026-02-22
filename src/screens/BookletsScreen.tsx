import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../config/layout';
import { useTypography } from '../hooks/useTypography';

const BookletsScreen: React.FC = () => {
  const common = useCommonStyles();
  const { theme } = useTheme();
  const { typography } = useTypography();

  return (
    <View style={common.container}>
      {/* Standardized Header */}
      <View style={common.header}>
        <View style={common.headerTextWrapper}>
          <Text style={common.headerTitle}> Booklets </Text>
          <Text style={common.headerSubtitle}> Explore available learning materials </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: 100 }}
      >
        <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.emptyStateIcon}>📚</Text>
          <Text style={[typography('h3'), styles.emptyStateTitle, { color: theme.colors.text }]}>
            No booklets available
          </Text>
          <Text
            style={[
              typography('body'),
              styles.emptyStateSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Booklets will appear here once they are added to the system
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    textAlign: 'center',
  },
});

export default BookletsScreen;
