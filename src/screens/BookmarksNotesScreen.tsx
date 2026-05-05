import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import UnifiedHeader from '../components/UnifiedHeader';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GenericListSkeleton } from '../components/SkeletonLoader';

interface Bookmark {
  id: string;
  lessonPoint: {
    id: string;
    title: string;
    explanation?: string;
    lesson: {
      id: string;
      name: string;
      chapter: {
        id: string;
        name: string;
      };
    };
  };
  note?: string;
  createdAt: string;
}

interface Note {
  id: string;
  lessonPoint: {
    id: string;
    title: string;
    lesson: {
      id: string;
      name: string;
    };
  };
  content: string;
  updatedAt: string;
}

const BookmarksNotesScreen: React.FC = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query GetUserBookmarksAndNotes {
          userBookmarks {
            id
            lessonPoint {
              id
              title
              explanation
              lesson {
                id
                name
                chapter {
                  id
                  name
                }
              }
            }
            note
            createdAt
          }
          userNotes {
            id
            lessonPoint {
              id
              title
              lesson {
                id
                name
              }
            }
            content
            updatedAt
          }
        }`,
        undefined,
        token,
      );

      if (result.data) {
        setBookmarks(result.data.userBookmarks || []);
        setNotes(result.data.userNotes || []);
      }
    } catch (err) {
      console.error('Fetch bookmarks/notes error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const currentStyles = useMemo(
    () => styles(theme, spacing, borderRadius, isRTL, typography, fontWeight),
    [theme, spacing, borderRadius, isRTL, typography, fontWeight]
  );

  const handleBookmarkPress = (bookmark: Bookmark) => {
    navigation.navigate('StudyLesson', { 
      lesson: bookmark.lessonPoint.lesson,
      // We don't have allLessons here easily, but StudyLesson handles it
    });
  };

  const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={currentStyles.card}
      onPress={() => handleBookmarkPress(item)}
      activeOpacity={0.7}
    >
      <View style={currentStyles.cardHeader}>
        <View style={currentStyles.lessonInfo}>
          <Text style={currentStyles.chapterName} numberOfLines={1}>
            {item.lessonPoint.lesson.chapter.name}
          </Text>
          <Text style={currentStyles.lessonName} numberOfLines={1}>
            {item.lessonPoint.lesson.name}
          </Text>
        </View>
        <Ionicons name="bookmark" size={20} color={theme.colors.primary} />
      </View>
      
      <View style={currentStyles.pointContainer}>
        <Text style={currentStyles.pointTitle}>{item.lessonPoint.title}</Text>
        {item.lessonPoint.explanation && (
          <Text style={currentStyles.pointExplanation} numberOfLines={2}>
            {item.lessonPoint.explanation}
          </Text>
        )}
      </View>

      {item.note && (
        <View style={currentStyles.noteContainer}>
          <Ionicons name="pencil" size={14} color={theme.colors.primary} />
          <Text style={currentStyles.noteText}>{item.note}</Text>
        </View>
      )}

      <Text style={currentStyles.dateText}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={currentStyles.card}
      onPress={() => navigation.navigate('StudyLesson', { lesson: item.lessonPoint.lesson })}
      activeOpacity={0.7}
    >
      <View style={currentStyles.cardHeader}>
        <View style={currentStyles.lessonInfo}>
          <Text style={currentStyles.lessonName} numberOfLines={1}>
            {item.lessonPoint.lesson.name}
          </Text>
          <Text style={currentStyles.pointTitle} numberOfLines={1}>
            {item.lessonPoint.title}
          </Text>
        </View>
        <Ionicons name="document-text" size={20} color={theme.colors.primary} />
      </View>

      <View style={currentStyles.noteContentContainer}>
        <Text style={currentStyles.noteContentText}>{item.content}</Text>
      </View>

      <Text style={currentStyles.dateText}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );



  return (
    <View style={common.container}>
      <UnifiedHeader showBackButton title={t('more_screen.bookmarks_notes', 'Bookmarks & Notes')} />
      
      <View style={currentStyles.tabContainer}>
        <TouchableOpacity
          style={[currentStyles.tab, activeTab === 'bookmarks' && currentStyles.activeTab]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Text style={[currentStyles.tabText, activeTab === 'bookmarks' && currentStyles.activeTabText]}>
            {t('common.bookmarks', 'Bookmarks')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[currentStyles.tab, activeTab === 'notes' && currentStyles.activeTab]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[currentStyles.tabText, activeTab === 'notes' && currentStyles.activeTabText]}>
            {t('common.notes', 'Notes')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, paddingTop: 20 }}>
          <GenericListSkeleton numItems={6} />
        </View>
      ) : (
        <FlatList
          data={(activeTab === 'bookmarks' ? bookmarks : notes) as any}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'bookmarks' ? renderBookmarkItem as any : renderNoteItem as any}
          contentContainerStyle={currentStyles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={currentStyles.emptyContainer}>
              <Ionicons
                name={activeTab === 'bookmarks' ? 'bookmark-outline' : 'document-text-outline'}
                size={64}
                color={theme.colors.textTertiary}
              />
              <Text style={currentStyles.emptyTitle}>
                {activeTab === 'bookmarks' 
                  ? t('bookmarks.empty_title', 'No bookmarks yet')
                  : t('notes.empty_title', 'No notes yet')}
              </Text>
              <Text style={currentStyles.emptySubtitle}>
                {activeTab === 'bookmarks'
                  ? t('bookmarks.empty_subtitle', 'Bookmark key points to find them here later.')
                  : t('notes.empty_subtitle', 'Add notes to key points while studying.')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: layout.screenPadding,
      marginTop: 16,
      marginBottom: 8,
      gap: 12,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeTab: {
      backgroundColor: theme.colors.primary + '1A',
      borderColor: theme.colors.primary,
    },
    tabText: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 40,
      paddingTop: 8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      padding: 16,
      marginBottom: 16,
      ...layout.shadow,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    lessonInfo: {
      flex: 1,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    chapterName: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginBottom: 2,
      textAlign: isRTL ? 'right' : 'left',
    },
    lessonName: {
      ...typography('body'),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    pointContainer: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: borderRadius.md,
      marginBottom: 12,
    },
    pointTitle: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
    },
    pointExplanation: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      lineHeight: 18,
      textAlign: isRTL ? 'right' : 'left',
    },
    noteContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.primary + '0D',
      padding: 10,
      borderRadius: borderRadius.sm,
      marginBottom: 12,
    },
    noteText: {
      ...typography('caption'),
      color: theme.colors.primary,
      fontStyle: 'italic',
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    noteContentContainer: {
      marginBottom: 12,
    },
    noteContentText: {
      ...typography('body'),
      color: theme.colors.text,
      lineHeight: 20,
      textAlign: isRTL ? 'right' : 'left',
    },
    dateText: {
      ...typography('tiny'),
      color: theme.colors.textTertiary,
      textAlign: isRTL ? 'left' : 'right',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default BookmarksNotesScreen;
