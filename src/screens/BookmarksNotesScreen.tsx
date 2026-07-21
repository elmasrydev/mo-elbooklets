import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import UnifiedHeader from '../components/UnifiedHeader';
import { ConfirmModal } from '../components/ConfirmModal';

import { layout } from '../config/layout';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import {
  DeletePointNoteDocument,
  MySavedPointsDocument,
  MySavedPointsQuery,
  SavePointNoteDocument,
} from '../generated/graphql';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import { INPUT_TEXT_ALIGN } from '../lib/rtl';

type SavedPoint = MySavedPointsQuery['mySavedPoints'][number];

const NoteModal: React.FC<{
  visible: boolean;
  initialNote: string;
  title: string;
  onClose: () => void;
  onSave: (note: string) => void;
  theme: any;
  spacing: any;
  borderRadius: any;
  t: any;
  typography: any;
  onDelete?: () => void;
}> = ({
  visible,
  initialNote,
  title,
  onClose,
  onSave,
  theme,
  spacing,
  borderRadius,
  t,
  typography,
  onDelete,
}) => {
  const [note, setNote] = useState(initialNote);

  React.useEffect(() => {
    setNote(initialNote);
  }, [initialNote, visible]);

  return (
    <ConfirmModal
      visible={visible}
      title={title}
      confirmLabel={t('common.save')}
      cancelLabel={t('common.cancel')}
      onConfirm={() => onSave(note)}
      onCancel={onClose}
    >
      <View style={{ marginTop: spacing.md }}>
        <TextInput
          style={{
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            height: 120,
            textAlignVertical: 'top',
            color: theme.colors.text,
            ...typography('body'),
            textAlign: INPUT_TEXT_ALIGN,
          }}
          placeholder={t('study_lesson.notes_placeholder', 'Add your note here...')}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          value={note}
          onChangeText={setNote}
          autoFocus
        />
        {onDelete && initialNote && (
          <TouchableOpacity
            onPress={onDelete}
            style={{
              marginTop: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.sm,
              backgroundColor: theme.colors.error + '10',
              borderRadius: borderRadius.md,
              marginBottom: 14,
            }}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.error}
              style={{ marginRight: 8 }}
            />
            <Text style={{ ...typography('caption', '700'), color: theme.colors.error }}>
              {t('common.delete', 'Delete')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ConfirmModal>
  );
};

const BookmarksNotesScreen: React.FC = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [localAlert, setLocalAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SavedPoint | null>(null);

  const { data, loading, refetch } = useQuery(MySavedPointsDocument, {
    notifyOnNetworkStatusChange: true,
  });
  const savedPoints = data?.mySavedPoints ?? [];

  // Notes and bookmarks can be edited inside the lesson reader, so re-check on
  // every focus.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredData = useMemo(() => {
    if (activeTab === 'bookmarks') {
      return savedPoints.filter((p) => p.is_bookmarked);
    } else {
      return savedPoints.filter((p) => !!p.note_content);
    }
  }, [savedPoints, activeTab]);

  const currentStyles = useMemo(
    () => styles(theme, spacing, borderRadius, isRTL, typography, fontWeight),
    [theme, spacing, borderRadius, isRTL, typography, fontWeight],
  );

  const handleItemPress = (item: SavedPoint) => {
    navigation.navigate('StudyLesson', {
      lesson: item.lesson,
      // Pass the point ID to scroll to it
      initialPointId: item.lessonPoint.id,
      fromBookmarks: true,
    });
  };

  const handleEditNote = (item: SavedPoint) => {
    setSelectedItem(item);
    setNoteModalVisible(true);
  };

  const [savePointNote] = useMutation(SavePointNoteDocument);
  const [deletePointNote] = useMutation(DeletePointNoteDocument);
  const client = useApolloClient();

  const handleSaveNote = async (note: string) => {
    if (!selectedItem) return;
    try {
      // The mutation returns the row, and UserSavedPoint is normalized by id —
      // the cached list updates itself, so there is no local copy to patch.
      const result = await savePointNote({
        variables: {
          lessonId: selectedItem.lesson.id,
          lessonPointId: selectedItem.lessonPoint.id,
          noteContent: note,
        },
      });

      if (result.data?.savePointNote?.success) {
        setNoteModalVisible(false);
        setSelectedItem(null);

        setLocalAlert({
          visible: true,
          title: t('common.success'),
          message: t('study_lesson.note_saved_success', 'Note saved successfully'),
        });
      }
    } catch (err) {
      console.error('Save note error:', err);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedItem) return;
    const deletedId = selectedItem.id;
    try {
      const result = await deletePointNote({
        variables: { lessonPointId: selectedItem.lessonPoint.id },
      });

      if (result.data?.deletePointNote?.success) {
        // A row that still has a bookmark comes back updated (and the
        // normalized write drops it from the notes tab on its own). When the
        // backend returns nothing the row is gone for good — evict it so it
        // disappears from every cached list.
        if (!result.data.deletePointNote.savedPoint) {
          client.cache.evict({
            id: client.cache.identify({ __typename: 'UserSavedPoint', id: deletedId }),
          });
          client.cache.gc();
        }
        setNoteModalVisible(false);
        setSelectedItem(null);

        setLocalAlert({
          visible: true,
          title: t('common.success'),
          message: t('study_lesson.note_deleted_success', 'Note deleted successfully'),
        });
      }
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  const renderItem = ({ item }: { item: SavedPoint }) => (
    <TouchableOpacity
      style={currentStyles.card}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={currentStyles.cardHeader}>
        <View style={currentStyles.lessonInfo}>
          <Text style={currentStyles.chapterName} numberOfLines={1}>
            {item.lesson?.chapter?.name}
          </Text>
          <Text style={currentStyles.lessonName} numberOfLines={1}>
            {item.lesson?.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => handleEditNote(item)}>
            <Ionicons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Ionicons
            name={activeTab === 'bookmarks' ? 'bookmark' : 'document-text'}
            size={20}
            color={theme.colors.primary}
          />
        </View>
      </View>

      <View style={currentStyles.pointContainer}>
        <Text style={currentStyles.pointTitle}>{item.lessonPoint.title}</Text>
        {item.lessonPoint.explanation && (
          <Text style={currentStyles.pointExplanation} numberOfLines={2}>
            {item.lessonPoint.explanation}
          </Text>
        )}
      </View>

      {item.note_content && (
        <View style={currentStyles.noteContainer}>
          <Ionicons name="pencil" size={14} color={theme.colors.primary} />
          <Text style={currentStyles.noteText}>{item.note_content}</Text>
        </View>
      )}

      <Text style={currentStyles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={common.container}>
      <UnifiedHeader showBackButton title={t('more_screen.bookmarks_notes', 'Bookmarks & Notes')} />

      <View style={currentStyles.tabContainer}>
        <View style={currentStyles.segmentedContainer}>
          <TouchableOpacity
            style={[
              currentStyles.segmentedButton,
              activeTab === 'bookmarks' && currentStyles.segmentedButtonActive,
            ]}
            onPress={() => setActiveTab('bookmarks')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                currentStyles.segmentedText,
                activeTab === 'bookmarks' && currentStyles.segmentedTextActive,
              ]}
            >
              {t('common.bookmarks', 'Bookmarks')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              currentStyles.segmentedButton,
              activeTab === 'notes' && currentStyles.segmentedButtonActive,
            ]}
            onPress={() => setActiveTab('notes')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                currentStyles.segmentedText,
                activeTab === 'notes' && currentStyles.segmentedTextActive,
              ]}
            >
              {t('common.notes', 'Notes')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, paddingTop: 20 }}>
          <GenericListSkeleton numItems={6} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={currentStyles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={currentStyles.emptyContainer}>
              <View style={currentStyles.emptyIconContainer}>
                <Ionicons
                  name={activeTab === 'bookmarks' ? 'bookmark-outline' : 'document-text-outline'}
                  size={80}
                  color={theme.colors.primary + '33'}
                />
              </View>
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

              <TouchableOpacity
                style={currentStyles.studyButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Study' })}
              >
                <Text style={currentStyles.studyButtonText}>
                  {t('home_screen.my_subjects', 'Start Revising')}
                </Text>
                <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <NoteModal
        visible={noteModalVisible}
        initialNote={selectedItem?.note_content || ''}
        title={selectedItem?.lessonPoint.title || ''}
        onClose={() => {
          setNoteModalVisible(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        theme={theme}
        spacing={spacing}
        borderRadius={borderRadius}
        t={t}
        typography={typography}
      />

      <ConfirmModal
        visible={!!localAlert?.visible}
        title={localAlert?.title || ''}
        message={localAlert?.message || ''}
        confirmLabel={t('common.ok', 'OK')}
        showCancel={false}
        onConfirm={() => {
          if (localAlert) {
            setLocalAlert((prev) => (prev ? { ...prev, visible: false } : null));
            setTimeout(() => {
              setLocalAlert(null);
            }, 500);
          }
        }}
        onCancel={() => {
          if (localAlert) {
            setLocalAlert((prev) => (prev ? { ...prev, visible: false } : null));
            setTimeout(() => {
              setLocalAlert(null);
            }, 500);
          }
        }}
      />
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
    },
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: theme.mode === 'light' ? '#E2E8F0' : theme.colors.border,
      borderRadius: borderRadius.md || 12,
      padding: 3,
      flex: 1,
    },
    segmentedButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: (borderRadius.md || 12) - 3,
    },
    segmentedButtonActive: {
      backgroundColor: theme.mode === 'light' ? '#FFFFFF' : theme.colors.background,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    segmentedText: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
    },
    segmentedTextActive: {
      color: theme.colors.primary,
      ...fontWeight('700'),
    },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 40,
      paddingTop: 8,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl || 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.03,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    lessonInfo: {
      flex: 1,
      marginEnd: 12,
    },
    chapterName: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginBottom: 2,
      textAlign: 'left',
    },
    lessonName: {
      ...typography('body'),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'left',
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
      textAlign: 'left',
    },
    pointExplanation: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      lineHeight: 18,
      textAlign: 'left',
    },
    noteContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.primary + '0A',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: borderRadius.sm || 6,
      borderStartWidth: 3,
      borderStartColor: theme.colors.primary,
      marginBottom: 12,
    },
    noteText: {
      ...typography('caption'),
      color: theme.colors.primary,
      flex: 1,
      textAlign: 'left',
    },
    dateText: {
      ...typography('tiny'),
      color: theme.colors.textTertiary,
      textAlign: 'right',
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
      marginBottom: 32,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.primary + '0D',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    studyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.full,
      gap: 8,
      ...layout.shadow,
    },
    studyButtonText: {
      ...typography('body'),
      ...fontWeight('700'),
      color: '#fff',
    },
  });

export default BookmarksNotesScreen;
