import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../hooks/useTypography';

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
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
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
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.textTertiary}
                style={styles.inputIconLeft}
              />
              <TextInput
                style={[
                  styles.input,
                  typography('body'),
                  { color: theme.colors.text, textAlign: 'left' },
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.textTertiary}
                value={searchValue}
                onChangeText={onSearchChange}
                autoFocus={true}
              />
              {searchValue.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
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

                {!loading && data.length === 0 && (
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
      </TouchableOpacity>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIconLeft: {
    marginEnd: 8,
  },
  input: {
    flex: 1,
    // fontSize handled by typography('body')
    height: '100%',
  },
  clearButton: {
    padding: 4,
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
});

export default SearchablePickerModal;
