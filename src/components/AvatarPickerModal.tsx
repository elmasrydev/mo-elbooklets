import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { tryFetchWithFallback } from '../config/api';
import { layout } from '../config/layout';

interface AvatarItem {
  id: string;
  name: string;
  url: string;
  gender?: string | null;
}

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 30;
const REMOVE_KEY = '__remove__';

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ visible, onClose }) => {
  const { user, updateUser } = useAuth();
  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const currentId = user?.selectedAvatar?.id ?? null;

  const fetchAvatars = useCallback(
    async (pageToLoad: number) => {
      try {
        setLoading(true);
        setError(null);
        const token = await SecureStore.getItemAsync('auth_token');
        const result = await tryFetchWithFallback(
          `query Avatars($gender: String, $first: Int, $page: Int) {
            avatars(gender: $gender, first: $first, page: $page) {
              data { id name url gender }
              paginatorInfo { currentPage lastPage }
            }
          }`,
          { gender: user?.gender || null, first: PAGE_SIZE, page: pageToLoad },
          token || undefined,
        );
        const payload = result.data?.avatars;
        if (payload?.data) {
          setAvatars((prev) => (pageToLoad === 1 ? payload.data : [...prev, ...payload.data]));
          setPage(payload.paginatorInfo?.currentPage || pageToLoad);
          setLastPage(payload.paginatorInfo?.lastPage || pageToLoad);
        } else {
          setError(t('avatar_picker.error', 'Could not load avatars'));
        }
      } catch {
        setError(t('avatar_picker.error', 'Could not load avatars'));
      } finally {
        setLoading(false);
      }
    },
    [user?.gender, t],
  );

  useEffect(() => {
    if (visible) {
      setAvatars([]);
      setPage(1);
      setLastPage(1);
      fetchAvatars(1);
    }
  }, [visible, fetchAvatars]);

  const selectAvatar = async (avatarId: string | null) => {
    if (savingKey) return;
    try {
      setSavingKey(avatarId ?? REMOVE_KEY);
      const token = await SecureStore.getItemAsync('auth_token');
      const result = await tryFetchWithFallback(
        `mutation UpdateAvatar($avatarId: ID) {
          updateProfile(input: { avatar_id: $avatarId }) {
            id
            selectedAvatar { id name url gender }
          }
        }`,
        { avatarId },
        token || undefined,
      );
      if (result.data?.updateProfile) {
        await updateUser({
          selectedAvatar: result.data.updateProfile.selectedAvatar ?? null,
        } as any);
        onClose();
      } else {
        setError(t('avatar_picker.save_error', 'Could not update avatar'));
      }
    } catch {
      setError(t('avatar_picker.save_error', 'Could not update avatar'));
    } finally {
      setSavingKey(null);
    }
  };

  const s = useMemo(
    () => createStyles(theme, common, spacing, borderRadius, typography, fontWeight),
    [theme, common, spacing, borderRadius, typography, fontWeight],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.title}>{t('avatar_picker.title', 'Choose your avatar')}</Text>
            <TouchableOpacity testID="avatar-picker-close" onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {currentId ? (
            <TouchableOpacity
              style={s.removeRow}
              onPress={() => selectAvatar(null)}
              disabled={!!savingKey}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              <Text style={s.removeText}>{t('avatar_picker.remove', 'Remove current avatar')}</Text>
              {savingKey === REMOVE_KEY ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : null}
            </TouchableOpacity>
          ) : null}

          {loading && avatars.length === 0 ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : error && avatars.length === 0 ? (
            <View style={s.center}>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchAvatars(1)} style={s.retryBtn}>
                <Text style={s.retryText}>{t('common.retry', 'Retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={avatars}
              keyExtractor={(it) => it.id}
              numColumns={4}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={s.column}
              contentContainerStyle={s.grid}
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (!loading && page < lastPage) fetchAvatars(page + 1);
              }}
              renderItem={({ item }) => {
                const selected = item.id === currentId;
                const saving = savingKey === item.id;
                return (
                  <TouchableOpacity
                    style={s.tileWrap}
                    activeOpacity={0.8}
                    disabled={!!savingKey}
                    onPress={() => selectAvatar(item.id)}
                  >
                    <View style={[s.tile, selected && s.tileSelected]}>
                      <Image source={{ uri: item.url }} style={s.tileImg} resizeMode="cover" />
                      {saving ? (
                        <View style={s.tileOverlay}>
                          <ActivityIndicator color="#fff" />
                        </View>
                      ) : null}
                      {selected ? (
                        <View style={s.checkBadge}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                loading && avatars.length > 0 ? (
                  <ActivityIndicator
                    style={{ marginVertical: spacing.md }}
                    color={theme.colors.primary}
                  />
                ) : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (
  theme: any,
  common: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: borderRadius['2xl'],
      borderTopRightRadius: borderRadius['2xl'],
      paddingTop: spacing.sm,
      maxHeight: '82%',
      paddingBottom: Math.max(common.insets.bottom, spacing.md),
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
      paddingVertical: spacing.ssm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.error + '12',
    },
    removeText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.error,
      flex: 1,
      textAlign: common.textAlign,
    },
    center: { paddingVertical: spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
    errorText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
    },
    retryBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
    },
    retryText: { ...typography('caption'), ...fontWeight('bold'), color: '#fff' },
    grid: { padding: spacing.md, gap: spacing.sm },
    column: { justifyContent: 'space-between', marginBottom: spacing.sm },
    tileWrap: { width: '23%', aspectRatio: 1 },
    tile: {
      flex: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    tileSelected: { borderColor: theme.colors.primary },
    tileImg: { width: '100%', height: '100%', backgroundColor: '#DBEAFA' },
    tileOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default AvatarPickerModal;
