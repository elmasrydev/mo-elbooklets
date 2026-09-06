import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';
import SearchBar from './SearchBar';
import { shouldOfferAddNew, shouldWarnInvalidName } from '../utils/pickerAddRow';
import { NAME_MAX_LENGTH } from '../utils/validators';

interface SearchablePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  title: string;
  placeholder: string;
  data: any[];
  loading?: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  selectedId?: string | number;
  emptyMessage?: string;
  searchHelperText?: string;
  /**
   * When provided, a "Can't find it? Add <typed>" row is shown once the user has
   * typed something with no exact match, letting them create their own entry.
   */
  onAddNew?: (typedName: string) => void;
  /** Shows a spinner + disables the add row while the create request is in flight. */
  addingNew?: boolean;
}

const SearchablePickerModal: React.FC<SearchablePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  title,
  placeholder,
  data,
  loading,
  searchValue,
  onSearchChange,
  selectedId,
  emptyMessage,
  searchHelperText,
  onAddNew,
  addingNew,
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();

  const trimmedSearch = searchValue.trim();
  const canAdd = !!onAddNew && !loading;
  const showAddRow = canAdd && shouldOfferAddNew(data, searchValue);
  // The search box is deliberately unfiltered so any existing entry stays
  // findable; this tells the user why "Add …" didn't appear (BKLT-318).
  const showInvalidNameHint = canAdd && shouldWarnInvalidName(data, searchValue);

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* The dismiss target is a SIBLING behind the sheet, not its parent —
            as a parent it also received every tap that bubbled up from inside
            the sheet, so tapping a list row or the search box closed the
            picker instead of selecting. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('common.close')}
        />
        <View style={[styles.bottomModal, { backgroundColor: theme.colors.card, height: '75%' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text
              style={[
                styles.modalTitle,
                typography('h3'),
                fontWeight('700'),
                { color: theme.colors.text },
              ]}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <SearchBar
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={placeholder}
              autoFocus
              maxLength={onAddNew ? NAME_MAX_LENGTH : undefined}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              style={[styles.searchBox, { backgroundColor: theme.colors.background }]}
            />
          </View>

          <FlatList
            style={styles.list}
            data={data}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                {loading && (
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.loader}
                  />
                )}

                {!loading && data.length === 0 && !showAddRow && !showInvalidNameHint && (
                  <View style={styles.emptyContainer}>
                    <Text
                      style={[
                        styles.emptyText,
                        typography('body'),
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {searchValue.length > 0
                        ? emptyMessage || t('common.no_results')
                        : searchHelperText ||
                          t('profile.start_typing_to_search', 'Start typing to search...')}
                    </Text>
                  </View>
                )}
              </>
            }
            ListFooterComponent={
              showAddRow ? (
                <TouchableOpacity
                  style={[styles.addRow, { borderTopColor: theme.colors.border }]}
                  onPress={() => !addingNew && onAddNew?.(trimmedSearch)}
                  disabled={addingNew}
                  testID="picker-add-new"
                >
                  {addingNew ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.addText,
                      typography('body'),
                      fontWeight('600'),
                      { color: theme.colors.primary },
                    ]}
                    numberOfLines={2}
                  >
                    {t('profile.cant_find_add', 'Can\'t find it? Add "{{name}}"', {
                      name: trimmedSearch,
                    })}
                  </Text>
                </TouchableOpacity>
              ) : showInvalidNameHint ? (
                <View style={styles.emptyContainer} testID="picker-invalid-name">
                  <Text
                    style={[
                      styles.emptyText,
                      typography('body'),
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {t('profile.name_invalid_chars')}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { borderBottomColor: theme.colors.border },
                  String(selectedId) === String(item.id) && {
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    typography('body'),
                    {
                      color:
                        String(selectedId) === String(item.id)
                          ? theme.colors.primary
                          : theme.colors.text,
                      textAlign: 'left',
                    },
                  ]}
                >
                  {item.name}
                </Text>
                {String(selectedId) === String(item.id) && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  modalTitle: {
    // fontSize and fontFamily handled by typography('h3')
  },
  closeButton: {
    position: 'absolute',
    end: 20,
    top: 0,
  },
  searchContainer: {
    padding: 16,
  },
  // Only the height differs from <SearchBar>'s defaults; background is themed inline.
  searchBox: {
    height: 50,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    // fontSize handled by typography('body')
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    flex: 1,
    // fontSize handled by typography('body')
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  addText: {
    flex: 1,
    marginStart: 10, // logical → flips with RTL
    textAlign: 'left', // native RTL flips to right
  },
});

export default SearchablePickerModal;
