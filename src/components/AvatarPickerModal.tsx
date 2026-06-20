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

type Gender = 'male' | 'female';

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 30;
const asGender = (g?: string | null): Gender => (g === 'female' ? 'female' : 'male');

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ visible, onClose }) => {
  const { user, updateUser } = useAuth();
  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const currentId = user?.selectedAvatar?.id ?? null;
  const currentGender = asGender(user?.gender);

  const [gender, setGender] = useState<Gender>(currentGender);
  const [selectedId, setSelectedId] = useState<string | null>(currentId);
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAvatars = useCallback(
    async (g: Gender, pageToLoad: number) => {
      try {
        setLoading(true);
        setError(null);
        const token = await SecureStore.getItemAsync('auth_token');
        const result = await tryFetchWithFallback(
          `query Avatars($gender: String, $first: Int!, $page: Int) {
            avatars(gender: $gender, first: $first, page: $page) {
              data { id name url gender }
              paginatorInfo { currentPage lastPage }
            }
          }`,
          { gender: g, first: PAGE_SIZE, page: pageToLoad },
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
    [t],
  );

  // On open: reset to the user's current gender/avatar and load that gender's list.
  useEffect(() => {
    if (!visible) return;
    setGender(currentGender);
    setSelectedId(currentId);
    setAvatars([]);
    setPage(1);
    setLastPage(1);
    fetchAvatars(currentGender, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const switchGender = (g: Gender) => {
    if (g === gender || saving) return;
    setGender(g);
    setSelectedId(null); // cross-gender — force a fresh pick
    setAvatars([]);
    setPage(1);
    setLastPage(1);
    fetchAvatars(g, 1);
  };

  const dirty = gender !== currentGender || selectedId !== currentId;
  const canConfirm = !saving && selectedId !== null && dirty;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      setSaving(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      const result = await tryFetchWithFallback(
        `mutation UpdateProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            id
            gender
            selectedAvatar { id name url gender }
          }
        }`,
        { input: { gender, avatar_id: selectedId } },
        token || undefined,
      );
      if (result.data?.updateProfile) {
        await updateUser({
          gender: result.data.updateProfile.gender ?? gender,
          selectedAvatar: result.data.updateProfile.selectedAvatar ?? null,
        } as any);
        onClose();
      } else {
        setError(t('avatar_picker.save_error', 'Could not update avatar'));
      }
    } catch {
      setError(t('avatar_picker.save_error', 'Could not update avatar'));
    } finally {
      setSaving(false);
    }
  };

  const s = useMemo(
    () => createStyles(theme, common, spacing, borderRadius, typography, fontWeight),
    [theme, common, spacing, borderRadius, typography, fontWeight],
  );

  const GenderPill = ({ value, label }: { value: Gender; label: string }) => {
    const active = gender === value;
    return (
      <TouchableOpacity
        style={[s.genderPill, active && s.genderPillActive]}
        onPress={() => switchGender(value)}
        activeOpacity={0.8}
        disabled={saving}
      >
        <Ionicons
          name={value === 'female' ? 'female' : 'male'}
          size={16}
          color={active ? '#fff' : theme.colors.textSecondary}
        />
        <Text style={[s.genderPillText, active && s.genderPillTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

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

          {/* Gender toggle */}
          <View style={s.genderRow}>
            <GenderPill value="male" label={t('avatar_picker.male', 'Male')} />
            <GenderPill value="female" label={t('avatar_picker.female', 'Female')} />
          </View>

          <View style={s.body}>
            {loading && avatars.length === 0 ? (
              <View style={s.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : error && avatars.length === 0 ? (
              <View style={s.center}>
                <Text style={s.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => fetchAvatars(gender, 1)} style={s.retryBtn}>
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
                  if (!loading && page < lastPage) fetchAvatars(gender, page + 1);
                }}
                renderItem={({ item }) => {
                  const selected = item.id === selectedId;
                  return (
                    <TouchableOpacity
                      style={s.tileWrap}
                      activeOpacity={0.8}
                      disabled={saving}
                      onPress={() => setSelectedId(item.id)}
                    >
                      <View style={[s.tile, selected && s.tileSelected]}>
                        <Image source={{ uri: item.url }} style={s.tileImg} resizeMode="cover" />
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

          {/* Confirm */}
          <TouchableOpacity
            testID="avatar-picker-confirm"
            style={[s.confirmBtn, !canConfirm && s.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.confirmText}>{t('common.confirm', 'Confirm')}</Text>
            )}
          </TouchableOpacity>
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
      height: '82%',
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
    genderRow: {
      flexDirection: common.rowDirection,
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    genderPill: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.ssm,
      borderRadius: borderRadius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    genderPillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    genderPillText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    genderPillTextActive: { color: '#fff' },
    body: { flex: 1 },
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
    confirmBtn: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      height: 50,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnDisabled: { opacity: 0.4 },
    confirmText: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: '#fff',
    },
  });

export default AvatarPickerModal;
