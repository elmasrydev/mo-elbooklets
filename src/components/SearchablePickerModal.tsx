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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.bottomModal, { backgroundColor: theme.colors.card, height: '75%' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="search" size={20} color={theme.colors.textTertiary} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
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

          <ScrollView 
            style={styles.list} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          >
            {loading && (
              <ActivityIndicator 
                size="large" 
                color={theme.colors.primary} 
                style={styles.loader} 
              />
            )}
            
            {!loading && data.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
                  {searchValue.length > 0 
                    ? (emptyMessage || t('common.no_results')) 
                    : (searchHelperText || t('profile.start_typing_to_search', 'Start typing to search...'))}
                </Text>
              </View>
            )}

            {!loading && data.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pickerItem,
                  { borderBottomColor: theme.colors.border },
                  String(selectedId) === String(item.id) && { backgroundColor: theme.colors.primary + '15' }
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={[
                  styles.pickerItemText,
                  { 
                    color: String(selectedId) === String(item.id) ? theme.colors.primary : theme.colors.text,
                    textAlign: isRTL ? 'right' : 'left'
                  }
                ]}>
                  {item.name}
                </Text>
                {String(selectedId) === String(item.id) && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
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
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
  },
});

export default SearchablePickerModal;
