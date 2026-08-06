import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { QUIZ_COLORS } from '../../config/colors';

/**
 * Shared bottom sheet for the quiz surfaces — the reading-passage viewer and the
 * match "choose the answer" picker (from both mockups).
 *
 * Rendered inside a transparent native `Modal` so it overlays the whole WINDOW
 * (above the quiz nav footer), not just the subtree it is mounted in. This
 * matters because callers like MatchSlotList live inside the taking screen's
 * ScrollView — a plain absolute overlay would be clipped to the scroll content.
 * The veil fades with the Modal; the sheet slides up.
 */

type QuizBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional header chip (icon + label), e.g. "Reading passage". */
  chipIcon?: keyof typeof Ionicons.glyphMap;
  chipLabel?: string;
  /** Optional action rendered in the header before the Close pill (e.g. Clear). */
  headerAction?: React.ReactNode;
  /** Fraction of screen height the sheet may fill. */
  maxHeightRatio?: number;
  testID?: string;
};

const QuizBottomSheet: React.FC<QuizBottomSheetProps> = ({
  visible,
  onClose,
  children,
  chipIcon,
  chipLabel,
  headerAction,
  maxHeightRatio = 0.8,
  testID,
}) => {
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill} testID={testID}>
        <Pressable
          style={styles.veil}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', 'Close')}
        />
        <Animated.View
          entering={SlideInDown.duration(260)}
          style={[
            styles.sheet,
            {
              maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.grab} />
          <View style={styles.header}>
            {chipLabel ? (
              <View style={styles.chip}>
                {chipIcon && <Ionicons name={chipIcon} size={14} color={QUIZ_COLORS.navy} />}
                <Text style={[styles.chipText, typography('label'), fontWeight('700')]}>
                  {chipLabel}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.headerRight}>
              {headerAction}
              <Pressable
                style={styles.close}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
                testID={testID ? `${testID}-close` : undefined}
              >
                <Ionicons name="close" size={14} color={QUIZ_COLORS.secondary} />
                <Text style={[styles.closeText, typography('label'), fontWeight('700')]}>
                  {t('common.close', 'Close')}
                </Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '42%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 12,
  },
  grab: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7DDEA',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: QUIZ_COLORS.sky,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    color: QUIZ_COLORS.navy,
  },
  close: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF1F8',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  closeText: {
    color: QUIZ_COLORS.secondary,
  },
  scroll: {},
  scrollContent: {
    // Horizontal padding belongs on the content container, not the ScrollView's
    // outer style — the latter insets unevenly in RTL, pushing the answer cards
    // off-centre. Here it stays symmetric in both directions.
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
});

export default QuizBottomSheet;
